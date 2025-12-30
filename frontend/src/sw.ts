/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare let self: ServiceWorkerGlobalScope;

// clean old assets
cleanupOutdatedCaches();

// self.__WB_MANIFEST is the default injection point
precacheAndRoute(self.__WB_MANIFEST);

let allowlist: RegExp[] | undefined;
// in dev mode, we disable precaching to avoid caching issues
if (import.meta.env.DEV) allowlist = [/^\/$/];

// to allow work offline
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), { allowlist }),
);

interface PushPayload {
  id?: string; // stable id for dedupe (server-generated)
  title?: string;
  body?: string;
  icon?: string;
  badge?: string; // monochrome badge icon (Android/Windows)
  tag?: string; // dedupe key for notifications API
  renotify?: boolean; // if same tag appears, buzz again
  requireInteraction?: boolean; // keep open until user acts
  silent?: boolean; // show nothing, just wake SW
  timestamp?: number; // ms
  data?: object; // arbitrary metadata (e.g., checklistId)
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

async function show(payload: PushPayload) {
  if (payload.silent) return; // data-only message
  const title = payload.title || "Notification";
  const options: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || "/icons/notification-icon.png",
    badge: payload.badge || "/icons/badge.png",
    tag: payload.tag || payload.id, // helps dedupe merged updates
    renotify: payload.renotify ?? false,
    vibrate: [100, 50, 100], // default vibration pattern
    requireInteraction: payload.requireInteraction ?? false,
    timestamp: payload.timestamp ?? Date.now(),
    data: { ...payload.data, id: payload.id, _origin: "push" },
    actions: payload.actions,
  };
  await self.registration.showNotification(title, options);
}

self.addEventListener("push", (event: PushEvent) => {
  event.waitUntil(
    (async () => {
      try {
        const payload: PushPayload = event.data
          ? await event.data.json()
          : { body: "(no content)" };
        // Optional: communicate with open clients (tabs)
        const clientsList = await self.clients.matchAll({
          includeUncontrolled: true,
          type: "window",
        });
        for (const client of clientsList) {
          client.postMessage({ type: "PUSH_EVENT", payload });
        }
        await show(payload);
      } catch (e) {
        await show({
          title: "Push Error",
          body: (e as Error).message,
          timestamp: Date.now(),
        });
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const data: object = event.notification.data || {};
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Try focus existing client
      for (const c of all) {
        // You can filter by URL if needed
        if ("focus" in c) {
          await (c as WindowClient).focus();
          break;
        }
      }
      // Inform client about click with payload (for deep-link navigation)
      for (const c of all) {
        c.postMessage({
          type: "NOTIFICATION_CLICK",
          data,
          action: event.action,
        });
      }
      // If no clients, open a URL (fallback)
      if (all.length === 0 && self.registration.navigationPreload) {
        await self.clients.openWindow("/");
      }
    })(),
  );
});

// self.addEventListener("notificationclose", (event: NotificationEvent) => {
//   const data: object = event.notification.data || {};
//   // Optionally report dismissal telemetry
// });

self.skipWaiting();
clientsClaim();
