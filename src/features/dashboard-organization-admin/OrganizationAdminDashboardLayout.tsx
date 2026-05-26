import { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Building2 } from 'lucide-react';
import SidebarOrganizationAdmin from '../../components/layout/SidebarOrganizationAdmin';
import { useAuth } from '../../hooks/useAuth';

const OrganizationAdminDashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Backend role_name is 'organization_admin'; for org admin users, full_name is the org name
  const currentOrgName = user?.full_name || 'Your Organization';

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
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
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
        <header className="hidden md:flex items-center justify-center px-6 py-4 z-30 shrink-0 bg-transparent">
          <div className="inline-flex items-center gap-4 rounded-full border border-[#E0D3C4] bg-white px-6 py-3 shadow-sm" style={{ maxWidth: '75%' }}>
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#6E4B33]/10 text-[#6E4B33]">
              <Building2 size={20} />
            </div>
            <div className="min-w-0 text-left">
              <h1 className="text-base font-black leading-tight text-[#3E2B1F] truncate">{currentOrgName}</h1>
              <p className="text-[11px] font-bold text-[#9A8070] mt-0.5 truncate uppercase tracking-wider">{pageName}</p>
            </div>
          </div>
        </header>

        {/* Mobile Header — hamburger left, org pill centered */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 z-30 shrink-0 bg-transparent">
          <button
            onClick={() => setSidebarOpen(true)}
            className="shrink-0 p-1.5 text-[#6E4B33] hover:bg-white/50 rounded-lg transition"
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
          {/* Spacer to keep pill centered */}
          <div className="shrink-0 w-8" />
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
