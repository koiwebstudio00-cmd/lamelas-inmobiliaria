// Service worker del panel (PUSH-PWA-01).
//
// Solo hace dos cosas: mostrar el aviso push y abrir el panel al tocarlo.
// A propósito NO guarda páginas para usar sin conexión: son datos privados y
// quedarían viejos. Los avisos llegan en formato Declarative Web Push
// ({ web_push: 8030, notification: {...} }); Safari en iPhone los muestra solo,
// y el resto de los navegadores pasan por el `push` de acá.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const n = data.notification || {};
  const title = n.title || "Lamelas";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: n.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: n.tag,
      lang: n.lang || "es-AR",
      data: { url: n.navigate || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin);
  // Solo se abren rutas del propio panel.
  if (destino.origin !== self.location.origin) return;
  event.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const v of ventanas) {
        if (new URL(v.url).origin === destino.origin && "focus" in v) {
          await v.focus();
          if ("navigate" in v) await v.navigate(destino.href);
          return;
        }
      }
      await self.clients.openWindow(destino.href);
    })()
  );
});
