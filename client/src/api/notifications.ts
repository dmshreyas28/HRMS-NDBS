import { api } from "./client";

export interface AppNotification {
  id: string;
  recipientId: string;
  type: string;
  positionId: string;
  message: string;
  isRead: boolean;
  channel: string;
  sentAt?: string;
  createdAt: string;
}

export function listNotifications(): Promise<AppNotification[]> {
  return api.get<AppNotification[]>("/api/notifications");
}

export function markAsRead(id: string): Promise<void> {
  return api.patch<void>(`/api/notifications/${id}/read`, {});
}

export function markAllAsRead(): Promise<void> {
  return api.patch<void>("/api/notifications/read-all", {});
}
