/* TrackLink PWA service worker: push notifications only; no offline cache. */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = typeof data.title === 'string' ? data.title : 'TrackLink';
  const options = {
    body: typeof data.body === 'string' ? data.body : 'You have a new update.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: typeof data.tag === 'string' ? data.tag : undefined,
    data: { url: '/admin' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Never open arbitrary URLs supplied inside a push payload.
  const url = new URL('/admin', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const windowClient of windows) {
      if (new URL(windowClient.url).origin === self.location.origin && 'focus' in windowClient) {
        await windowClient.focus();
        if ('navigate' in windowClient) await windowClient.navigate(url);
        return;
      }
    }
    return clients.openWindow(url);
  })());
});
