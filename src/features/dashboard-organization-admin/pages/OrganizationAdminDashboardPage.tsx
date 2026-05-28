import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { BarChart3, MapPin, MoreHorizontal, MoreVertical, Search, Send, TriangleAlert } from 'lucide-react';
import { type OrganizationAdminTicket } from '../organizationAdminMockData';
import { useOrganizationAdminIssues } from '../hooks/useOrganizationAdminIssues';
import { useAuth } from '../../../hooks/useAuth';

const priorityTone: Record<string, string> = {
	High: 'text-[#C03E3E]',
	Medium: 'text-[#AF7A1E]',
	Low: 'text-[#2E8D56]',
};

const statusTone: Record<OrganizationAdminTicket['status'], string> = {
	submitted: 'bg-[#FFE9EA] text-[#D63945]',
	in_progress: 'bg-[#FFF4D8] text-[#9A6F16]',
	resolved: 'bg-[#DCF5E4] text-[#20844A]',
	rejected: 'bg-[#EDEDED] text-[#6A6A6A]',
	pending_admin: 'bg-[#E9E7F6] text-[#5B54A4]',
	escalated: 'bg-[#FFE6D6] text-[#B84A1E]',
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
	const seed = user?.email ?? user?.id ?? user?.full_name;
	const [searchQuery, setSearchQuery] = useState('');
	const { tickets, resolvedTickets, isLoading, error, updateStatus, updateInternalNotes, releaseIssue, escalateIssue } = useOrganizationAdminIssues(seed);
	const [showResolved, setShowResolved] = useState(false);
	const [statusModal, setStatusModal] = useState<StatusModalState | null>(null);
	// role_name from backend is 'organization_admin' — use full_name as the org name
	const orgName = user?.full_name ||
		((user as any)?.role_name === 'organization_admin' ? user?.full_name : null) ||
		'Your Organization';

	// All tickets (active + resolved) for selection lookup
	const allTickets = useMemo(() => [...tickets, ...resolvedTickets], [tickets, resolvedTickets]);
	
	// Dynamic weekly performance based on tickets processed/resolved
	const weeklyPerformance = useMemo(() => {
		const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		
		// Find the most recent ticket date to anchor the week, so the graph isn't flat if DB is old
		let anchorDate = new Date();
		if (allTickets.length > 0) {
			const dates = allTickets.map(t => new Date(t.resolutionDate || t.createdAt || new Date()).getTime());
			const validDates = dates.filter(d => !Number.isNaN(d));
			if (validDates.length > 0) {
				anchorDate = new Date(Math.max(...validDates));
			}
		}
		
		const last7Days = Array.from({ length: 7 }).map((_, i) => {
			const d = new Date(anchorDate);
			d.setDate(anchorDate.getDate() - (6 - i));
			return {
				day: days[d.getDay()],
				dateString: d.toDateString(),
				count: 0
			};
		});

		// Count any ticket updated or created in those 7 days
		allTickets.forEach((ticket) => {
			// fallback to a recent date if none is found to avoid breaking
			const d = new Date(ticket.resolutionDate || ticket.createdAt || new Date());
			const ticketDateStr = d.toDateString();
			const dayData = last7Days.find((day) => day.dateString === ticketDateStr);
			if (dayData) {
				dayData.count += 1;
			}
		});

		const maxCount = Math.max(...last7Days.map((d) => d.count), 1);
		
		return last7Days.map((d) => {
			// Using inline styles for dynamic height limits instead of tailwind classes
			// h-24 is 6rem (96px). Let's map count to a max of 80px or 100px.
			const heightPx = Math.max(8, Math.round((d.count / maxCount) * 80));
			return {
				day: d.day,
				count: d.count,
				heightCode: heightPx,
			};
		});
	}, [allTickets]);

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
	// The backend returns assigned_admin_name as User.__str__() → "Full Name (email@example.com)"
	// We must check if the current user's email OR full_name appears in that string.
	const currentEmail = (user?.email || '').trim().toLowerCase();
	const currentFullName = (user?.full_name || '').trim().toLowerCase();
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

	if (isLoading && tickets.length === 0) {
		return (
			<section>
				<div className="rounded-2xl border border-[#DFD3C5] bg-[#F9F6F2] p-6 text-sm text-[#857060]">
					Loading organization issues...
				</div>
			</section>
		);
	}

	if (!selected) {
		return (
			<section>
				<div className="rounded-2xl border border-[#DFD3C5] bg-[#F9F6F2] p-6 text-sm text-[#857060]">
					No organization issues are available right now.
				</div>
			</section>
		);
	}

	return (
		<section>
			<header className="mb-3 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-[38px] font-black leading-[1.05] text-[#3E2B1F]">Issue Queue</h2>
					<p className="text-xs text-[#857060]">Review, update, and dispatch assigned civic issues.</p>
					<p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#B08E6A]">
						Assigned to {orgName} • {error ? 'Offline cache' : 'Live data'}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-full border border-[#DDCFC0] bg-[#F8F6F2] px-3 py-1.5">
						<Search size={14} className="mr-1 text-[#9D8A78]" />
						<input
							placeholder="Search ticket ID or address..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-56 bg-transparent text-xs outline-none"
						/>
					</div>
					<button type="button" className="rounded-full border border-[#DDCFC0] bg-[#F8F6F2] p-2 text-[#8B7B69]" aria-label="More options">
						<MoreHorizontal size={14} />
					</button>
				</div>
			</header>

			<div className="grid grid-cols-12 gap-3">
				<div className="col-span-12 space-y-3 xl:col-span-5">
					<div className="rounded-2xl border border-[#DFD3C5] bg-[#F9F6F2] p-3">
						<div className="mb-2 flex items-center justify-between">
							<h3 className="text-sm font-semibold text-[#4A3628]">My Weekly Performance</h3>
							<BarChart3 size={16} className="text-[#B19E8B]" />
						</div>
						<div className="grid grid-cols-7 items-end gap-2 h-24">
							{weeklyPerformance.map((item, index) => (
								<div key={`${item.day}-${index}`} className="text-center group relative">
									<div 
										style={{ height: `${item.heightCode}px` }}
										className="mx-auto w-3 rounded-sm bg-[#B08E6A] transition-all group-hover:bg-[#8B7B69]" 
									/>
									<p className="mt-1 text-[10px] text-[#9D8A78]">{item.day}</p>
									{/* Tooltip for exact count */}
									<div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#3E2B1F] text-white text-[10px] py-1 px-2 rounded pointer-events-none">
										{item.count}
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="min-h-[72vh] rounded-2xl border border-[#DFD3C5] bg-[#F9F6F2] p-3">
						<div className="mb-2 flex items-center justify-between">
							<h3 className="text-base font-bold text-[#4A3628]">Active Tickets</h3>
							<div className="flex items-center gap-2">
								<button 
									onClick={() => navigate('/dashboard/assigned')}
									className="text-[10px] font-bold uppercase text-[#A67C52] hover:text-[#8B643A] transition"
								>
									View My Assigned &rarr;
								</button>
								<span className="rounded-full bg-[#E9DED2] px-2 py-0.5 text-xs text-[#705A47]">{filteredTickets.length} Total</span>
							</div>
						</div>
						<div className="space-y-2">
							{filteredTickets.map((ticket) => (
								<button
									type="button"
									key={ticket.id}
									onClick={() => setSelectedId(ticket.id)}
									className={`w-full rounded-xl border bg-white p-3 text-left transition ${
										selected?.id === ticket.id
											? 'border-[#C9A78A] shadow-[0_0_0_1px_#d4b296]'
											: 'border-[#E4D8CA] hover:border-[#d8c4b0]'
									}`}
								>
									<div className="mb-1 flex items-center justify-between">
										<p className="text-xs font-bold text-[#7A6655]">{ticket.issueNumber}</p>
										<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[ticket.status]}`}>
											{formatStatusLabel(ticket.status)}
										</span>
									</div>
									<h4 className="text-sm font-semibold text-[#362518]">{ticket.title}</h4>
									<p className="mt-1 text-xs text-[#8A7767]">{ticket.location}</p>
									<div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
										{ticket.assignedAdminName ? (
											<span className="rounded-full border border-[#D8C7B4] bg-[#F6EEE4] px-2 py-0.5 font-semibold text-[#6B4C33]">
												Assigned: {ticket.assignedAdminName}
										</span>
										) : null}
										{ticket.reopenReason ? (
											<span className="rounded-full border border-[#E6C1AE] bg-[#FFE8DD] px-2 py-0.5 font-semibold text-[#9C3F1C]">
												Reopened
											</span>
										) : null}
									</div>
									<div className="mt-2 flex items-center justify-between border-t border-[#EFE5DB] pt-2 text-[11px]">
										<p className={priorityTone[ticket.priority]}>
											<TriangleAlert size={12} className="mr-1 inline" />
											{ticket.priority} Priority
										</p>
										<span className="text-[#B2A08F]">{ticket.timeAgo}</span>
									</div>
								</button>
							))}
						</div>

						{/* ── Resolved tickets — collapsible so admin can reopen them ── */}
						{resolvedTickets.length > 0 && (
							<div className="mt-4 border-t border-[#EFE5DB] pt-3">
								<button
									type="button"
									onClick={() => setShowResolved((p) => !p)}
									className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-[#6B5242] hover:text-[#4A3628]"
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
														? 'border-[#C9A78A] shadow-[0_0_0_1px_#d4b296] opacity-100'
														: 'border-[#E4D8CA] hover:border-[#d8c4b0] hover:opacity-100'
												}`}
											>
												<div className="mb-1 flex items-center justify-between">
													<p className="text-xs font-bold text-[#7A6655]">{ticket.issueNumber}</p>
													<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone[ticket.status]}`}>
														{formatStatusLabel(ticket.status)}
													</span>
												</div>
												<h4 className="text-sm font-semibold text-[#362518]">{ticket.title}</h4>
												<p className="mt-1 text-xs text-[#8A7767]">{ticket.location}</p>
												<div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
													{ticket.assignedAdminName ? (
														<span className="rounded-full border border-[#D8C7B4] bg-[#F6EEE4] px-2 py-0.5 font-semibold text-[#6B4C33]">
															Assigned: {ticket.assignedAdminName}
													</span>
													) : null}
													{ticket.reopenReason ? (
														<span className="rounded-full border border-[#E6C1AE] bg-[#FFE8DD] px-2 py-0.5 font-semibold text-[#9C3F1C]">
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

				<div className="col-span-12 flex min-h-[72vh] flex-col rounded-2xl border border-[#DFD3C5] bg-[#F9F6F2] p-3 xl:col-span-7">
					<div className="mb-3 flex items-center justify-between border-b border-[#E7DACD] pb-2">
						<div className="flex items-center gap-2">
							<span className="text-xl font-black text-[#4A3628]">{selected?.issueNumber ?? 'N/A'}</span>
							<span className="rounded-full bg-[#E9E7E2] px-2 py-0.5 text-[11px] font-semibold text-[#617083]">{selected?.category ?? 'Uncategorized'}</span>
						</div>
						<div className="flex items-center gap-2 text-sm text-[#8E7E6D]">
							<button onClick={cycleStatus} className="rounded-full border border-[#E0D3C5] px-2 py-1" disabled={isLockedByOther}>
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
										? 'border-[#C9A78A] bg-[#EFE4D6] text-[#6B4C33]'
										: 'border-[#E0D3C5] bg-white text-[#6D5A48] hover:border-[#C9A78A]'
								}`}
							>
								Set {formatStatusLabel(status)}
							</button>
						))}
					</div>

					<div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
						{assignedAdminName && (
							<span className={`rounded-full border px-3 py-1 ${isLockedByOther ? 'border-[#E6C1AE] bg-[#FFE8DD] text-[#9C3F1C]' : 'border-[#D8C7B4] bg-[#F6EEE4] text-[#6B4C33]'}`}>
								Assigned: {assignedAdminName}
							</span>
						)}
						{selected?.reopenReason ? (
							<span className="rounded-full border border-[#E6C1AE] bg-[#FFE8DD] px-3 py-1 font-semibold text-[#9C3F1C]">
								Reopened
							</span>
						) : null}
						<button
							type="button"
							onClick={handleRelease}
							disabled={!isAssignedToCurrentUser}
							className="rounded-full border border-[#E0D3C5] bg-white px-3 py-1 font-semibold text-[#6D5A48] disabled:cursor-not-allowed disabled:opacity-40"
						>
							Release
						</button>
						<button
							type="button"
							onClick={handleEscalate}
							disabled={isLockedByOther || selected.status === 'escalated'}
							className="rounded-full border border-[#E6C1AE] bg-[#FFE8DD] px-3 py-1 font-semibold text-[#9C3F1C] disabled:cursor-not-allowed disabled:opacity-40"
						>
							Escalate
						</button>
						{isLockedByOther && (
							<span className="text-[#9C3F1C]">Locked by another admin.</span>
						)}
					</div>

					<div className="mb-4">
						<div className="mb-2 flex items-center justify-between">
							<span className="font-mono text-sm font-bold text-[#6B4C33]">{selected?.issueNumber}</span>
							<span className="rounded-full bg-[#E5D5C5] px-2 py-0.5 text-xs font-semibold text-[#5A4737]">{selected?.category || 'General'}</span>
						</div>
						<h3 className="mb-2 text-base font-bold leading-snug text-[#2E2016]">
							{selected?.title ?? selected?.summary ?? 'Reported issue'}
						</h3>
						{/* Detail: full description — gives the admin the complete context */}
						<div className="rounded-xl border border-[#E7DBCF] bg-[#FAF6F2] p-3">
							<p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#9D8A78]">Full Report</p>
							<p className="text-sm leading-relaxed text-[#624F3E]">{selected?.summary ?? 'Select an issue to review details.'}</p>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<div className="overflow-hidden rounded-xl border border-[#E2D6C9] bg-[#D9CFC0] flex items-center justify-center" style={{minHeight: '10rem'}}>
							{selected?.images && selected.images.length > 0 ? (
								<img
									src={selected.images[0].image}
									alt="Reported issue"
									className="h-40 w-full object-cover"
									onError={(e) => { e.currentTarget.style.display = 'none'; }}
								/>
							) : (
								<p className="text-sm text-[#8E7E6D]">No images provided</p>
							)}
						</div>

						<div className="rounded-xl border border-[#E2D6C9] bg-[#EFE7DD] p-4 text-center">
							<MapPin className="mx-auto text-[#7C624D]" size={22} />
							<p className="mt-2 font-semibold text-[#5A4737]">{selected?.location ?? 'Location unavailable'}</p>
							<p className="text-xs text-[#9D8A78]">Lat: {selected?.lat ?? 'N/A'}, Lng: {selected?.lng ?? 'N/A'}</p>
							<button onClick={openDirections} className="mt-3 rounded-full border border-[#DCCDBE] bg-[#F9F6F2] px-4 py-1 text-xs font-semibold text-[#6D5A48]">
								Get Directions
							</button>
						</div>

						<div className="rounded-xl border border-[#E2D6C9] bg-[#F8F3ED] p-3">
							<h4 className="mb-1 text-sm font-semibold text-[#4B392B]">Reporter Info</h4>
							<p className="text-sm font-semibold text-[#3E2D20]">{selected.reporter ?? 'Unknown reporter'}</p>
							<p className="text-xs text-[#8E7B6A]">{selected.reporterPhone ?? 'No contact details available'}</p>
						</div>
					</div>

					<div className="mt-auto flex items-center gap-2 rounded-xl border border-[#E0D4C7] bg-[#F8F3ED] p-2">
						<input
							placeholder="Type an internal note or message to the citizen..."
							value={note}
							onChange={(e) => setNote(e.target.value)}
							className="flex-1 bg-transparent px-2 text-sm outline-none"
						/>
						<button
							className="rounded-full bg-[#6A4834] p-2 text-white disabled:opacity-40"
							disabled={!note.trim()}
							onClick={sendNote}
							title="Send note"
							aria-label="Send note"
						>
							<Send size={14} />
						</button>
					</div>
					{selected?.internalNotes && (
						<div className="mt-3 rounded-xl border border-[#E0D4C7] bg-[#F8F3ED] p-3 text-xs text-[#624F3E]">
							<h4 className="mb-1 font-semibold text-[#4B392B]">Previous Notes:</h4>
							<pre className="whitespace-pre-wrap font-sans">{selected.internalNotes}</pre>
						</div>
					)}
				</div>

				{selected?.reopenReason ? (
					<div className="mb-3 rounded-xl border border-[#E6C1AE] bg-[#FFF4EC] p-3 text-xs text-[#7C3A1D]">
						<strong className="block text-[11px] uppercase tracking-[0.2em]">Reopen Reason</strong>
						<span className="mt-2 block">{selected.reopenReason}</span>
					</div>
				) : null}
			</div>

			{statusModal ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
					<div className="w-full max-w-lg rounded-3xl border border-[#E2D6C9] bg-[#FCF8F2] p-5 shadow-2xl">
						<div className="mb-4">
							<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#8E7A69]">{statusModalHeading}</p>
							<h3 className="mt-1 text-2xl font-black text-[#3E2B1F]">{statusModal.ticket.issueNumber}</h3>
							<p className="mt-1 text-sm text-[#6B5646]">Current status: <span className="font-semibold text-[#3E2A1E]">{formatStatusLabel(statusModal.ticket.status)}</span></p>
							<p className="text-sm text-[#6B5646]">New status: <span className="font-semibold text-[#3E2A1E]">{formatStatusLabel(statusModal.nextStatus)}</span></p>
						</div>
						<label className="block">
							<span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#8B7868]">{statusModalFieldLabel}</span>
							<textarea
								value={statusModal.note}
								onChange={(e) => setStatusModal((prev) => prev ? { ...prev, note: e.target.value } : prev)}
								rows={5}
								placeholder={statusModalPlaceholder}
								className="w-full rounded-2xl border border-[#DCCFC1] bg-white px-4 py-3 text-sm text-[#4A3628] outline-none focus:border-[#C9A78A]"
							/>
						</label>
						<div className="mt-5 flex items-center justify-end gap-2">
							<button type="button" onClick={closeStatusModal} className="rounded-full border border-[#D8CCBD] bg-white px-4 py-2 text-sm font-semibold text-[#6D5A48]">
								Cancel
							</button>
							<button type="button" onClick={confirmStatusModal} className="rounded-full bg-[#6A4834] px-4 py-2 text-sm font-semibold text-white">
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