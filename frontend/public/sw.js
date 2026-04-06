// Service Worker for Web Push Notifications
// Intl-Dossier v4.0

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Intl Dossier'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: data.url || '/' },
    dir: data.dir || 'auto',
    lang: data.lang || 'en',
    tag: data.tag || 'default',
    renotify: !!data.tag,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existingWindow = windowClients.find((client) =>
        client.url.includes(self.location.origin),
      )
      if (existingWindow) {
        existingWindow.focus()
        existingWindow.navigate(url)
      } else {
        clients.openWindow(url)
      }
    }),
  )
})
