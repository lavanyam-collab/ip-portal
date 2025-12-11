// This service bridges the gap between Web and Native functionality.
// When built with Capacitor, this allows alerts to fire even when the app is closed.

export const MobileService = {
  // Check if we are running in a Native Shell (Android/iOS)
  isNative: (): boolean => {
    return !!(window as any).Capacitor?.isNative;
  },

  // Schedule a notification
  scheduleNotification: async (title: string, body: string, id: number) => {
    // 1. Native Path (Capacitor)
    if ((window as any).Capacitor?.isNative) {
      try {
        const LocalNotifications = (window as any).Capacitor.Plugins.LocalNotifications;
        if (LocalNotifications) {
          await LocalNotifications.schedule({
            notifications: [
              {
                title,
                body,
                id,
                schedule: { at: new Date(Date.now() + 100) }, // Fire immediately
                sound: 'beep.wav',
                attachments: null,
                actionTypeId: '',
                extra: null
              }
            ]
          });
          return;
        }
      } catch (e) {
        console.warn("Native notification failed", e);
      }
    }

    // 2. Web Fallback (Standard Browser Notification)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: '/logo192.png', // This would be your app icon
        vibrate: [200, 100, 200]
      } as any);
    }
  },

  vibrate: () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }
  }
};