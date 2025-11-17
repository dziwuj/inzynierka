interface NotificationOptions {
  actions?: NotificationAction[];
  renotify?: boolean;
  timestamp?: number;
  vibrate?: number[] | number;
  image?: string;
}
