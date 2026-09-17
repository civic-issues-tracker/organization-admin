import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import ThemeLoader from '../../../components/ui/ThemeLoader';
import { useAuth } from '../../../hooks/useAuth';
import { useOrganizationAdminIssues } from '../hooks/useOrganizationAdminIssues';
import { toOrganizationAdminTicket } from '../organizationAdminMockData';
import { buildResolvedKpis, filterResolvedReports } from '../organizationAdminAnalyticsUtils';
import { organizationAdminIssueApi } from '../services/organizationAdminIssueService';

const formatDateTime = (value?: string) => {
	if (!value) return 'Not recorded';
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? 'Not recorded'
		: date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const formatStatus = (status: string) => status.replaceAll('_', ' ');

const OrganizationAdminAnalyticsPage = () => {
	const { user } = useAuth();
	const accountId = user?.id ?? user?.email;
	const { tickets, resolvedTickets, isLoading } = useOrganizationAdminIssues(accountId);
	const [activeReportId, setActiveReportId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [reportFilter, setReportFilter] = useState('');
	const [showFilterInput, setShowFilterInput] = useState(false);
	const {
		data: activeReport,
		isLoading: isLoadingReport,
		error: activeReportError,
	} = useQuery({
		queryKey: ['orgAdminIssueDetail', accountId ?? 'unauthenticated', activeReportId],
		enabled: Boolean(accountId && activeReportId),
		queryFn: async () => toOrganizationAdminTicket(
			await organizationAdminIssueApi.getById(activeReportId as string),
		),
	});

	const currentEmail = (user?.email || '').trim().toLowerCase();
	const currentFullName = (user?.full_name || '').trim().toLowerCase();

	const myTickets = useMemo(() => {
		return tickets.filter((t) => {
			const assignedName = t.assignedAdminName?.trim() || '';
			const assignedLower = assignedName.toLowerCase();
			return (
				assignedName.length > 0 &&
				(
					(currentEmail.length > 0 && assignedLower.includes(currentEmail)) ||
					(currentFullName.length > 0 && assignedLower.includes(currentFullName))
				)
			);
		});
	}, [tickets, currentEmail, currentFullName]);

	const myResolvedTickets = useMemo(() => {
		return resolvedTickets.filter((t) => {
			const assignedName = t.assignedAdminName?.trim() || '';
			const assignedLower = assignedName.toLowerCase();
			return (
				assignedName.length > 0 &&
				(
					(currentEmail.length > 0 && assignedLower.includes(currentEmail)) ||
					(currentFullName.length > 0 && assignedLower.includes(currentFullName))
				)
			);
		});
	}, [resolvedTickets, currentEmail, currentFullName]);

	const kpis = useMemo(
		() => buildResolvedKpis(myResolvedTickets, myTickets),
		[myResolvedTickets, myTickets],
	);

	const filteredReports = useMemo(
		() => filterResolvedReports(myResolvedTickets, searchQuery, reportFilter),
		[myResolvedTickets, reportFilter, searchQuery],
	);

	if (isLoading && myResolvedTickets.length === 0) {
		return (
			<section className="flex min-h-[60vh] items-center justify-center">
				<ThemeLoader size="md" />
			</section>
		);
	}

	return (
		<section>
			<header className="mb-3 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-[36px] font-black leading-tight text-slate-900">Resolved Tickets</h2>
					<p className="text-sm text-slate-500">Archive of previously resolved and closed issues.</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-full border border-black/5 bg-white px-3 py-1.5 shadow-sm">
						<Search size={14} className="mr-1 text-slate-400" />
						<input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search resolved tickets..." className="w-56 bg-transparent text-xs outline-none text-slate-700 placeholder:text-slate-400" />
					</div>
					<button type="button" onClick={() => setSearchQuery('')} className="rounded-full border border-black/5 bg-white p-2 text-slate-500 shadow-sm" aria-label="Clear search">
						<X size={14} />
					</button>
				</div>
			</header>

			<div className="min-h-[81vh] rounded-[2rem] border border-black/5 bg-white/75 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm">
				<div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
					{kpis.map((kpi) => (
						<div key={kpi.label} className="rounded-2xl border border-black/5 bg-white p-3 text-center shadow-sm">
							<p className={`text-2xl font-black ${kpi.label.includes('High Priority') ? 'text-red-600' : 'text-slate-900'}`}>{kpi.value}</p>
							<p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">{kpi.label}</p>
						</div>
					))}
				</div>

				<div className="mb-3 flex items-center justify-between gap-3">
					<div>
						<h3 className="text-xl font-bold text-slate-900">Archived & Resolved</h3>
						<p className="text-sm text-slate-500">Review past issues and view their resolution reports for {user?.full_name || 'the current organization admin'}.</p>
					</div>
					<div className="flex items-center gap-2 text-xs">
						<div className="relative">
							<button onClick={() => setShowFilterInput((s) => !s)} className="rounded-full border border-black/5 bg-white px-3 py-1.5 shadow-sm">Filter</button>
							{showFilterInput ? (
								<div className="absolute right-0 mt-2 w-56 rounded-2xl border border-black/5 bg-white p-3 shadow-xl">
									<input value={reportFilter} onChange={(e) => setReportFilter(e.target.value)} placeholder="Filter by area or category" className="w-full rounded-xl border border-black/5 p-2 text-sm outline-none" />
									<div className="mt-2 flex justify-end gap-2">
										<button onClick={() => setReportFilter('')} className="rounded-full border border-black/5 px-2 py-1 text-xs">Clear</button>
										<button onClick={() => setShowFilterInput(false)} className="rounded-full bg-secondary px-2 py-1 text-xs text-white">Done</button>
									</div>
								</div>
							) : null}
						</div>
						<button onClick={() => {
							const rows = filteredReports;
							const header = ['issueNumber','title','location','category','resolutionDate'];
							const csv = [header.join(',')].concat(rows.map((r) => [r.issueNumber, `"${(r.title ?? '').replaceAll('"', '""')}"`, `"${(r.location ?? '').replaceAll('"', '""')}"`, `"${(r.category ?? '')}"`, `"${(r.resolutionDate ?? '')}"`].join(','))).join('\n');
							const blob = new Blob([csv], { type: 'text/csv' });
							const url = URL.createObjectURL(blob);
							const a = document.createElement('a');
							a.href = url;
							a.download = 'organization_admin_resolved_tickets.csv';
							a.click();
							URL.revokeObjectURL(url);
						}} className="rounded-full bg-secondary px-3 py-1.5 text-white shadow-sm">Export Report</button>
					</div>
				</div>

				<div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
					<table className="w-full text-left text-sm">
						<thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
							<tr>
								<th className="px-4 py-3">Ticket ID</th>
								<th className="px-4 py-3">Issue Description</th>
								<th className="px-4 py-3">Category</th>
								<th className="px-4 py-3">Resolution Date</th>
								<th className="px-4 py-3">Action</th>
							</tr>
						</thead>
						<tbody>
							{filteredReports.map((ticket) => (
								<tr key={ticket.id} className="border-t border-black/5 text-slate-700">
									<td className="px-4 py-3 font-bold">{ticket.issueNumber}</td>
									<td className="px-4 py-3 font-semibold">{ticket.title}</td>
									<td className="px-4 py-3"><span className="rounded-full bg-secondary/10 px-2 py-1 text-xs text-secondary">{ticket.category}</span></td>
									<td className="px-4 py-3 text-slate-500">{formatDateTime(ticket.resolutionDate)}</td>
									<td className="px-4 py-3"><button onClick={() => setActiveReportId(ticket.id)} className="rounded-full border border-black/5 px-3 py-1 text-xs font-semibold text-slate-700">View Report</button></td>
								</tr>
							))}
							{filteredReports.length === 0 ? <tr><td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>No resolved tickets match your search or filter.</td></tr> : null}
						</tbody>
					</table>
				</div>

				{activeReportId ? (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="resolution-report-title">
						<div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
							<div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 p-5">
								<div>
									<p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500">Resolution Report</p>
									<h3 id="resolution-report-title" className="mt-1 text-2xl font-black text-slate-900">{activeReport?.issueNumber ?? activeReportId}</h3>
								</div>
								<button onClick={() => setActiveReportId('')} className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 hover:bg-slate-100" aria-label="Close report"><X size={16} /></button>
							</div>
							<div className="min-h-0 overflow-y-auto p-5">
								{isLoadingReport ? <div className="flex min-h-48 items-center justify-center"><ThemeLoader size="md" /></div> : activeReport ? (
									<div className="grid gap-3 md:grid-cols-2">
										<div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Issue</p><p className="mt-2 text-lg font-bold text-slate-900">{activeReport.title}</p><p className="mt-1 text-sm text-slate-500">{activeReport.location}</p><p className="mt-3 text-sm text-slate-700">{activeReport.summary}</p></div>
										<div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Resolution</p><p className="mt-2 text-lg font-bold text-slate-900">{formatDateTime(activeReport.resolutionDate)}</p><p className="mt-1 text-sm text-slate-500">Category: {activeReport.category || 'Not recorded'}</p></div>
										{activeReport.internalNotes ? <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 md:col-span-2"><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Organization Admin Notes</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{activeReport.internalNotes}</p></div> : null}
										{activeReport.images?.length ? <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 md:col-span-2"><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Photos</p><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{activeReport.images.map((image) => <img key={image.id} src={image.image_url || image.image} alt={`Issue ${activeReport.issueNumber}`} className="h-28 w-full rounded-xl object-cover" />)}</div></div> : null}
										{activeReport.statusHistory?.length ? <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 md:col-span-2"><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Status Timeline</p><ul className="mt-3 space-y-3">{activeReport.statusHistory.map((entry, index) => <li key={`${entry.changed_at}-${index}`} className="border-l-2 border-secondary/30 pl-3 text-sm text-slate-700"><p className="font-semibold capitalize">{formatStatus(entry.old_status)} → {formatStatus(entry.new_status)}</p><p className="text-xs text-slate-500">{formatDateTime(entry.changed_at)}{entry.changed_by_name ? ` · ${entry.changed_by_name}` : ''}</p>{entry.note ? <p className="mt-1 whitespace-pre-wrap">{entry.note}</p> : null}</li>)}</ul></div> : null}
									</div>
								) : <p className="py-8 text-center text-sm text-red-600">{activeReportError?.message || 'The resolved ticket could not be loaded.'}</p>}
							</div>
						</div>
					</div>
				) : null}
			</div>
		</section>
	);
};

export default OrganizationAdminAnalyticsPage;
