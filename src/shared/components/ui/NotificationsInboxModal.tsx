import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { Fragment, useEffect, useState } from 'react';
import { Bell, Check, CheckCircle, Inbox, X } from 'react-feather';
import {
  fetchNotifications,
  isNotificationsApiMissing,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/shared/lib/notificationsApi';
import {
  disableWebPush,
  enableWebPush,
  getWebPushStatus,
  type WebPushStatus,
} from '@/shared/lib/webPush';
import type { AppNotification } from '@/shared/types/notification';
import { RichTextContent } from '@/shared/components/ui/RichTextContent';
import { notifyNotificationsChanged } from '@/shared/hooks/useUnreadNotificationCount';

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type NotificationsInboxModalProps = {
  open: boolean;
  onClose: () => void;
};

export function NotificationsInboxModal({
  open,
  onClose,
}: NotificationsInboxModalProps) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiMissing, setApiMissing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [pushStatus, setPushStatus] = useState<WebPushStatus>('unsupported');
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
  const pageSize = 20;

  const load = (nextPage = 1) => {
    setLoading(true);
    setError('');
    setApiMissing(false);
    void fetchNotifications({ page: nextPage, pageSize })
      .then((res) => {
        setItems(res.items);
        setUnreadCount(res.unreadCount);
        setTotal(res.total);
        setPage(res.page);
      })
      .catch((err: unknown) => {
        if (isNotificationsApiMissing(err)) {
          setApiMissing(true);
          setItems([]);
          setUnreadCount(0);
          setTotal(0);
        } else {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat notifikasi',
          );
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    load(1);
    void getWebPushStatus().then(setPushStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleRead = async (item: AppNotification) => {
    if (item.isRead) return;
    setBusyId(item.id);
    try {
      const updated = await markNotificationRead(item.id);
      setItems((list) =>
        list.map((n) => (n.id === updated.id ? updated : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      notifyNotificationsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menandai dibaca');
    } finally {
      setBusyId(null);
    }
  };

  const handleReadAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((list) =>
        list.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      notifyNotificationsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menandai semua');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleTogglePush = async () => {
    setPushBusy(true);
    setPushMessage('');
    try {
      if (pushStatus === 'subscribed') {
        await disableWebPush();
        setPushStatus('prompt');
        setPushMessage('Notifikasi perangkat dimatikan.');
      } else {
        const next = await enableWebPush();
        setPushStatus(next);
        setPushMessage(
          next === 'subscribed'
            ? 'Notifikasi perangkat aktif.'
            : next === 'denied'
              ? 'Izin ditolak di pengaturan browser.'
              : 'Push belum tersedia.',
        );
      }
    } catch (err) {
      setPushMessage(
        err instanceof Error ? err.message : 'Gagal mengatur Web Push.',
      );
    } finally {
      setPushBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pushSupported =
    pushStatus !== 'unsupported' && pushStatus !== 'unavailable';

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px]" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-3 sm:items-center sm:p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-3 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-3 sm:scale-95"
            >
              <DialogPanel className="flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-5">
                  <div>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold text-brand-800">
                      <Bell size={16} className="text-primary-600" />
                      Notifikasi
                    </DialogTitle>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Pengumuman keluarga
                      {unreadCount > 0
                        ? ` · ${unreadCount} belum dibaca`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && !apiMissing && (
                      <button
                        type="button"
                        disabled={markingAll}
                        onClick={() => void handleReadAll()}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50"
                      >
                        <CheckCircle size={13} />
                        {markingAll ? '…' : 'Semua dibaca'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Tutup"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {pushSupported && (
                  <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-brand-700">
                          Notifikasi perangkat
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Alert OS saat ada broadcast baru
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={pushBusy || pushStatus === 'denied'}
                        onClick={() => void handleTogglePush()}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50 ${
                          pushStatus === 'subscribed'
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-white text-brand-700 ring-1 ring-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pushBusy
                          ? '…'
                          : pushStatus === 'subscribed'
                            ? 'Aktif'
                            : pushStatus === 'denied'
                              ? 'Diblokir'
                              : 'Aktifkan'}
                      </button>
                    </div>
                    {pushMessage && (
                      <p className="mt-1.5 text-[11px] text-gray-500">
                        {pushMessage}
                      </p>
                    )}
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                      <p className="text-sm">Memuat…</p>
                    </div>
                  ) : apiMissing ? (
                    <div className="py-12 text-center">
                      <Inbox size={24} className="mx-auto text-amber-500" />
                      <p className="mt-3 text-sm font-semibold text-brand-800">
                        Inbox belum tersedia
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Endpoint notifikasi belum siap di server.
                      </p>
                    </div>
                  ) : error ? (
                    <div className="py-10 text-center">
                      <p className="text-sm text-rose-600">{error}</p>
                      <button
                        type="button"
                        onClick={() => load(page)}
                        className="mt-3 text-sm font-semibold text-primary-700"
                      >
                        Coba lagi
                      </button>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="py-14 text-center">
                      <Inbox size={24} className="mx-auto text-gray-300" />
                      <p className="mt-3 text-sm font-semibold text-brand-800">
                        Belum ada notifikasi
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {items.map((item) => (
                        <li key={item.id}>
                          <article
                            className={`rounded-xl border p-3 ${
                              item.isRead
                                ? 'border-gray-100 bg-white'
                                : 'border-primary-100 bg-primary-50/40'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                  item.isRead
                                    ? 'bg-gray-300'
                                    : 'bg-primary-500'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="text-sm font-semibold text-brand-800">
                                      {item.title}
                                    </h3>
                                    <p className="text-[11px] text-gray-400">
                                      {formatWhen(item.createdAt)}
                                    </p>
                                  </div>
                                  {!item.isRead && (
                                    <button
                                      type="button"
                                      disabled={busyId === item.id}
                                      onClick={() => void handleRead(item)}
                                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-50"
                                    >
                                      <Check size={12} />
                                      Dibaca
                                    </button>
                                  )}
                                </div>
                                <div className="mt-2 text-sm text-gray-700">
                                  <RichTextContent content={item.body} />
                                </div>
                              </div>
                            </div>
                          </article>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {totalPages > 1 && !loading && !apiMissing && items.length > 0 && (
                  <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500 sm:px-5">
                    <span>
                      Halaman {page}/{totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => load(page - 1)}
                        className="rounded-lg px-2 py-1 font-semibold hover:bg-gray-50 disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => load(page + 1)}
                        className="rounded-lg px-2 py-1 font-semibold hover:bg-gray-50 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
