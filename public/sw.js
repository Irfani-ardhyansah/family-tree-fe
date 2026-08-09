/* Family Suite — Web Push service worker */
function appBase() {
  try {
    return new URL(self.registration.scope).pathname.replace(/\/$/, '') || '';
  } catch {
    return '';
  }
}

function appPath(path) {
  const base = appBase();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Family Suite',
    body: '',
    data: { url: appPath('/?notifications=1') },
  };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
      if (!payload.data) payload.data = { url: appPath('/?notifications=1') };
      if (!payload.data.url) payload.data.url = appPath('/?notifications=1');
    }
  } catch {
    // keep defaults
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Family Suite', {
      body: payload.body || '',
      data: payload.data,
      icon: appPath('/vite.svg'),
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || appPath('/?notifications=1');
  const target =
    rawUrl === '/inbox' ||
    rawUrl === appPath('/inbox') ||
    rawUrl.endsWith('/inbox')
      ? appPath('/?notifications=1')
      : rawUrl;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            await client.navigate(target);
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
