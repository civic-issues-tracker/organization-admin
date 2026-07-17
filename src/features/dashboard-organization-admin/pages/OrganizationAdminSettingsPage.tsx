import { MoreHorizontal, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';

const OrganizationAdminSettingsPage = () => {
	return (
		<section>
			<header className="mb-3 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-[36px] font-black leading-tight text-slate-900">Organization Admin Settings</h2>
					<p className="text-sm text-slate-500">Manage dispatch preferences, shift defaults, and account controls.</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-full border border-black/5 bg-white px-3 py-1.5 shadow-sm">
						<Search size={14} className="mr-1 text-slate-400" />
						<input placeholder="Search settings..." className="w-56 bg-transparent text-xs outline-none text-slate-700 placeholder:text-slate-400" />
					</div>
					<button type="button" className="rounded-full border border-black/5 bg-white p-2 text-slate-500 shadow-sm" title="More options" aria-label="More options">
						<MoreHorizontal size={14} />
					</button>
				</div>
			</header>

			<div className="grid min-h-[81vh] grid-cols-1 gap-3 rounded-[2rem] border border-black/5 bg-white/75 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm lg:grid-cols-12">
				<div className="space-y-3 lg:col-span-7">
					<div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
						<div className="mb-3 flex items-center gap-2">
							<SlidersHorizontal size={18} className="text-secondary" />
							<h3 className="text-lg font-bold text-slate-900">Dispatch Preferences</h3>
						</div>
						<div className="space-y-3 text-sm text-slate-700">
							<label className="flex items-center justify-between rounded-xl border border-black/5 bg-slate-50 px-3 py-2">
								<span>Auto-assign nearest unit for High priority issues</span>
								<input type="checkbox" defaultChecked className="h-4 w-4 accent-secondary" />
							</label>
							<label className="flex items-center justify-between rounded-xl border border-black/5 bg-slate-50 px-3 py-2">
								<span>Enable district-level SMS escalation</span>
								<input type="checkbox" defaultChecked className="h-4 w-4 accent-secondary" />
							</label>
							<label className="flex items-center justify-between rounded-xl border border-black/5 bg-slate-50 px-3 py-2">
								<span>Show unresolved-only queue by default</span>
								<input type="checkbox" className="h-4 w-4 accent-secondary" />
							</label>
						</div>
					</div>

					<div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
						<h3 className="text-lg font-bold text-slate-900">Shift Defaults</h3>
						<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
							<label className="text-sm text-slate-600">
								<span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Default Patrol Zone</span>
								<select className="w-full rounded-xl border border-black/5 bg-slate-50 px-3 py-2 outline-none">
									<option>Bole - Central</option>
									<option>Bole - East</option>
									<option>Bole - Airport Corridor</option>
								</select>
							</label>
							<label className="text-sm text-slate-600">
								<span className="mb-1 block text-xs uppercase tracking-wider text-slate-400">Fallback Response ETA</span>
								<select className="w-full rounded-xl border border-black/5 bg-slate-50 px-3 py-2 outline-none">
									<option>15 minutes</option>
									<option>30 minutes</option>
									<option>45 minutes</option>
								</select>
							</label>
						</div>
					</div>
				</div>

				<div className="space-y-3 lg:col-span-5">
					<div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
						<div className="mb-2 flex items-center gap-2">
							<ShieldCheck size={18} className="text-secondary" />
							<h3 className="text-lg font-bold text-slate-900">Security</h3>
						</div>
						<button className="mt-2 w-full rounded-xl border border-black/5 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
							Change password
						</button>
						<button className="mt-2 w-full rounded-xl border border-black/5 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
							Enable 2-step verification
						</button>
					</div>

					<div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
						<h3 className="text-lg font-bold text-slate-900">Save Changes</h3>
						<p className="mt-1 text-sm text-slate-500">Update your operational defaults and alert routing preferences.</p>
						<div className="mt-3 flex gap-2">
							<button className="rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">Reset</button>
							<button className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm">Save Settings</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default OrganizationAdminSettingsPage;