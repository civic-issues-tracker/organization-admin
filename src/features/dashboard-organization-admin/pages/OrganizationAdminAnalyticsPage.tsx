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

const OrganizationAdminAnalyticsPage = () => {
	const { user } = useAuth();
	const accountId = user?.id ?? user?.email;
	const { tickets, resolvedTickets, isLoading } = useOrganizationAdminIssues(accountId);
	const [activeReportId, setActiveReportId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [reportFilter, setReportFilter] = useState('');
	const [showFilterInput, setShowFilterInput] = useState(false);
	const { data: activeReport } = useQuery({
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

	const activeReportEntry = useMemo(
		() => filteredReports.find((ticket) => ticket.id === activeReportId) ?? null,
		[activeReportId, filteredReports],
	);
	const selectedResolvedTicket = activeReport ?? activeReportEntry;

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

				<div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
					<div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
						<div className="flex items-center justify-between border-b border-black/5 bg-slate-50 px-4 py-3">
							<p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Resolved cases</p>
							<span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">{filteredReports.length} total</span>
						</div>
						<div className="divide-y divide-black/5">
							{filteredReports.map((ticket) => {
								const isSelected = activeReportId === ticket.id;
								return (
									<button
										type="button"
										key={ticket.id}
										onClick={() => setActiveReportId(ticket.id)}
										className={`flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/80'}`}
									>
										<div className="min-w-0 flex-1">
											<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{ticket.issueNumber}</p>
											<h4 className="mt-1 text-base font-bold text-slate-900">{ticket.title}</h4>
											<p className="mt-1 line-clamp-2 text-sm text-slate-600">{ticket.summary || ticket.location}</p>
										</div>
										<div className="shrink-0 text-right">
											<span className="inline-flex rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-semibold text-secondary">{ticket.category || 'Uncategorized'}</span>
											<p className="mt-2 text-[11px] font-medium text-slate-500">{formatDateTime(ticket.resolutionDate)}</p>
										</div>
									</button>
								);
							})}
							{filteredReports.length === 0 ? (
								<div className="px-4 py-8 text-sm text-slate-500">No resolved tickets match your search or filter.</div>
							) : null}
						</div>
					</div>

					<div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
						{selectedResolvedTicket ? (
							<>
								<div className="mb-4 flex items-start justify-between gap-3">
									<div>
										<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Resolution report</p>
										<h3 className="mt-1 text-2xl font-black text-slate-900">{selectedResolvedTicket.issueNumber}</h3>
									</div>
									<button onClick={() => setActiveReportId('')} className="rounded-full border border-slate-200 p-2 text-slate-500" aria-label="Close report">
										<X size={14} />
									</button>
								</div>
								<div className="space-y-4">
									<div>
										<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Issue</p>
										<h4 className="mt-1 text-lg font-bold text-slate-900">{selectedResolvedTicket.title}</h4>
										<p className="mt-1 text-sm text-slate-600">{selectedResolvedTicket.location}</p>
									</div>
									<div className="rounded-2xl border border-black/5 bg-slate-50 p-3">
										<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Summary</p>
										<p className="mt-2 text-sm text-slate-700">{selectedResolvedTicket.summary || 'No summary was recorded for this ticket.'}</p>
									</div>
									<div className="grid grid-cols-2 gap-2 text-sm">
										<div className="rounded-xl border border-black/5 bg-slate-50 p-3">
											<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Resolved</p>
											<p className="mt-1 font-semibold text-slate-900">{formatDateTime(selectedResolvedTicket.resolutionDate)}</p>
										</div>
										<div className="rounded-xl border border-black/5 bg-slate-50 p-3">
											<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Category</p>
											<p className="mt-1 font-semibold text-slate-900">{selectedResolvedTicket.category || 'Not recorded'}</p>
										</div>
									</div>
									{selectedResolvedTicket.internalNotes ? (
										<div className="rounded-2xl border border-black/5 bg-slate-50 p-3">
											<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Admin notes</p>
											<p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{selectedResolvedTicket.internalNotes}</p>
										</div>
									) : null}
								</div>
							</>
						) : (
							<div className="flex min-h-[240px] items-center justify-center text-sm text-slate-500">
								Select a resolved ticket to view its report.
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};

export default OrganizationAdminAnalyticsPage;
