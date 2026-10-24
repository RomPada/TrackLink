import { createECDH } from "node:crypto";
const keys = createECDH("prime256v1");
const pub = keys.generateKeys(undefined, "uncompressed");
console.log("Store these values securely. Never commit them to GitHub.\n");
console.log(`VAPID_PUBLIC_KEY=${pub.toString("base64url")}`);
console.log(`VAPID_PRIVATE_KEY=${keys.getPrivateKey().toString("base64url")}`);
console.log("VAPID_SUBJECT=mailto:your-real-contact@example.com  # Replace with your own email\n");
