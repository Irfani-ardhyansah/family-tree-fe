import {
  deletePushSubscription,
  fetchVapidPublicKey,
  pushSubscriptionToPayload,
  savePushSubscription,
} from '@/shared/lib/pushApi';

export type WebPushStatus =
  | 'unsupported'
  | 'unavailable'
  | 'denied'
  | 'prompt'
  | 'subscribed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
}

export async function getWebPushStatus(): Promise<WebPushStatus> {
  if (!isWebPushSupported()) return 'unsupported';

  if (Notification.permission === 'denied') return 'denied';

  try {
    const vapid = await fetchVapidPublicKey();
    if (!vapid.configured || !vapid.publicKey) return 'unavailable';
  } catch {
    return 'unavailable';
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return 'subscribed';
  return 'prompt';
}

export async function enableWebPush(): Promise<WebPushStatus> {
  if (!isWebPushSupported()) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return permission === 'denied' ? 'denied' : 'prompt';
  }

  const vapid = await fetchVapidPublicKey();
  if (!vapid.configured || !vapid.publicKey) return 'unavailable';

  await ensureServiceWorker();
  const reg = await navigator.serviceWorker.ready;
  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapid.publicKey,
      ) as BufferSource,
    });
  }

  await savePushSubscription(pushSubscriptionToPayload(subscription));
  return 'subscribed';
}

export async function disableWebPush(): Promise<void> {
  if (!isWebPushSupported()) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  try {
    await deletePushSubscription(endpoint);
  } catch {
    // still unsubscribe locally
  }
  await subscription.unsubscribe();
}
