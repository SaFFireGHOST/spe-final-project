import { create } from 'zustand';
import { api } from '../api/client';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    data: string;
    read: boolean;
    timestamp: number;
}

interface NotificationsState {
    notifications: Notification[];
    fetchNotifications: (userId: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    clearAll: (userId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
    notifications: [],

    fetchNotifications: async (userId: string) => {
        try {
            const response = await api.getNotifications(userId);
            set({ notifications: response.data });
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    },

    markAsRead: async (id: string) => {
        try {
            await api.markNotificationRead(id);
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, read: true } : n
                ),
            }));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    },

    markAllAsRead: async (userId: string) => {
        try {
            await api.markAllNotificationsRead(userId);
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, read: true })),
            }));
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    },

    clearAll: async (userId: string) => {
        try {
            await api.clearNotifications(userId);
            set({ notifications: [] });
        } catch (error) {
            console.error('Failed to clear notifications', error);
        }
    },
}));
