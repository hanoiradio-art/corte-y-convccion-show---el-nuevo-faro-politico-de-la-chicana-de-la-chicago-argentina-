import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import firebaseConfigData from '../../firebase-applet-config.json';

export const firebaseConfig = {
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test Firestore connection on boot (Mandatory per skill guidelines)
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore: modo offline o sin conexión en este momento.');
    }
  }
}
testFirestoreConnection();

// Cache messaging instance
let messagingInstance: Messaging | null = null;

export async function getFcmMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch (e) {
      console.warn('FCM no disponible en este entorno:', e);
      return null;
    }
  }
  return messagingInstance;
}

// Request permission and get device FCM token
export async function registerPushNotifications(): Promise<{ success: boolean; token?: string; error?: string }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, error: 'Este navegador no soporta notificaciones de escritorio o móviles.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso de notificaciones denegado por el usuario.' };
    }

    const messaging = await getFcmMessaging();
    let token = '';

    if (messaging && 'serviceWorker' in navigator) {
      try {
        const swReg = await navigator.serviceWorker
          .register('/firebase-messaging-sw.js', { scope: '/firebase-cloud-messaging-push-scope' })
          .catch(() => null);
        if (swReg) {
          token = await getToken(messaging, {
            serviceWorkerRegistration: swReg
          }).catch((err) => {
            console.warn('No se pudo obtener token FCM con SW, usando fallback local:', err);
            return '';
          });
        }
      } catch (fcmErr) {
        console.warn('Error al registrar token FCM:', fcmErr);
      }
    }

    // Generate fallback persistent identifier if FCM VAPID is pending
    if (!token) {
      let localId = localStorage.getItem('hanoi_push_token');
      if (!localId) {
        localId = `fcm-sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('hanoi_push_token', localId);
      }
      token = localId;
    }

    // Save subscriber record to Firestore
    try {
      const subscriberRef = doc(db, 'notification_subscribers', token.slice(0, 80));
      await setDoc(
        subscriberRef,
        {
          token: token,
          platform: navigator.userAgent.slice(0, 200),
          subscribedAt: new Date().toISOString(),
          notifyLiveShows: true,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('No se pudo registrar token en Firestore:', fsErr);
    }

    localStorage.setItem('hanoi_push_enabled', 'true');
    return { success: true, token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al activar notificaciones.' };
  }
}

// Publish live announcement from Studio Director
export async function publishLiveAnnouncement(announcement: {
  title: string;
  body: string;
  showTitle?: string;
  showHost?: string;
  genre?: string;
}): Promise<boolean> {
  try {
    await addDoc(collection(db, 'live_announcements'), {
      title: announcement.title,
      body: announcement.body,
      showTitle: announcement.showTitle || 'Trinchera Under',
      showHost: announcement.showHost || 'Facu "El Mugre" & Vicky Riff',
      genre: announcement.genre || 'Rock Under',
      timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      sender: 'Hanoi Radio Producción',
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('Error al publicar live announcement:', err);
    return false;
  }
}

// Listen for live announcements in real time
export function subscribeToLiveAnnouncements(onNewAnnouncement: (announcement: any) => void) {
  try {
    const q = query(collection(db, 'live_announcements'), orderBy('createdAt', 'desc'), limit(10));
    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          onNewAnnouncement({ id: change.doc.id, ...change.doc.data() });
        }
      });
    });
  } catch (err) {
    console.warn('Error escuchando live announcements:', err);
    return () => {};
  }
}
