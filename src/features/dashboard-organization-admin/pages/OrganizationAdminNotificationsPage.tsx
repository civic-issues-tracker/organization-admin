import { useEffect, useMemo, useState } from 'react';
import { Phone, Search, Send } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { getOrganizationAdminWorkspace, addMessageToThread } from '../organizationAdminWorkspace';

const getThreadSourceLabel = (threadId: string) => {
	if (threadId === 'dispatch') return 'Dispatch / Admin';
	if (threadId === 'city-alerts') return 'City Hall Alerts';
	return 'Reporter follow-up';
};

const OrganizationAdminNotificationsPage = () => {
	const { user, showToast } = useAuth();
	const seed = user?.email ?? user?.id ?? user?.full_name;
	const workspace = useMemo(() => getOrganizationAdminWorkspace(seed), [seed]);
	const [activeThreadId, setActiveThreadId] = useState(workspace.chatThreads[0]?.id ?? '');
	const [threadSearch, setThreadSearch] = useState('');
	const [messageText, setMessageText] = useState('');
	const [localMessages, setLocalMessages] = useState<Record<string, { id: string; from: 'dispatch' | 'organization_admin'; text: string; at: string }[]>>({});
	const [selectedThreadOnly, setSelectedThreadOnly] = useState(false);
	const [threadTypeFilter, setThreadTypeFilter] = useState<'all' | 'dispatch' | 'city-alerts' | 'reporter' | 'unread'>('all');
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	const filteredThreads = useMemo(() => {
		const q = threadSearch.trim().toLowerCase();
		return workspace.chatThreads.filter((thread) => {
			if (threadTypeFilter !== 'all') {
				if (threadTypeFilter === 'unread' && (!thread.unread || thread.unread === 0)) return false;
				if (threadTypeFilter !== 'unread' && thread.id !== threadTypeFilter) return false;
			}
			if (!q) return true;
			return (
				thread.name.toLowerCase().includes(q) ||
				(thread.preview ?? '').toLowerCase().includes(q) ||
				thread.messages.some((message) => message.text.toLowerCase().includes(q))
			);
		});
	}, [threadSearch, threadTypeFilter, workspace.chatThreads]);

	useEffect(() => {
		if (filteredThreads.some((thread) => thread.id === activeThreadId)) return;
		const nextThreadId = filteredThreads[0]?.id ?? workspace.chatThreads[0]?.id ?? '';
		if (!nextThreadId || nextThreadId === activeThreadId) return;
		const timer = window.setTimeout(() => {
			setActiveThreadId(nextThreadId);
		}, 0);
		return () => window.clearTimeout(timer);
	}, [activeThreadId, filteredThreads, workspace.chatThreads]);

	const activeThread = useMemo(() => {
		const found = filteredThreads.find((thread) => thread.id === activeThreadId) ?? filteredThreads[0] ?? workspace.chatThreads[0];
		return found;
	}, [activeThreadId, filteredThreads, workspace.chatThreads]);

	const messages = localMessages[activeThread.id] ?? activeThread.messages;
	const visibleThreads = selectedThreadOnly ? filteredThreads.filter((thread) => thread.id === activeThread.id) : filteredThreads;

	const sendMessage = () => {
		if (!messageText.trim()) return;
		const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const msg = { id: `local-${Date.now()}`, from: 'organization_admin' as const, text: messageText.trim(), at: time };
		const thread = addMessageToThread(seed, activeThread.id, msg);
		if (thread) {
			setLocalMessages((prev) => ({ ...prev, [activeThread.id]: thread.messages }));
			setMessageText('');
			showToast('Message saved to local thread.', 'success');
		} else {
			showToast('Failed to save message locally.', 'error');
		}
	};

	return (
		<section>
			<header className="mb-3 flex items-start justify-between">
				<div>
					<h2 className="text-[42px] font-black leading-tight text-slate-900">Message Center</h2>
					<p className="text-sm text-slate-500">Communicate with citizens and dispatch centers.</p>
					<p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
						Seeded for {user?.full_name || workspace.displayName} • {workspace.departmentLabel}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
						<Search size={14} className="mr-1 text-slate-400" />
						<input value={threadSearch} onChange={(e) => setThreadSearch(e.target.value)} placeholder="Search conversations, dispatch, or message text..." className="w-64 bg-transparent text-xs outline-none" />
					</div>
					{threadSearch ? (
						<button onClick={() => setThreadSearch('')} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700" aria-label="Clear conversation search">
							Clear
						</button>
					) : null}
					<button onClick={() => setIsFilterOpen((s) => !s)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700" aria-label="Open notification filters">
						Filters
					</button>
					<button onClick={() => setSelectedThreadOnly((s) => !s)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700" title="Toggle focused thread view" aria-label="Toggle focused thread view">
						{selectedThreadOnly ? 'Focused' : 'Focus active'}
					</button>
				</div>
			</header>

			{isFilterOpen ? (
				<div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs">
					<span className="font-semibold text-slate-600">Filter by type:</span>
					{([
						{ label: 'All', value: 'all' },
						{ label: 'Unread', value: 'unread' },
						{ label: 'Dispatch', value: 'dispatch' },
						{ label: 'City Hall', value: 'city-alerts' },
						{ label: 'Reporter', value: 'reporter' },
					] as const).map((option) => (
						<button
							key={option.value}
							onClick={() => {
								setThreadTypeFilter(option.value);
								setIsFilterOpen(false);
							}}
							className={`rounded-full border px-3 py-1 font-semibold ${
								threadTypeFilter === option.value ? 'border-secondary bg-secondary text-white' : 'border-slate-200 bg-white text-secondary'
							}`}
						>
							{option.label}
						</button>
					))}
					{threadTypeFilter !== 'all' ? (
						<button onClick={() => setThreadTypeFilter('all')} className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-secondary">
							Reset filter
						</button>
					) : null}
				</div>
			) : null}

			<div className="grid min-h-[81vh] grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-3 xl:grid-cols-12">
				<aside className="rounded-xl border border-slate-200 bg-slate-50 p-3 xl:col-span-4">
					<div className="mb-2 flex items-center justify-between">
						<h3 className="text-lg font-bold text-slate-900">Conversations</h3>
						<span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{visibleThreads.length} shown</span>
					</div>
					<div className="mb-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500">
						<input value={threadSearch} onChange={(e) => setThreadSearch(e.target.value)} placeholder="Search conversations..." className="w-full bg-transparent text-xs outline-none" />
					</div>
					<div className="space-y-1">
						{visibleThreads.map((thread) => (
							<button
								key={thread.id}
								onClick={() => setActiveThreadId(thread.id)}
								className={`w-full rounded-lg border p-2 text-left ${
									activeThreadId === thread.id ? 'border-slate-300 bg-white' : 'border-transparent hover:bg-white/80'
								}`}
							>
								<div className="mb-1 flex items-center justify-between text-xs">
									<span className="font-semibold text-slate-800">{thread.name}</span>
									<span className="text-slate-500">{thread.time}</span>
								</div>
								<div className="flex items-center justify-between">
									<p className="text-xs text-slate-600">{thread.preview}</p>
									{thread.unread > 0 ? (
										<span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-white">{thread.unread}</span>
									) : null}
								</div>
							</button>
						))}
						{visibleThreads.length === 0 ? (
							<div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-3 text-xs text-slate-500">
								No conversations match your search or filter. Try a different type, name, preview text, or message body.
							</div>
						) : null}
					</div>
				</aside>

				<div className="rounded-xl border border-slate-200 bg-white xl:col-span-8">
					<div className="flex items-center justify-between border-b border-slate-200 p-3">
						<div className="flex items-center gap-2">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">D</span>
							<div>
								<h4 className="font-semibold text-slate-900">{activeThread.name}</h4>
								<p className="text-[11px] text-emerald-600">{activeThread.online ? 'ONLINE' : 'ACTIVE'}</p>
								<p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Source: {getThreadSourceLabel(activeThread.id)}</p>
							</div>
						</div>
						<div className="flex items-center gap-3 text-slate-500">
							<button type="button" onClick={() => showToast(`Calling ${activeThread.name}...`, 'success')} className="rounded-full p-1 hover:bg-slate-100" aria-label="Call conversation">
								<Phone size={15} />
							</button>
							<button type="button" onClick={() => showToast(`Conversation actions opened for ${activeThread.name}.`, 'success')} className="rounded-full px-2 py-1 hover:bg-slate-100" aria-label="Conversation actions menu">
								⋮
							</button>
						</div>
					</div>

					<div className="space-y-3 p-4 text-sm">
						<div className="mx-auto w-fit rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">Today</div>

						{messages.map((message) => (
							<div key={message.id} className={message.from === 'organization_admin' ? 'ml-auto max-w-[70%]' : 'max-w-[70%]'}>
								<div
									className={
										message.from === 'organization_admin'
											? 'rounded-2xl bg-secondary p-3 text-white'
											: 'rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-800'
									}
								>
									{message.text}
								</div>
								<p className={`mt-1 text-xs text-slate-500 ${message.from === 'organization_admin' ? 'text-right' : ''}`}>{message.at}</p>
							</div>
						))}
					</div>

					<div className="mt-6 flex items-center gap-2 border-t border-slate-200 p-3">
						<input
							placeholder="Type a message to Dispatch..."
							value={messageText}
							onChange={(e) => setMessageText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') sendMessage();
							}}
							className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none"
						/>
						<button
							className="rounded-full bg-secondary p-2 text-white disabled:opacity-40"
							onClick={sendMessage}
							disabled={!messageText.trim()}
							title="Send message"
							aria-label="Send message"
						>
							<Send size={14} />
						</button>
					</div>
				</div>
			</div>
		</section>
	);
};

export default OrganizationAdminNotificationsPage;