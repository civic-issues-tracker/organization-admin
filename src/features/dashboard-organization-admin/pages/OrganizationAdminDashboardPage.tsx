import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, MapPin, MoreHorizontal, MoreVertical, Search, Send, TriangleAlert } from 'lucide-react';
import ThemeLoader from '../../../components/ui/ThemeLoader';
import { type OrganizationAdminTicket, type IssuePriority } from '../organizationAdminMockData';
import { useOrganizationAdminIssues } from '../hooks/useOrganizationAdminIssues';
import { useMyPerformance } from '../hooks/useMyPerformance';
import { useAuth } from '../../../hooks/useAuth';

const priorityTone: Record<string, string> = {
	High: 'text-red-600',
	Medium: 'text-amber-600',
	Low: 'text-emerald-600',
};

const statusTone: Record<OrganizationAdminTicket['status'], string> = {
	submitted: 'bg-red-50 text-red-700',
	in_progress: 'bg-amber-50 text-amber-700',
	resolved: 'bg-emerald-50 text-emerald-700',
	rejected: 'bg-slate-100 text-slate-600',
	pending_admin: 'bg-indigo-50 text-indigo-700',
	escalated: 'bg-orange-50 text-orange-700',
};

const statusLabels: Record<OrganizationAdminTicket['status'], string> = {
	submitted: 'Submitted',
	in_progress: 'In Progress',
	resolved: 'Resolved',
	rejected: 'Rejected',
	pending_admin: 'Pending Admin',
	escalated: 'Escalated',
};

const formatStatusLabel = (status?: OrganizationAdminTicket['status']) => {
	if (!status) return 'Submitted';
	return statusLabels[status] ?? 'Submitted';
};

type StatusModalMode = 'status' | 'release' | 'escalate';

type StatusModalState = {
	ticket: OrganizationAdminTicket;
	mode: StatusModalMode;
	nextStatus: OrganizationAdminTicket['status'];
	note: string;
};

const getStatusModalHeading = (mode: StatusModalMode) => {
	if (mode === 'release') return 'Release Issue';
	if (mode === 'escalate') return 'Escalate Issue';
	return 'Status Transition';
};

const getStatusModalFieldLabel = (mode: StatusModalMode) => {
	if (mode === 'release') return 'Release note';
	if (mode === 'escalate') return 'Escalation reason';
	return 'Internal note';
};

const getStatusModalPlaceholder = (mode: StatusModalMode) => {
	if (mode === 'escalate') return 'Describe why this issue should be escalated...';
	return 'Add an optional internal note...';
};

const OrganizationAdminDashboardPage = () => {
	const { user, showToast } = useAuth();
	const navigate = useNavigate();
	const [searchQuery, setSearchQuery] = useState('');
	const { tickets, resolvedTickets, isLoading, error, updateStatus, updateInternalNotes, releaseIssue, escalateIssue, updatePriority } = useOrganizationAdminIssues();
	const { weeklyPerformance: rawWeeklyPerformance } = useMyPerformance();
	const [showResolved, setShowResolved] = useState(false);
	const [showAllActiveTickets, setShowAllActiveTickets] = useState(false);
	const [statusModal, setStatusModal] = useState<StatusModalState | null>(null);
	const orgName = user?.organization_name ?? user?.full_name ?? 'Your Organization';

	// The backend returns assigned_admin_name as User.__str__() → "Full Name (email@example.com)"
	// We must check if the current user's email OR full_name appears in that string.
	const currentEmail = (user?.email || '').trim().toLowerCase();
	const currentFullName = (user?.full_name || '').trim().toLowerCase();

	// All tickets (active + resolved) for selection lookup
	const allTickets = useMemo(() => [...tickets, ...resolvedTickets], [tickets, resolvedTickets]);
	
	// Transform backend weekly_performance into bar chart data
	const weeklyPerformance = useMemo(() => {
		// Fill all 7 days of the week so chart always has 7 bars
		const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const dayMap = new Map(rawWeeklyPerformance.map((d) => [d.day, d]));

		const data = allDays.map((day) => {
			const found = dayMap.get(day);
			return {
				day,
				created: found?.created ?? 0,
				resolved: found?.resolved ?? 0,
				total: (found?.created ?? 0) + (found?.resolved ?? 0),
			};
		});

		const maxCount = Math.max(...data.map((d) => d.total), 1);
		return data.map((d) => ({
			day: d.day,
			count: d.total,
			created: d.created,
			resolved: d.resolved,
			heightCode: Math.max(8, Math.round((d.total / maxCount) * 80)),
		}));
	}, [rawWeeklyPerformance]);

	const filteredTickets = tickets.filter((t) => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return true;
		return (
			t.issueNumber.toLowerCase().includes(q) ||
			(t.location ?? '').toLowerCase().includes(q) ||
			(t.title ?? '').toLowerCase().includes(q) ||
			(t.summary ?? '').toLowerCase().includes(q)
		);
	});
	const activeTicketPreviewLimit = 6;
	const visibleActiveTickets = showAllActiveTickets
		? filteredTickets
		: filteredTickets.slice(0, activeTicketPreviewLimit);
	const location = useLocation();
	const [selectedId, setSelectedId] = useState(() => location.state?.selectedId ?? tickets[0]?.id ?? '');
	const [note, setNote] = useState('');

	const selected = useMemo(
		// Search both active and resolved so clicking a resolved ticket works
		() => allTickets.find((ticket) => ticket.id === selectedId) ?? allTickets[0],
		[selectedId, allTickets],
	);
	const statusLabel = formatStatusLabel(selected?.status);
	const assignedAdminName = selected?.assignedAdminName?.trim() || '';
	const statusModalHeading = statusModal ? getStatusModalHeading(statusModal.mode) : '';
	const statusModalFieldLabel = statusModal ? getStatusModalFieldLabel(statusModal.mode) : '';
	const statusModalPlaceholder = statusModal ? getStatusModalPlaceholder(statusModal.mode) : '';
	const assignedLower = assignedAdminName.toLowerCase();
	const isAssignedToCurrentUser =
		assignedAdminName.length > 0 &&
		(
			(currentEmail.length > 0 && assignedLower.includes(currentEmail)) ||
			(currentFullName.length > 0 && assignedLower.includes(currentFullName))
		);
	const isLockedByOther = assignedAdminName.length > 0 && !isAssignedToCurrentUser;

	const openStatusModal = (mode: StatusModalMode, nextStatus: OrganizationAdminTicket['status']) => {
		if (!selected || selected.status === nextStatus) return;
		if (isLockedByOther) {
			showToast(`This issue is locked by ${assignedAdminName}.`, 'error');
			return;
		}
		setStatusModal({ ticket: selected, mode, nextStatus, note: '' });
	};

	const closeStatusModal = () => setStatusModal(null);

	const confirmStatusModal = async () => {
		if (!statusModal) return;
		const { ticket, mode, nextStatus } = statusModal;
		const note = statusModal.note.trim();
		if (mode === 'escalate' && !note) {
			showToast('Escalation reason is required.', 'error');
			return;
		}
		if ((mode === 'status' || mode === 'release') && !note) {
			showToast('No note provided for this status change.', 'error');
		}
		try {
			if (mode === 'status') {
				await updateStatus(ticket.id, nextStatus);
				if (note) {
					const newNoteText = ticket.internalNotes
						? `${ticket.internalNotes}\n\n[${new Date().toLocaleString()}] Status -> ${formatStatusLabel(nextStatus)}: ${note}`
						: `[${new Date().toLocaleString()}] Status -> ${formatStatusLabel(nextStatus)}: ${note}`;
					await updateInternalNotes(ticket.id, newNoteText);
				}
				showToast(`Status updated to ${formatStatusLabel(nextStatus)} for ${ticket.issueNumber}.`, 'success');
			} else if (mode === 'release') {
				await releaseIssue(ticket.id, note || undefined);
				if (note) {
					const newNoteText = ticket.internalNotes
						? `${ticket.internalNotes}\n\n[${new Date().toLocaleString()}] Release: ${note}`
						: `[${new Date().toLocaleString()}] Release: ${note}`;
					await updateInternalNotes(ticket.id, newNoteText);
				}
				showToast(`Issue ${ticket.issueNumber} released.`, 'success');
			} else {
				await escalateIssue(ticket.id, note);
				const newNoteText = ticket.internalNotes
					? `${ticket.internalNotes}\n\n[${new Date().toLocaleString()}] Escalated: ${note}`
					: `[${new Date().toLocaleString()}] Escalated: ${note}`;
				await updateInternalNotes(ticket.id, newNoteText);
				showToast(`Issue ${ticket.issueNumber} escalated to system admin.`, 'success');
			}
			closeStatusModal();
		} catch (err) {
			console.error('Failed to update status', err);
			showToast('Failed to update status.', 'error');
		}
	};

	const setIssueStatus = (status: OrganizationAdminTicket['status']) => {
		if (!selected || selected.status === status) return;
		if (isLockedByOther) {
			showToast(`This issue is locked by ${assignedAdminName}.`, 'error');
			return;
		}
		openStatusModal('status', status);
	};

	const cycleStatus = () => {
		if (!selected) return;
		const order: OrganizationAdminTicket['status'][] = ['submitted', 'in_progress', 'resolved'];
		const current =
			selected.status === 'rejected' || !order.includes(selected.status)
				? 'submitted'
				: selected.status;
		const next = order[(order.indexOf(current) + 1) % order.length];
		openStatusModal('status', next);
	};

	const openDirections = () => {
		if (!selected) return;
		navigate('/dashboard/map');
		showToast(`Opened the service map for ${selected.issueNumber}.`, 'success');
	};

	const sendNote = async () => {
		if (!selected) return;
		if (!note.trim()) return;
		try {
			// Append the new note to existing notes if any, separated by newlines
			const newNoteText = selected.internalNotes 
				? `${selected.internalNotes}\n\n[${new Date().toLocaleString()}] ${note.trim()}`
				: `[${new Date().toLocaleString()}] ${note.trim()}`;
			
			await updateInternalNotes(selected.id, newNoteText);
			showToast(`Note saved to ${selected.issueNumber}.`, 'success');
			setNote('');
		} catch (err) {
			console.error('Failed to save note.', err);
			showToast('Failed to save note.', 'error');
		}
	};

	const handleRelease = async () => {
		if (!selected) return;
		if (!isAssignedToCurrentUser) {
			showToast('Only the assigned admin can release this issue.', 'error');
			return;
		}
		openStatusModal('release', 'submitted');
	};

	const handleEscalate = async () => {
		if (!selected) return;
		if (isLockedByOther) {
			showToast(`This issue is locked by ${assignedAdminName}.`, 'error');
			return;
		}
		openStatusModal('escalate', 'escalated');
	};

	const handlePriorityChange = async (newPriority: IssuePriority) => {
		if (!selected) return;
		if (isLockedByOther) {
			showToast(`This issue is locked by ${assignedAdminName}.`, 'error');
			return;
		}
		try {
			await updatePriority(selected.id, newPriority);
			showToast(`Priority updated to ${newPriority}.`, 'success');
		} catch (err) {
			console.error('Failed to update priority', err);
			showToast('Failed to update priority.', 'error');
		}
	};

	if (isLoading && tickets.length === 0) {
		return (
			<section className="flex min-h-[60vh] items-center justify-center">
				<ThemeLoader size="md" />
			</section>
		);
	}

	if (!selected) {
		return (
			<section>
				<div className="rounded-2xl border border-black/5 bg-slate-50 p-6 text-sm text-slate-500">
					No organization issues are available right now.
				</div>
			</section>
		);
	}

	return (
		<section>
			<header className="mb-3 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-[38px] font-black leading-[1.05] text-slate-900">Issue Queue</h2>
					<p className="text-xs text-slate-500">Review, update, and dispatch assigned civic issues.</p>
					<p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-secondary">
						Assigned to {orgName} • {error ? 'Offline cache' : 'Live data'}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-full border border-black/5 bg-slate-50 px-3 py-1.5">
						<Search size={14} className="mr-1 text-slate-400" />
						<input
							placeholder="Search ticket ID or address..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-56 bg-transparent text-xs outline-none"
						/>
					</div>
					<button type="button" className="rounded-full border border-black/5 bg-slate-50 p-2 text-slate-500 hover:bg-slate-100" aria-label="More options">
						<MoreHorizontal size={14} />
					</button>
				</div>
			</header>

			<div className="grid grid-cols-12 gap-3">
				<div className="col-span-12 space-y-3 xl:col-span-5">
					<div className="rounded-2xl border border-black/5 bg-slate-50 p-3">
						<div className="mb-2 flex items-center justify-between">
							<h3 className="text-sm font-semibold text-slate-900">My Weekly Performance</h3>
							<BarChart3 size={16} className="text-slate-400" />
						</div>
						<div className="grid grid-cols-7 items-end gap-2 h-24">
							{weeklyPerformance.map((item, index) => (
								<div key={`${item.day}-${index}`} className="text-center group relative">
									<div className="mx-auto flex w-3 flex-col-reverse gap-px rounded-sm overflow-hidden" style={{ height: `${item.heightCode}px` }}>
										{item.created > 0 && (
											<div
												className="w-full bg-secondary transition-all group-hover:bg-secondary/80"
												style={{ flex: item.created }}
											/>
										)}
										{item.resolved > 0 && (
											<div
												className="w-full bg-emerald-500 transition-all group-hover:bg-emerald-600"
												style={{ flex: item.resolved }}
											/>
										)}
										{item.count === 0 && (
											<div className="w-full bg-slate-200" style={{ flex: 1 }} />
										)}
									</div>
									<p className="mt-1 text-[10px] text-slate-400">{item.day}</p>
									{/* Tooltip for exact count */}
									<div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap">
										{item.created}c / {item.resolved}r
									</div>
								</div>
							))}
						</div>
						{/* Legend */}
						<div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-slate-500">
							<span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-secondary"></span> Created</span>
							<span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500"></span> Resolved</span>
						</div>
					</div>



					<div className="min-h-[72vh] rounded-2xl border border-black/5 bg-slate-50 p-3">

						<div className="mb-2 flex items-center justify-between">
							<h3 className="text-base font-bold text-slate-900">Active Tickets</h3>
							<div className="flex items-center gap-2">
								<button 
									onClick={() => navigate('/dashboard/assigned')}
									className="text-[10px] font-bold uppercase text-secondary hover:text-secondary/80 transition"
								>
									View My Assigned &rarr;
								</button>
								<span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{filteredTickets.length} Total</span>
							</div>
						</div>
						<div className="space-y-2">
							{visibleActiveTickets.map((ticket) => (
								<button
									type="button"
									key={ticket.id}
									onClick={() => setSelectedId(ticket.id)}
									className={`w-full rounded-xl border bg-white p-3 text-left transition ${
										selected?.id === ticket.id
											? 'border-secondary shadow-sm'
											: 'border-black/5 hover:border-black/10'
									}`}
								>
									<div className="mb-1 flex items-center justify-between">
										<p className="text-xs font-bold text-slate-500">{ticket.issueNumber}</p>
										<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[ticket.status]}`}>
											{formatStatusLabel(ticket.status)}
										</span>
									</div>
									<h4 className="text-sm font-semibold text-slate-900">{ticket.title}</h4>
									<p className="mt-1 text-xs text-slate-500">{ticket.location}</p>
									<div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
										{ticket.assignedAdminName ? (
											<span className="rounded-full border border-black/5 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600">
												Assigned: {ticket.assignedAdminName}
										</span>
										) : null}
										{ticket.reopenReason ? (
											<span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-semibold text-red-700">
												Reopened
											</span>
										) : null}
									</div>
									<div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 text-[11px]">
										<p className={priorityTone[ticket.priority]}>
											<TriangleAlert size={12} className="mr-1 inline" />
											{ticket.priority} Priority
										</p>
										<span className="text-slate-400">{ticket.timeAgo}</span>
									</div>
								</button>
							))}
						</div>
						{filteredTickets.length > activeTicketPreviewLimit && (
							<div className="mt-3 flex justify-center">
								<button
									type="button"
									onClick={() => setShowAllActiveTickets((prev) => !prev)}
									className="rounded-full border border-black/5 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-black/20 hover:bg-slate-50"
								>
									{showAllActiveTickets ? 'Show fewer active tickets' : `Show all active tickets (${filteredTickets.length - activeTicketPreviewLimit} more)`}
								</button>
							</div>
						)}

						{/* ── Resolved tickets — collapsible so admin can reopen them ── */}
						{resolvedTickets.length > 0 && (
							<div className="mt-4 border-t border-black/5 pt-3">
								<button
									type="button"
									onClick={() => setShowResolved((p) => !p)}
									className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-slate-700 hover:text-slate-900"
								>
									<span>Resolved ({resolvedTickets.length})</span>
									<span className="text-xs">{showResolved ? '▲ Hide' : '▼ Show'}</span>
								</button>
								{showResolved && (
									<div className="space-y-2">
										{resolvedTickets.map((ticket) => (
											<button
												type="button"
												key={ticket.id}
												onClick={() => setSelectedId(ticket.id)}
												className={`w-full rounded-xl border bg-white p-3 text-left opacity-80 transition ${
													selected?.id === ticket.id
														? 'border-secondary shadow-sm opacity-100'
														: 'border-black/5 hover:border-black/10 hover:opacity-100'
												}`}
											>
												<div className="mb-1 flex items-center justify-between">
													<p className="text-xs font-bold text-slate-500">{ticket.issueNumber}</p>
													<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[ticket.status]}`}>
														{formatStatusLabel(ticket.status)}
													</span>
												</div>
												<h4 className="text-sm font-semibold text-slate-900">{ticket.title}</h4>
												<p className="mt-1 text-xs text-slate-500">{ticket.location}</p>
												<div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
													{ticket.assignedAdminName ? (
														<span className="rounded-full border border-black/5 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600">
															Assigned: {ticket.assignedAdminName}
													</span>
													) : null}
													{ticket.reopenReason ? (
														<span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-semibold text-red-700">
															Reopened
														</span>
													) : null}
												</div>
											</button>
										))}
									</div>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="col-span-12 flex min-h-[72vh] flex-col rounded-2xl border border-slate-200 bg-white p-3 xl:col-span-7">
					<div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
						<div className="flex items-center gap-2">
							<span className="text-xl font-black text-slate-900">{selected?.issueNumber ?? 'N/A'}</span>
							<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{selected?.category ?? 'Uncategorized'}</span>
						</div>
						<div className="flex items-center gap-2 text-sm text-slate-500">
							<select
								value={selected?.priority || 'Low'}
								onChange={(e) => handlePriorityChange(e.target.value as IssuePriority)}
								disabled={isLockedByOther}
								className={`rounded-full border px-2 py-1 outline-none text-xs font-semibold ${priorityTone[selected?.priority || 'Low']} border-slate-200 bg-transparent disabled:opacity-50`}
							>
								<option value="Low" className="text-emerald-600">Low Priority</option>
								<option value="Medium" className="text-amber-600">Medium Priority</option>
								<option value="High" className="text-red-600">High Priority</option>
							</select>
							<button onClick={cycleStatus} className="rounded-full border border-slate-200 px-2 py-1" disabled={isLockedByOther}>
								Status: {statusLabel}
							</button>
							<MoreVertical size={16} />
						</div>
					</div>

					<div className="mb-3 flex flex-wrap gap-2">
						{(['submitted', 'in_progress', 'resolved', 'rejected'] as const).map((status) => (
							<button
								type="button"
								key={status}
								onClick={() => setIssueStatus(status)}
								disabled={selected.status === status || isLockedByOther}
								className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
									selected.status === status
										? 'border-slate-300 bg-slate-100 text-slate-800'
										: 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
								}`}
							>
								Set {formatStatusLabel(status)}
							</button>
						))}
					</div>

					<div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
						{assignedAdminName && (
							<span className={`rounded-full border px-3 py-1 ${isLockedByOther ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-100 text-slate-800'}`}>
								Assigned: {assignedAdminName}
							</span>
						)}
						{selected?.reopenReason ? (
							<span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
								Reopened
							</span>
						) : null}
						<button
							type="button"
							onClick={handleRelease}
							disabled={!isAssignedToCurrentUser}
							className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Release
						</button>
						<button
							type="button"
							onClick={handleEscalate}
							disabled={isLockedByOther || selected.status === 'escalated'}
							className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
						>
							Escalate
						</button>
						{isLockedByOther && (
							<span className="text-amber-700">Locked by another admin.</span>
						)}
					</div>

					<div className="mb-4">
						<div className="mb-2 flex items-center justify-between">
							<span className="font-mono text-sm font-bold text-slate-800">{selected?.issueNumber}</span>
							<span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{selected?.category || 'General'}</span>
						</div>
						<h3 className="mb-2 text-base font-bold leading-snug text-slate-900">
							{selected?.title ?? selected?.summary ?? 'Reported issue'}
						</h3>
						{/* Detail: full description — gives the admin the complete context */}
						<div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
							<p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Report</p>
							<p className="text-sm leading-relaxed text-slate-700">{selected?.summary ?? 'Select an issue to review details.'}</p>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center" style={{minHeight: '10rem'}}>
							{selected?.images && selected.images.length > 0 ? (
								<img
									src={selected.images[0].image}
									alt="Reported issue"
									className="h-40 w-full object-cover"
									onError={(e) => { e.currentTarget.style.display = 'none'; }}
								/>
							) : (
								<p className="text-sm text-slate-500">No images provided</p>
							)}
						</div>

						<div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
							<MapPin className="mx-auto text-slate-500" size={22} />
							<p className="mt-2 font-semibold text-slate-700">{selected?.location ?? 'Location unavailable'}</p>
							<p className="text-xs text-slate-500">Lat: {selected?.lat ?? 'N/A'}, Lng: {selected?.lng ?? 'N/A'}</p>
							<button onClick={openDirections} className="mt-3 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold text-slate-600">
								Get Directions
							</button>
						</div>

						<div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
							<h4 className="mb-1 text-sm font-semibold text-slate-800">Reporter Info</h4>
							<p className="text-sm font-semibold text-slate-900">{selected.reporter ?? 'Unknown reporter'}</p>
							<p className="text-xs text-slate-500">{selected.reporterPhone ?? 'No contact details available'}</p>
						</div>
					</div>

					<div className="mt-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
						<input
							placeholder="Type an internal note or message to the citizen..."
							value={note}
							onChange={(e) => setNote(e.target.value)}
							className="flex-1 bg-transparent px-2 text-sm outline-none"
						/>
						<button
							className="rounded-full bg-secondary p-2 text-white disabled:opacity-40"
							disabled={!note.trim()}
							onClick={sendNote}
							title="Send note"
							aria-label="Send note"
						>
							<Send size={14} />
						</button>
					</div>
					{selected?.internalNotes && (
						<div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
							<h4 className="mb-1 font-semibold text-slate-800">Previous Notes:</h4>
							<pre className="whitespace-pre-wrap font-sans">{selected.internalNotes}</pre>
						</div>
					)}
				</div>

				{selected?.reopenReason ? (
					<div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
						<strong className="block text-[11px] uppercase tracking-[0.2em]">Reopen Reason</strong>
						<span className="mt-2 block">{selected.reopenReason}</span>
					</div>
				) : null}
			</div>

			{statusModal ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
					<div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
						<div className="mb-4">
							<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{statusModalHeading}</p>
							<h3 className="mt-1 text-2xl font-black text-slate-900">{statusModal.ticket.issueNumber}</h3>
							<p className="mt-1 text-sm text-slate-500">Current status: <span className="font-semibold text-slate-900">{formatStatusLabel(statusModal.ticket.status)}</span></p>
							<p className="text-sm text-slate-500">New status: <span className="font-semibold text-slate-900">{formatStatusLabel(statusModal.nextStatus)}</span></p>
						</div>
						<label className="block">
							<span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{statusModalFieldLabel}</span>
							<textarea
								value={statusModal.note}
								onChange={(e) => setStatusModal((prev) => prev ? { ...prev, note: e.target.value } : prev)}
								rows={5}
								placeholder={statusModalPlaceholder}
								className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400"
							/>
						</label>
						<div className="mt-5 flex items-center justify-end gap-2">
							<button type="button" onClick={closeStatusModal} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
								Cancel
							</button>
							<button type="button" onClick={confirmStatusModal} className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white">
								Confirm
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	);
};

export default OrganizationAdminDashboardPage;