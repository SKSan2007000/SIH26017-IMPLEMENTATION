import { http, isBackendConfigured } from './httpClient';
import { MOCK_NOTIFICATIONS } from '@/lib/mock';
import type { NotificationItem } from '@/types';

export const notificationsApi = {
  getNotifications: async (params?: { projectId?: string; recipient?: string; unreadOnly?: boolean; type?: string }): Promise<NotificationItem[]> => {
    if (!isBackendConfigured()) {
      let result = [...MOCK_NOTIFICATIONS];
      if (params?.projectId) {
        result = result.filter((n) => !n.projectId || n.projectId === params.projectId);
      }
      if (params?.unreadOnly) {
        result = result.filter((n) => !n.read);
      }
      return result;
    }
    const query = new URLSearchParams();
    if (params?.projectId) query.append('project_id', params.projectId);
    if (params?.recipient) query.append('recipient', params.recipient);
    if (params?.unreadOnly) query.append('unread_only', 'true');
    if (params?.type) query.append('notification_type', params.type);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return http.get<NotificationItem[]>(`/api/v1/notifications${qs}`);
  },

  createNotification: async (notification: Partial<NotificationItem>): Promise<NotificationItem> => {
    if (!isBackendConfigured()) {
      return {
        ...MOCK_NOTIFICATIONS[0],
        ...notification,
        id: notification.id ?? `NTF-${Date.now().toString().slice(-4)}`,
      } as NotificationItem;
    }
    return http.post<NotificationItem>('/api/v1/notifications', {
      id: notification.id,
      title: notification.title,
      category: notification.category,
      severity: notification.severity,
      priority: notification.priority || 'HIGH',
      message: notification.message,
      action_url: notification.actionUrl,
      project_id: notification.projectId,
      parcel_id: notification.parcelId,
      recipient: notification.recipient,
      channel: notification.channel || 'In-App',
      timestamp: notification.timestamp,
      read: notification.read ?? false,
    });
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    if (!isBackendConfigured()) {
      const item = MOCK_NOTIFICATIONS.find((n) => n.id === id) || MOCK_NOTIFICATIONS[0];
      return { ...item, read: true };
    }
    return http.put<NotificationItem>(`/api/v1/notifications/${id}/read`);
  },

  markAllAsRead: async (params?: { projectId?: string; recipient?: string }): Promise<{ status: string; markedCount: number }> => {
    if (!isBackendConfigured()) {
      return { status: 'success', markedCount: MOCK_NOTIFICATIONS.length };
    }
    const query = new URLSearchParams();
    if (params?.projectId) query.append('project_id', params.projectId);
    if (params?.recipient) query.append('recipient', params.recipient);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return http.put<{ status: string; markedCount: number }>(`/api/v1/notifications/read-all${qs}`);
  },
};
