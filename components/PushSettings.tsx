"use client";

import { useCallback, useEffect, useState } from "react";

type Preferences = {
  every_click: boolean;
  new_visitor: boolean;
  milestones: boolean;
  daily_summary: boolean;
};

type Status = {
  configured: boolean;
  publicKey: string;
  preferences: Preferences;
  devices: number;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

async function pushRequest(payload: Record<string, unknown>) {
  const result = await fetch("/api/push", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const parsed = await result.json();
  if (!result.ok) throw new Error(parsed.error || `HTTP ${result.status}`);
  return parsed;
}

const preferenceLabels: Array<{ key: keyof Preferences; title: string; description: string }> = [
  { key: "every_click", title: "Every click", description: "Send a push for every counted visit (can be noisy)." },
  { key: "new_visitor", title: "New unique visitor", description: "Notify when an anonymous visitor ID appears for the first time." },
  { key: "milestones", title: "Click milestones", description: "Notify when a link reaches 100, 500, 1,000, 2,000… clicks." },
  { key: "daily_summary", title: "Daily summary", description: "Send yesterday's clicks and unique visitors once per day." },
];

export default function PushSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [supported, setSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  const refresh = useCallback(async () => {
    const result = await fetch("/api/push", { credentials: "same-origin", cache: "no-store" });
    const parsed = await result.json();
    if (!result.ok) throw new Error(parsed.error || `HTTP ${result.status}`);
    setStatus(parsed);
    setPreferences(parsed.preferences);
  }, []);

  useEffect(() => {
    let active = true;
    const canUsePush = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(canUsePush);
    void (async () => {
      try {
        await refresh();
        if (canUsePush) {
          const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/", updateViaCache: "none",
          });
          const existing = await registration.pushManager.getSubscription();
          if (active) setSubscription(existing ?? null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load push settings.");
      }
    })();
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, [refresh]);

  async function enableNotifications() {
    setError(""); setNotice(""); setWorking(true);
    try {
      if (!status?.configured || !status.publicKey) throw new Error("VAPID keys are not configured on this deployment.");
      // Invoke permission during the actual button click, before any other await.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was not granted. Check browser and Android notification settings.");
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      let newSubscription = await registration.pushManager.getSubscription();
      if (!newSubscription) {
        const keyBytes = urlBase64ToUint8Array(status.publicKey);
        newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
        });
      }
      try {
        await pushRequest({ action: "subscribe", subscription: newSubscription.toJSON() });
      } catch (err) {
        await newSubscription.unsubscribe();
        throw err;
      }
      setSubscription(newSubscription);
      setNotice("Push notifications enabled for this device.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not enable notifications."); }
    finally { setWorking(false); }
  }

  async function disableNotifications() {
    if (!subscription) return;
    setError(""); setNotice(""); setWorking(true);
    try {
      await pushRequest({ action: "unsubscribe", endpoint: subscription.endpoint });
      await subscription.unsubscribe();
      setSubscription(null);
      setNotice("Notifications disabled for this device.");
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not disable notifications."); }
    finally { setWorking(false); }
  }

  async function clearDevices() {
    if (!window.confirm("Remove every registered device? Notifications will stop on all devices until they subscribe again.")) return;
    setWorking(true); setError(""); setNotice("");
    try {
      await pushRequest({ action: "clear-devices" });
      await subscription?.unsubscribe();
      setSubscription(null);
      await refresh();
      setNotice("All device registrations removed.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not remove devices."); }
    finally { setWorking(false); }
  }

  async function sendTest() {
    if (!subscription) return;
    setWorking(true); setError(""); setNotice("");
    try {
      await pushRequest({ action: "test", endpoint: subscription.endpoint });
      setNotice("Test push sent to your browser's push service. Delivery may take a moment.");
    } catch (err) { setError(err instanceof Error ? err.message : "Test failed."); }
    finally { setWorking(false); }
  }

  async function savePreferences() {
    if (!preferences) return;
    setWorking(true); setError(""); setNotice("");
    try {
      await pushRequest({ action: "preferences", preferences });
      await refresh();
      setNotice("Notification preferences saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save preferences."); }
    finally { setWorking(false); }
  }

  return (
    <section className="panel push-settings" id="notification-settings">
      <div className="panel-heading">
        <div>
          <h2>Notifications / PWA</h2>
          <p className="muted">Install TrackLink on Android and receive secure Web Push notifications.</p>
        </div>
        <span className={`status ${subscription ? "status-on" : "status-off"}`}>
          {subscription ? "This device: enabled" : "This device: disabled"}
        </span>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}
      {!supported && <div className="push-note">This browser does not support Web Push. Use an up-to-date Chrome or Edge on Android with HTTPS (localhost is also supported for development).</div>}
      {status && !status.configured && <div className="push-note">To enable notifications, configure VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT on the server.</div>}
      <div className="push-summary">
        <div><span className="muted">Registered devices</span><strong>{status?.devices ?? "—"}</strong></div>
        <div><span className="muted">PWA</span><strong>Available</strong></div>
        <div><span className="muted">Push setup</span><strong>{status?.configured ? "Ready" : "Not configured"}</strong></div>
      </div>
      <div className="push-buttons">
        {!subscription ? (
          <button type="button" className="button button-primary" disabled={!supported || !status?.configured || working} onClick={() => void enableNotifications()}>
            Enable notifications
          </button>
        ) : (
          <button type="button" className="button button-ghost" disabled={working} onClick={() => void disableNotifications()}>
            Disable on this device
          </button>
        )}
        <button type="button" className="button button-ghost" disabled={!subscription || working} onClick={() => void sendTest()}>
          Send test push
        </button>
        <button type="button" className="button button-ghost" disabled={!status?.devices || working}
          onClick={() => void clearDevices()}>
          Remove all devices
        </button>
        {installPrompt && (
          <button type="button" className="button button-ghost" onClick={() => { void installPrompt.prompt(); setInstallPrompt(null); }}>
            Install TrackLink
          </button>
        )}
      </div>
      <p className="muted push-hint">On Android Chrome, use the browser menu → Add to Home screen / Install app if an Install button is not shown.</p>
      <div className="push-preferences">
        <h3>Notification settings</h3>
        {preferenceLabels.map((item) => (
          <label className="push-option" key={item.key}>
            <span><strong>{item.title}</strong><small>{item.description}</small></span>
            <input
              type="checkbox"
              disabled={!preferences || working}
              checked={preferences?.[item.key] ?? false}
              onChange={(event) => setPreferences((current) => current ? { ...current, [item.key]: event.target.checked } : current)}
            />
          </label>
        ))}
        <button type="button" className="button button-primary" disabled={!preferences || working} onClick={() => void savePreferences()}>
          Save settings
        </button>
        <p className="muted push-hint">Preferences apply to all registered devices. Daily summaries use Europe/Kyiv calendar dates. Inactive-link and traffic-spike alerts are planned for a future release.</p>
      </div>
    </section>
  );
}
