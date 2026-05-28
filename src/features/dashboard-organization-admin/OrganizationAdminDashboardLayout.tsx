import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Building2, LogOut } from 'lucide-react';
import SidebarOrganizationAdmin from '../../components/layout/SidebarOrganizationAdmin';
import { useAuth } from '../../hooks/useAuth';

const OrganizationAdminDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const desktopProfileRef = useRef<HTMLDivElement | null>(null);
  const mobileProfileRef = useRef<HTMLDivElement | null>(null);

  // Backend role_name is 'organization_admin'; for org admin users, full_name is the org name
  const currentOrgName = user?.organization_name ?? user?.full_name ?? 'Your Organization';
  const currentOrgEmail = user?.email ?? 'No email';
  const orgInitials = currentOrgName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const isInsideDesktop = desktopProfileRef.current?.contains(target) ?? false;
      const isInsideMobile = mobileProfileRef.current?.contains(target) ?? false;
      if (!isInsideDesktop && !isInsideMobile) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const pageName = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/queue')) return 'My Queue';
    if (path.includes('/map')) return 'Service Area';
    if (path.includes('/resolved')) return 'Performance & Analytics';
    if (path.includes('/alerts')) return 'Alerts';
    if (path.includes('/assigned')) return 'Assigned Tickets';
    return 'Organization Dashboard';
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F6F2EA]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button 
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarOrganizationAdmin onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Header — centered, self-expanding rounded pill */}
        <header className="hidden md:grid grid-cols-[1fr_auto_auto] items-center px-6 py-4 z-30 shrink-0 bg-transparent">
          <div />
          <div className="inline-flex max-w-[75%] translate-x-6 items-center gap-4 rounded-full border border-[#E0D3C4] bg-white px-6 py-3 shadow-sm">
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#6E4B33]/10 text-[#6E4B33]">
              <Building2 size={20} />
            </div>
            <div className="min-w-0 text-left">
              <h1 className="text-base font-black leading-tight text-[#3E2B1F] truncate">{currentOrgName}</h1>
              <p className="text-[11px] font-bold text-[#9A8070] mt-0.5 truncate uppercase tracking-wider">{pageName}</p>
            </div>
          </div>
          <div ref={desktopProfileRef} className="relative justify-self-end">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-[#E0D3C4] bg-white px-3 py-2 shadow-sm transition hover:border-[#C9A78A]"
              title="Open organization profile menu"
              aria-label="Open organization profile menu"
              aria-haspopup="menu"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7D5A42] text-sm font-bold text-[#F8EFE4]">
                {orgInitials}
              </span>
              <ChevronDown size={16} className="text-[#8B7767]" />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-3xl border border-[#E0D3C4] bg-white shadow-2xl">
                <div className="p-4">
                  <p className="text-lg font-black leading-tight text-[#3E2B1F]">{currentOrgName}</p>
                  <p className="mt-1 text-sm text-[#8A7767] break-all">{currentOrgEmail}</p>
                  <span className="mt-3 inline-block rounded bg-[#8B674E] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F8EFE4]">
                    Organization Admin
                  </span>
                </div>
                <div className="border-t border-[#EAE0D3]" />
                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false);
                    await logout();
                  }}
                  title="Logout"
                  className="flex w-full items-center gap-2 bg-[#6E4B33] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5A3A29]"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {/* Mobile Header — hamburger left, org pill centered */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 z-30 shrink-0 bg-transparent">
          <button
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 p-1.5 text-[#6E4B33] hover:bg-white/50 rounded-lg transition"
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <div className="inline-flex items-center gap-3 rounded-full border border-[#E0D3C4] bg-white px-4 py-2 mx-2 min-w-0 flex-1 shadow-sm">
            <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#6E4B33]/10 text-[#6E4B33]">
              <Building2 size={16} />
            </div>
            <div className="min-w-0 text-left flex-1">
              <p className="text-sm font-bold text-[#3E2B1F] leading-tight truncate">{currentOrgName}</p>
              <p className="text-[10px] font-bold text-[#9A8070] mt-0.5 truncate uppercase tracking-wider">{pageName}</p>
            </div>
          </div>
          <div ref={mobileProfileRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E0D3C4] bg-white shadow-sm"
              title="Open organization profile menu"
              aria-label="Open organization profile menu"
              aria-haspopup="menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7D5A42] text-xs font-bold text-[#F8EFE4]">
                {orgInitials}
              </span>
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-3xl border border-[#E0D3C4] bg-white shadow-2xl">
                <div className="p-4">
                  <p className="text-lg font-black leading-tight text-[#3E2B1F]">{currentOrgName}</p>
                  <p className="mt-1 text-sm text-[#8A7767] break-all">{currentOrgEmail}</p>
                  <span className="mt-3 inline-block rounded bg-[#8B674E] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#F8EFE4]">
                    Organization Admin
                  </span>
                </div>
                <div className="border-t border-[#EAE0D3]" />
                <button
                  type="button"
                  onClick={async () => {
                    setProfileOpen(false);
                    await logout();
                  }}
                  title="Logout"
                  className="flex w-full items-center gap-2 bg-[#6E4B33] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5A3A29]"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </header>


        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OrganizationAdminDashboardLayout;
