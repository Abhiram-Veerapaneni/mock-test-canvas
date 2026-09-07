import { create } from 'zustand';
import api from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Fetch notifications with optional filtering
  fetchNotifications: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/notifications', { params });
      if (response.data?.success) {
        set({
          notifications: response.data.notifications || [],
          unreadCount: response.data.unreadCount ?? 0,
          isLoading: false,
        });
        return response.data;
      }
      return null;
    } catch (err) {
      console.warn('fetchNotifications error:', err.response?.data?.message || err.message);
      set({
        isLoading: false,
        error: err.response?.data?.message || 'Failed to load notifications',
      });
      return null;
    }
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    const prevNotifications = get().notifications;
    const target = prevNotifications.find((n) => n._id === id);
    if (!target || target.read) return; // already read

    // Optimistic UI update
    set({
      notifications: prevNotifications.map((n) =>
        n._id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (err) {
      // Fallback to PUT if PATCH fails
      try {
        await api.put(`/notifications/${id}/read`);
      } catch (fallbackErr) {
        console.warn('markAsRead error:', fallbackErr);
        // Only revert if both failed
        set({ notifications: prevNotifications });
      }
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const prevNotifications = get().notifications;
    const prevUnread = get().unreadCount;
    if (prevUnread === 0 && prevNotifications.every((n) => n.read)) return;

    // Optimistic update
    set({
      notifications: prevNotifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });

    try {
      await api.patch('/notifications/mark-all-read');
    } catch (err) {
      // Fallback to PUT if PATCH fails
      try {
        await api.put('/notifications/mark-all-read');
      } catch (fallbackErr) {
        console.warn('markAllAsRead error:', fallbackErr);
        set({ notifications: prevNotifications, unreadCount: prevUnread });
      }
    }
  },

  // Delete a single notification
  deleteNotification: async (id) => {
    const prevNotifications = get().notifications;
    const target = prevNotifications.find((n) => n._id === id);
    const wasUnread = target && !target.read;

    set({
      notifications: prevNotifications.filter((n) => n._id !== id),
      unreadCount: wasUnread ? Math.max(0, get().unreadCount - 1) : get().unreadCount,
    });

    try {
      await api.delete(`/notifications/${id}`);
    } catch (err) {
      console.warn('deleteNotification error:', err);
      set({ notifications: prevNotifications });
    }
  },

  // Clear all notifications
  clearAll: async () => {
    const prevNotifications = get().notifications;
    const prevUnread = get().unreadCount;

    set({ notifications: [], unreadCount: 0 });

    try {
      await api.delete('/notifications');
    } catch (err) {
      console.warn('clearAll notifications error:', err);
      set({ notifications: prevNotifications, unreadCount: prevUnread });
    }
  },

  // Real-time notification received via socket
  addNotification: (newNotification) => {
    if (!newNotification || !newNotification._id) return;

    set((state) => {
      // Prevent duplicates
      if (state.notifications.some((n) => n._id === newNotification._id)) {
        return state;
      }
      return {
        notifications: [newNotification, ...state.notifications],
        unreadCount: state.unreadCount + (newNotification.read ? 0 : 1),
      };
    });
  },
}));

export default useNotificationStore;
