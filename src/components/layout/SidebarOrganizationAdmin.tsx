import { NavLink } from 'react-router-dom';
import {
  CheckSquare,
  ClipboardList,
  Map,
  X
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
  queueCount?: number;
}

const SidebarOrganizationAdmin = ({ onClose, queueCount }: SidebarProps) => {
  const navItems = [
    { label: 'My Queue', to: '/dashboard/queue', icon: ClipboardList, badge: queueCount },
    { label: 'Assigned Tickets', to: '/dashboard/assigned', icon: ClipboardList },
    { label: 'Service Area', to: '/dashboard/map', icon: Map },
    { label: 'Resolved Tickets', to: '/dashboard/resolved', icon: CheckSquare },
  ];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-y-auto rounded-r-4xl md:rounded-r-[4rem] bg-[#6E4B33] py-8 text-[#F6EEE3] shadow-xl">
      <div className="mb-8 px-8 border-b border-white/10 pb-4 flex justify-between items-start">
        <div>
          <h1 className="whitespace-nowrap text-[28px] font-extrabold leading-none tracking-tight">CivicWorks</h1>
          <p className="text-xs text-[#E9D6C0] mt-1">Admin Portal</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-white/70 hover:text-white bg-white/10 rounded-full" title="Close sidebar" aria-label="Close sidebar">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-r-4xl rounded-l-none px-6 py-4 text-sm transition ${
                  isActive ? 'bg-white/10 border-l-4 border-white text-white font-bold' : 'opacity-70 hover:opacity-100 hover:bg-white/5 border-l-4 border-transparent'
                }`
              }
            >
              <span className="flex items-center gap-2">
                <Icon size={14} />
                {item.label}
              </span>
              {typeof item.badge === 'number' && item.badge > 0 ? (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EE3E4A] px-1 text-[10px] font-bold">
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

    </aside>
  );
};

export default SidebarOrganizationAdmin;
