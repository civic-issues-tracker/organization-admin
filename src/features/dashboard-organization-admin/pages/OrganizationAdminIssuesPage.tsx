import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useOrganizationAdminIssues } from '../hooks/useOrganizationAdminIssues';

const LazyMap = lazy(() => import('../components/OrganizationAdminMap'));

// Fallback center: Addis Ababa city center
const DEFAULT_CENTER: [number, number] = [9.005401, 38.763611];

const toNum = (v: unknown): number =>
  typeof v === 'number' ? v : parseFloat(v as string);

// ── component ──────────────────────────────────────────────────────────────
const OrganizationAdminIssuesPage = () => {
	const { user, showToast } = useAuth();
	const seed = user?.email ?? user?.id ?? user?.full_name;
	const [searchQuery, setSearchQuery] = useState('');
	const { tickets, resolvedTickets, isLoading, error } = useOrganizationAdminIssues(seed);

	const allTickets = tickets.concat(resolvedTickets);

	// Only keep tickets that have usable GPS coords
	const visibleTickets = useMemo(() => {
		return allTickets.filter((t) => {
			const q = searchQuery.trim().toLowerCase();
			const matchesSearch = !q || (
				(t.issueNumber ?? '').toLowerCase().includes(q) ||
				(t.location ?? '').toLowerCase().includes(q) ||
				(t.summary ?? '').toLowerCase().includes(q)
			);
			// Backend DecimalField may arrive as a string — coerce with parseFloat
			const lat = toNum(t.lat);
			const lng = toNum(t.lng);
			const hasValidCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
			return matchesSearch && hasValidCoords;
		});
	}, [allTickets, searchQuery]);

	// Dynamic center: first issue's coords, or fallback
	const mapCenter = useMemo<[number, number]>(() => {
		const first = visibleTickets[0];
		if (first) {
			const lat = toNum(first.lat);
			const lng = toNum(first.lng);
			if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
		}
		return DEFAULT_CENTER;
	}, [visibleTickets]);

	// Build map sites from coerced numbers
	const mapSites = useMemo(() =>
		visibleTickets.map((t) => ({
			ticket: t,
			name: t.location || 'Reported Location',
			lat: toNum(t.lat),
			lng: toNum(t.lng),
		})),
	[visibleTickets]);

	useEffect(() => {
		if (error) showToast(error, 'error');
	}, [error, showToast]);

	if (isLoading && tickets.length === 0) {
		return (
			<section>
				<div className="rounded-2xl border border-[#D8CCBD] bg-[#F6F2EC] p-4 text-sm text-[#857060]">
					Loading map data...
				</div>
			</section>
		);
	}

	return (
		<section>
			<header className="mb-3 flex items-start justify-between">
				<div>
					<h2 className="text-[32px] font-black leading-tight text-[#3E2B1F]">
						{user?.full_name || 'Your Organization'}
					</h2>
					<p className="text-xs font-bold uppercase tracking-wider text-[#8F7B69]">
						Service Area · Issue Map
					</p>
					{visibleTickets.length === 0 && !isLoading && (
						<p className="mt-1 text-xs text-[#B08E6A]">
							No issues with GPS coordinates yet — pins appear once issues include location data.
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-full border border-[#DDCFC0] bg-[#F8F6F2] px-3 py-1.5">
						<Search size={14} className="mr-1 text-[#9D8A78]" />
						<input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search ticket ID or address..."
							className="w-56 bg-transparent text-xs outline-none"
						/>
					</div>
					<button
						type="button"
						onClick={() => setSearchQuery('')}
						className="rounded-full border border-[#DDCFC0] bg-[#F8F6F2] p-2 text-[#8B7B69]"
						aria-label="Clear search"
					>
						<X size={14} />
					</button>
				</div>
			</header>

			<div className="relative min-h-[81vh] overflow-hidden rounded-4xl border border-[#D8CCBD] bg-[#DACEB8]">
				{/* Map layer */}
				<div className="absolute inset-0 z-0">
					<Suspense fallback={<div className="h-full w-full bg-gray-100" />}>
						<LazyMap center={mapCenter} sites={mapSites} />
					</Suspense>
				</div>
				<div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#DACEB8]/20 via-transparent to-[#DACEB8]/10 pointer-events-none" />

				{/* Top-right: legend */}
				<div className="absolute right-4 top-4 z-20 w-48 rounded-3xl border border-white/70 bg-white/95 p-4 shadow-[0_24px_60px_rgba(68,43,24,0.18)] backdrop-blur-md">
					<p className="mb-2 text-[11px] font-bold uppercase text-[#7A6756]">Map Legend</p>
					<ul className="space-y-1 text-xs text-[#4F3A2A]">
						<li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#2563EB]" /> Submitted</li>
						<li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#F59E0B]" /> In Progress</li>
						<li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#16A34A]" /> Resolved</li>
						<li><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#DC2626]" /> Rejected</li>
					</ul>
					<p className="mt-3 border-t border-[#E7DBCF] pt-2 text-[10px] text-[#9D8A78]">
						{mapSites.length} issue{mapSites.length !== 1 ? 's' : ''} with GPS data
					</p>
				</div>
			</div>
		</section>
	);
};

export default OrganizationAdminIssuesPage;
