import { useMemo, useState } from 'react';
import { Bell, MoreHorizontal, Search, TriangleAlert, X } from 'lucide-react';
import ThemeLoader from '../../../components/ui/ThemeLoader';
import { useNotifications, type NotificationItem } from '../../../hooks/useNotifications';

const getNotificationLevel = (type: string) => {
	if (['escalation', 'reopen', 'pending_review'].includes(type)) return 'critical';
	if (['assignment', 'release', 'status_change'].includes(type)) return 'warning';
	return 'info';
};

const formatTimestamp = (value: string) => {
	try {
		return new Date(value).toLocaleString();
	} catch {
		return value;
	}
};


const OrganizationAdminAlertsPage = () => {
	const { notifications, isLoading, error, markRead, markAllRead } = useNotifications({ refreshIntervalMs: 0, refreshOnFocus: true });
	const [searchQuery, setSearchQuery] = useState('');
	const [levelFilter, setLevelFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'unread'>('all');
	const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
	const showResetFilter = levelFilter !== 'all';

	const filteredNotifications = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		return notifications.filter((item) => {
			const level = getNotificationLevel(item.notification_type);
			if (levelFilter !== 'all') {
				if (levelFilter === 'unread' && item.is_read) return false;
				if (levelFilter !== 'unread' && level !== levelFilter) return false;
			}
			if (!q) return true;
			return (
				item.id.toLowerCase().includes(q) ||
				item.title.toLowerCase().includes(q) ||
				item.message.toLowerCase().includes(q) ||
				(item.issue_number ?? '').toLowerCase().includes(q)
			);
		});
	}, [levelFilter, notifications, searchQuery]);

	const getBadgeClass = (level: string) => {
		if (level === 'critical') return 'bg-red-50 text-red-700';
		if (level === 'warning') return 'bg-amber-50 text-amber-700';
		return 'bg-blue-50 text-blue-700';
	};

	const listContent = (() => {
		if (isLoading) {
			return (
				<div className="flex min-h-[35vh] items-center justify-center rounded-xl border border-dashed border-black/10 bg-white p-4">
					<ThemeLoader size="sm" />
				</div>
			);
		}
		if (error) {
			return (
				<div className="rounded-xl border border-dashed border-black/10 bg-white p-4 text-sm text-slate-500">
					{error}
				</div>
			);
		}
		return filteredNotifications.map((item) => {
			const level = getNotificationLevel(item.notification_type);
			const badgeClass = getBadgeClass(level);
			return (
				<button
					key={item.id}
					type="button"
					onClick={() => {
						setSelectedNotification(item);
						if (!item.is_read) {
							markRead([item.id]);
						}
					}}
					className={`w-full rounded-xl border bg-white p-3 text-left transition hover:border-black/20 hover:shadow-sm ${item.is_read ? 'border-black/5 opacity-70' : 'border-secondary/30 shadow-[0_4px_12px_rgba(0,0,0,0.03)]'}`}
				>
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-start gap-2">
							<span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full ${item.is_read ? 'bg-slate-50 text-slate-400' : 'bg-secondary/10 text-secondary'}`}>
								{level === 'critical' ? <TriangleAlert size={14} /> : <Bell size={14} />}
							</span>
							<div>
								<p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{item.issue_number ?? item.id}</p>
								<h3 className="mt-1 text-sm font-bold text-slate-900">{item.title}</h3>
								<p className="mt-1 text-sm text-slate-600">{item.message}</p>
							</div>
						</div>
						<div className="text-right">
							<p className="text-xs text-slate-400">{formatTimestamp(item.created_at)}</p>
							<span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeClass}`}>
								{level}
							</span>
						</div>
					</div>
				</button>
			);
		});
	})();

	return (
		<section>
			<header className="mb-3 flex items-start justify-between gap-3">
				<div>
						<h2 className="text-[36px] font-black leading-tight text-slate-900">Notifications</h2>
						<p className="text-sm text-slate-500">Live operational alerts, escalations, and response reminders.</p>
				</div>
				<div className="flex items-center gap-2">
						<div className="flex items-center rounded-full border border-black/5 bg-white px-3 py-1.5 shadow-sm">
							<Search size={14} className="mr-1 text-slate-400" />
							<input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notifications..." className="w-56 bg-transparent text-xs outline-none text-slate-700 placeholder:text-slate-400" />
					</div>
					{searchQuery ? (
							<button onClick={() => setSearchQuery('')} className="rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-semibold text-secondary shadow-sm" aria-label="Clear notification search">
							Clear
						</button>
					) : null}
						<button onClick={markAllRead} className="rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-semibold text-secondary shadow-sm" aria-label="Mark all notifications as read">
						Mark all read
					</button>
						<button type="button" className="rounded-full border border-black/5 bg-white p-2 text-slate-500 shadow-sm" title="More options" aria-label="More options">
						<MoreHorizontal size={14} />
					</button>
				</div>
			</header>

				<div className="min-h-[81vh] rounded-[2rem] border border-black/5 bg-white/75 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm">
				<div className="mb-3 flex flex-wrap items-center gap-2">
						<button onClick={() => setLevelFilter('all')} className={`rounded-full px-3 py-1 text-xs font-semibold ${levelFilter === 'all' ? 'bg-secondary text-white' : 'border border-black/5 bg-white text-slate-600'}`}>All</button>
						<button onClick={() => setLevelFilter('unread')} className={`rounded-full px-3 py-1 text-xs font-semibold ${levelFilter === 'unread' ? 'bg-secondary text-white' : 'border border-black/5 bg-white text-slate-600'}`}>Unread</button>
						<button onClick={() => setLevelFilter('critical')} className={`rounded-full px-3 py-1 text-xs font-semibold ${levelFilter === 'critical' ? 'bg-secondary text-white' : 'border border-black/5 bg-white text-slate-600'}`}>Critical</button>
						<button onClick={() => setLevelFilter('warning')} className={`rounded-full px-3 py-1 text-xs font-semibold ${levelFilter === 'warning' ? 'bg-secondary text-white' : 'border border-black/5 bg-white text-slate-600'}`}>Warnings</button>
						<button onClick={() => setLevelFilter('info')} className={`rounded-full px-3 py-1 text-xs font-semibold ${levelFilter === 'info' ? 'bg-secondary text-white' : 'border border-black/5 bg-white text-slate-600'}`}>Informational</button>
					{showResetFilter ? (
							<button onClick={() => setLevelFilter('all')} className="rounded-full border border-dashed border-black/5 bg-white px-3 py-1 text-xs text-slate-500">Reset filter</button>
					) : null}
				</div>

				<div className="space-y-2">
					{listContent}
					{!isLoading && !error && filteredNotifications.length === 0 ? (
						<div className="rounded-xl border border-dashed border-black/5 bg-white p-4 text-sm text-slate-500">
							No notifications match your search or filter.
						</div>
					) : null}
				</div>
			</div>

			{selectedNotification ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
					<div className="w-full max-w-xl rounded-3xl border border-black/5 bg-slate-50 p-5 shadow-2xl">
						<div className="flex items-start justify-between gap-4 border-b border-black/5 pb-3">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Notification Details</p>
								<h3 className="mt-1 text-2xl font-black text-slate-900">{selectedNotification.issue_number ?? selectedNotification.id}</h3>
							</div>
							<button onClick={() => setSelectedNotification(null)} className="rounded-full border border-black/5 bg-white p-2 text-slate-500 shadow-sm hover:bg-slate-50" aria-label="Close notification details">
								<X size={16} />
							</button>
						</div>
						<div className="mt-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
							<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{selectedNotification.notification_type.replace('_', ' ')}</p>
							<p className="mt-2 text-lg font-bold text-slate-900">{selectedNotification.title}</p>
							<p className="mt-1 text-sm text-slate-600">{selectedNotification.message}</p>
							<p className="mt-3 text-xs text-slate-400">{formatTimestamp(selectedNotification.created_at)}</p>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
};

export default OrganizationAdminAlertsPage;