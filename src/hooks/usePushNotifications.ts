import { useState, useEffect, useCallback } from 'react';
import { registerPushNotifications, subscribeToLiveAnnouncements, getFcmMessaging } from '../lib/firebase';
import { onMessage } from 'firebase/messaging';

export interface PushNotificationAlert {
  id: string;
  title: string;
  body: string;
  showTitle?: string;
  showHost?: string;
  timestamp: string;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    return localStorage.getItem('hanoi_push_enabled') === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<PushNotificationAlert | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        setIsSubscribed(true);
      }
    } else {
      setPermission('unsupported');
    }
  }, []);

  // Listen to incoming Firebase Cloud Messaging messages when app is open (foreground)
  useEffect(() => {
    let unsubscribeFcm = () => {};

    getFcmMessaging().then((messaging) => {
      if (messaging) {
        unsubscribeFcm = onMessage(messaging, (payload) => {
          console.log('[usePushNotifications] Mensaje FCM en primer plano:', payload);
          const title = payload.notification?.title || payload.data?.title || 'Hanoi Radio • ¡En Vivo!';
          const body = payload.notification?.body || payload.data?.body || '¡Comenzó un nuevo programa!';

          const alertItem: PushNotificationAlert = {
            id: `alert-${Date.now()}`,
            title,
            body,
            timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
          };

          setActiveAlert(alertItem);
          triggerNativeNotification(title, body);
        });
      }
    });

    // Also listen to Firestore live announcements in real time
    const initialLoadTime = Date.now();
    const unsubscribeFirestore = subscribeToLiveAnnouncements((data) => {
      // Only display alerts created after app opened to avoid spamming old history
      const createdMillis = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
      if (createdMillis >= initialLoadTime - 30000) {
        const alertItem: PushNotificationAlert = {
          id: data.id || `live-${Date.now()}`,
          title: data.title || 'Hanoi Radio • Programa en Vivo',
          body: data.body || `Comenzó ${data.showTitle || 'un nuevo programa'} con ${data.showHost || 'el staff'}`,
          showTitle: data.showTitle,
          showHost: data.showHost,
          timestamp: data.timestamp || 'Ahora'
        };

        setActiveAlert(alertItem);
        triggerNativeNotification(alertItem.title, alertItem.body);
      }
    });

    return () => {
      unsubscribeFcm();
      unsubscribeFirestore();
    };
  }, []);

  const triggerNativeNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          tag: 'hanoi-live-program'
        });
      } catch (err) {
        console.warn('Native notification fallback:', err);
      }
    }
  };

  const enableNotifications = useCallback(async () => {
    setIsLoading(true);
    const result = await registerPushNotifications();
    setIsLoading(false);

    if (result.success) {
      setIsSubscribed(true);
      setPermission('granted');

      // Test welcome notification
      const welcomeTitle = '🤘 ¡Avisos en vivo activados!';
      const welcomeBody = 'Te avisaremos en tu pantalla cuando empiece cada nuevo programa en Hanoi Radio 98.9.';
      setActiveAlert({
        id: `welcome-${Date.now()}`,
        title: welcomeTitle,
        body: welcomeBody,
        timestamp: 'Ahora'
      });
      triggerNativeNotification(welcomeTitle, welcomeBody);
      return { success: true };
    } else {
      setPermission(Notification.permission);
      return { success: false, error: result.error };
    }
  }, []);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    activeAlert,
    enableNotifications,
    dismissAlert
  };
}
