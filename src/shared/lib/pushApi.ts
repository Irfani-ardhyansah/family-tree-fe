import { apiFetch } from '@/shared/lib/apiClient';

const BASE =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export type VapidPublicKeyResponse = {
  publicKey: string;
  configured: boolean;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

function isApiError(
  body: unknown,
): body is { error: { code: string; message: string } } {
  return (
    typeof body === 'object' &&
    body != null &&
    'error' in body &&
    typeof (body as { error?: { code?: unknown } }).error?.code === 'string'
  );
}

async function parseData<T>(res: Response): Promise<T> {
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    if (isApiError(body)) {
      throw new Error(body.error.message);
    }
    throw new Error('Gagal memanggil push API.');
  }
  if (
    typeof body === 'object' &&
    body != null &&
    'data' in body &&
    (body as { data: T }).data !== undefined
  ) {
    return (body as { data: T }).data;
  }
  throw new Error('Respons push API tidak valid.');
}

/** Public — no auth required. */
export async function fetchVapidPublicKey(): Promise<VapidPublicKeyResponse> {
  const res = await fetch(`${BASE}/push/vapid-public-key`);
  return parseData<VapidPublicKeyResponse>(res);
}

export async function savePushSubscription(
  subscription: PushSubscriptionPayload,
): Promise<{ id: number; endpoint: string }> {
  return apiFetch<{ id: number; endpoint: string }>('/push/subscriptions', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}

export async function deletePushSubscription(
  endpoint: string,
): Promise<void> {
  await apiFetch<{ deleted?: boolean }>('/push/subscriptions', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });
}

export function pushSubscriptionToPayload(
  subscription: PushSubscription,
): PushSubscriptionPayload {
  const json = subscription.toJSON();
  const keys = json.keys;
  if (!json.endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Subscription browser tidak lengkap.');
  }
  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  };
}
