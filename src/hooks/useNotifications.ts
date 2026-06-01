import { useCallback, useEffect, useState } from 'react';
import { privateApi } from '../features/auth/services/authService';

export interface NotificationItem {
	id: string;
	title: string;
	message: string;
	notification_type: string;
	is_read: boolean;
	created_at: string;
	issue?: string | null;
	issue_number?: string | null;
}

interface UnreadCountResponse {
	unread_count: number;
}

interface UseNotificationsOptions {
	refreshIntervalMs?: number;
	refreshOnFocus?: boolean;
}

const NOTIFICATION_SYNC_EVENT = 'organization-admin-notifications-updated';

let cachedNotifications: NotificationItem[] = [];
let cachedUnreadCount = 0;
let hasCachedNotifications = false;

export const useNotifications = (options: UseNotificationsOptions = {}) => {
	const { refreshIntervalMs = 30000, refreshOnFocus = true } = options;
	const [notifications, setNotifications] = useState<NotificationItem[]>(cachedNotifications);
	const [unreadCount, setUnreadCount] = useState(cachedUnreadCount);
	const [isLoading, setIsLoading] = useState(!hasCachedNotifications);
	const [error, setError] = useState<string | null>(null);

	const syncFromCache = useCallback(() => {
		setNotifications(cachedNotifications);
		setUnreadCount(cachedUnreadCount);
		setIsLoading(false);
	}, []);

	const emitSync = useCallback(() => {
		globalThis.dispatchEvent(new Event(NOTIFICATION_SYNC_EVENT));
	}, []);

	const fetchUnreadCount = useCallback(async () => {
		const response = await privateApi.get<UnreadCountResponse>('/notifications/unread/count/');
		const nextUnreadCount = response.data.unread_count ?? 0;
		setUnreadCount(nextUnreadCount);
		cachedUnreadCount = nextUnreadCount;
	}, []);

	const fetchNotifications = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await privateApi.get<NotificationItem[]>('/notifications/');
			const nextNotifications = response.data ?? [];
			setNotifications(nextNotifications);
			cachedNotifications = nextNotifications;
			hasCachedNotifications = true;
			await fetchUnreadCount();
			emitSync();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load notifications.');
			cachedNotifications = [];
			cachedUnreadCount = 0;
			hasCachedNotifications = false;
		} finally {
			setIsLoading(false);
		}
	}, [fetchUnreadCount]);

	const markRead = useCallback(async (notificationIds: string[]) => {
		if (notificationIds.length === 0) return;
		await privateApi.post('/notifications/mark-read/', { notification_ids: notificationIds });
		setNotifications((prev) => {
			const next = prev.map((item) => (notificationIds.includes(item.id) ? { ...item, is_read: true } : item));
			cachedNotifications = next;
			return next;
		});
		await fetchUnreadCount();
		emitSync();
	}, [fetchUnreadCount]);

	const markAllRead = useCallback(async () => {
		await privateApi.post('/notifications/mark-read/', { read_all: true });
		setNotifications((prev) => {
			const next = prev.map((item) => ({ ...item, is_read: true }));
			cachedNotifications = next;
			return next;
		});
		await fetchUnreadCount();
		emitSync();
	}, [fetchUnreadCount]);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	useEffect(() => {
		globalThis.addEventListener(NOTIFICATION_SYNC_EVENT, syncFromCache);
		return () => globalThis.removeEventListener(NOTIFICATION_SYNC_EVENT, syncFromCache);
	}, [syncFromCache]);

	useEffect(() => {
		if (!refreshOnFocus) return;

		const handleFocus = () => {
			void fetchNotifications();
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				void fetchNotifications();
			}
		};

		globalThis.addEventListener('focus', handleFocus);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			globalThis.removeEventListener('focus', handleFocus);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [fetchNotifications, refreshOnFocus]);

	useEffect(() => {
		if (refreshIntervalMs <= 0) return;

		const intervalId = globalThis.setInterval(() => {
			void fetchNotifications();
		}, refreshIntervalMs);

		return () => globalThis.clearInterval(intervalId);
	}, [fetchNotifications, refreshIntervalMs]);

	return {
		notifications,
		unreadCount,
		isLoading,
		error,
		refresh: fetchNotifications,
		markRead,
		markAllRead,
	};
};
