import "server-only";
import { createECDH, createPrivateKey, createHmac, createCipheriv, randomBytes, sign } from "node:crypto";

type PushKeys = { p256dh: string; auth: string };
export type PushSubscriptionData = { endpoint: string; keys: PushKeys };

type PushMessage = { title: string; body: string; url?: string; tag?: string };

function b64(bytes: Buffer | Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}
function decode(value: string) {
  return Buffer.from(value, "base64url");
}
function hkdfExtract(salt: Buffer, ikm: Buffer) {
  return createHmac("sha256", salt).update(ikm).digest();
}
function hkdfExpand(prk: Buffer, info: Buffer, length: number) {
  let output = Buffer.alloc(0);
  let previous = Buffer.alloc(0);
  for (let counter = 1; output.length < length; counter++) {
    previous = createHmac("sha256", prk)
      .update(Buffer.concat([previous, info, Buffer.from([counter])])).digest();
    output = Buffer.concat([output, previous]);
  }
  return output.subarray(0, length);
}
function info(label: string) {
  return Buffer.from(`${label}\0`, "utf8");
}

export function configuredForPush() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

export function publicVapidKey() {
  return process.env.VAPID_PUBLIC_KEY ?? "";
}

function getConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject || !/^(mailto:[^\s@]+@[^\s@]+|https:\/\/[^\s]+)$/.test(subject)) {
    throw new Error("Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and a valid VAPID_SUBJECT.");
  }
  if (decode(publicKey).length !== 65 || decode(privateKey).length !== 32) {
    throw new Error("Invalid VAPID key lengths; generate keys using npm run vapid:generate.");
  }
  return { publicKey, privateKey, subject };
}

export function safeEndpoint(value: string) {
  if (value.length > 2048) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (!host.includes(".") || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(":")) return false;
    return true;
  } catch {
    return false;
  }
}

function createVapidToken(endpoint: string, config: ReturnType<typeof getConfig>) {
  const url = new URL(endpoint);
  const audience = url.origin;
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(decode(config.privateKey));
  const pub = ecdh.getPublicKey();
  if (b64(pub) !== config.publicKey) throw new Error("VAPID public/private keys do not match.");

  const privateKey = createPrivateKey({
    format: "jwk",
    key: { kty: "EC", crv: "P-256", d: config.privateKey, x: b64(pub.subarray(1, 33)), y: b64(pub.subarray(33, 65)) },
  });
  const head = b64(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64(Buffer.from(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 3600, sub: config.subject })));
  const unsigned = `${head}.${body}`;
  const signature = sign("sha256", Buffer.from(unsigned), { key: privateKey, dsaEncoding: "ieee-p1363" });
  return `${unsigned}.${b64(signature)}`;
}

// RFC 8291 / RFC 8188, single-record aes128gcm Web Push encryption.
export function encryptPayload(keys: PushKeys, payload: string) {
  const recipientPublic = decode(keys.p256dh);
  const authenticationSecret = decode(keys.auth);
  if (recipientPublic.length !== 65 || recipientPublic[0] !== 0x04 || authenticationSecret.length < 16) {
    throw new Error("Invalid browser push encryption keys.");
  }
  const serverKeys = createECDH("prime256v1");
  const senderPublic = serverKeys.generateKeys();
  const sharedSecret = serverKeys.computeSecret(recipientPublic);
  const prkKey = hkdfExtract(authenticationSecret, sharedSecret);
  const ikm = hkdfExpand(prkKey, Buffer.concat([info("WebPush: info"), recipientPublic, senderPublic]), 32);
  const salt = randomBytes(16);
  const prk = hkdfExtract(salt, ikm);
  const cek = hkdfExpand(prk, info("Content-Encoding: aes128gcm"), 16);
  const nonce = hkdfExpand(prk, info("Content-Encoding: nonce"), 12);
  const plain = Buffer.concat([Buffer.from(payload), Buffer.from([0x02])]);
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]);
  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(Math.max(4096, plain.length + 16), 0);
  return Buffer.concat([salt, recordSize, Buffer.from([senderPublic.length]), senderPublic, encrypted]);
}

export async function deliverPush(subscription: PushSubscriptionData, message: PushMessage): Promise<number> {
  if (!safeEndpoint(subscription.endpoint)) throw new Error("Invalid push service endpoint.");
  const config = getConfig();
  const payload = JSON.stringify({
    title: message.title.slice(0, 100),
    body: message.body.slice(0, 300),
    url: "/admin",
    tag: message.tag?.slice(0, 40),
  });
  const bytes = encryptPayload(subscription.keys, payload);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: `vapid t=${createVapidToken(subscription.endpoint, config)}, k=${config.publicKey}`,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "3600",
        Urgency: "normal",
      },
      body: new Uint8Array(bytes),
      redirect: "error",
      signal: controller.signal,
    });
    return response.status;
  } finally {
    clearTimeout(timeout);
  }
}
