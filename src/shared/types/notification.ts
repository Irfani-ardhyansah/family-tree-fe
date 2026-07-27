export type NotificationType = 'broadcast' | 'system' | string;

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  broadcastId?: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResult = {
  items: AppNotification[];
  page: number;
  pageSize: number;
  total: number;
  unreadCount: number;
};
