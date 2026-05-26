import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useOrganizationAdminIssues } from '../hooks/useOrganizationAdminIssues';
import { Search, MapPin, ChevronDown, ChevronUp, Image as ImageIcon, Send } from 'lucide-react';
import { type OrganizationAdminTicket } from '../organizationAdminMockData';

const formatStatusLabel = (status?: OrganizationAdminTicket['status']) => {
  if (!status) return 'Unknown';
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const OrganizationAdminAssignedTicketsPage = () => {
  const { user, showToast } = useAuth();
  const seed = user?.email ?? user?.id ?? user?.full_name;
  const { tickets, resolvedTickets, updateStatus, updateInternalNotes } = useOrganizationAdminIssues(seed);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // State for expandable inline details
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const currentAdminId = user?.id ?? '';
  const currentEmail = (user?.email || '').trim().toLowerCase();
  const currentFullName = (user?.full_name || '').trim().toLowerCase();

  const allTickets = tickets.concat(resolvedTickets);

  const assignedTickets = allTickets.filter((t) => {
    if (t.assignedAdminId && currentAdminId) {
      return t.assignedAdminId === currentAdminId;
    }
    const assignedLower = (t.assignedAdminName || '').trim().toLowerCase();
    if (!assignedLower) return false;
    return (
      (currentEmail.length > 0 && assignedLower.includes(currentEmail)) ||
      (currentFullName.length > 0 && assignedLower.includes(currentFullName))
    );
  });

  const visibleTickets = assignedTickets.filter(t => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      (t.issueNumber ?? '').toLowerCase().includes(q) ||
      (t.location ?? '').toLowerCase().includes(q) ||
      (t.summary ?? '').toLowerCase().includes(q)
    );
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setNoteText('');
    } else {
      setExpandedId(id);
      setNoteText('');
    }
  };

  const handleSetStatus = async (ticket: OrganizationAdminTicket, newStatus: OrganizationAdminTicket['status']) => {
    if (ticket.status === newStatus) return;
    try {
      await updateStatus(ticket.id, newStatus);
      showToast(`Status updated to ${formatStatusLabel(newStatus)}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleSendNote = async (ticket: OrganizationAdminTicket) => {
    if (!noteText.trim()) return;
    try {
      const newNote = ticket.internalNotes
        ? `${ticket.internalNotes}\n\n[${new Date().toLocaleString()}] ${noteText.trim()}`
        : `[${new Date().toLocaleString()}] ${noteText.trim()}`;
      await updateInternalNotes(ticket.id, newNote);
      showToast('Note added successfully', 'success');
      setNoteText('');
    } catch (err: any) {
      showToast(err.message || 'Failed to add note', 'error');
    }
  };

  return (
    <section>
      <header className="mb-6">
        <h2 className="text-[32px] font-black leading-tight text-[#3E2B1F]">Assigned Tickets</h2>
        <p className="text-sm font-semibold text-[#857060]">Issues directly assigned to your account.</p>
      </header>

      <div className="mb-6 flex items-center justify-between gap-4 rounded-3xl bg-[#F6F2EC] p-3 shadow-inner">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm border border-[#E7DBCF]">
          <Search size={16} className="text-[#A49484]" />
          <input
            type="text"
            placeholder="Search assigned tickets by ID, address, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-[#4A3628] outline-none placeholder:text-[#B6A696]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-[#DDCFC0] bg-white px-4 py-2.5 text-sm font-semibold text-[#857060] shadow-sm outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="grid gap-4">
        {visibleTickets.length > 0 ? (
          visibleTickets.map(ticket => {
            const isExpanded = expandedId === ticket.id;
            return (
              <div
                key={ticket.id}
                className={`overflow-hidden rounded-3xl border transition-all duration-300 ${
                  isExpanded ? 'border-[#C9A78A] shadow-md' : 'border-[#E7DBCF] bg-white shadow-sm hover:shadow-md hover:border-[#D0BAA7]'
                }`}
              >
                {/* Header (Always visible) */}
                <button
                  type="button"
                  onClick={() => handleToggleExpand(ticket.id)}
                  className="flex w-full text-left items-center gap-4 p-4 bg-white outline-none"
                >
                  <div className={`flex w-16 flex-col items-center justify-center rounded-2xl py-2 text-center shrink-0 transition-colors ${isExpanded ? 'bg-[#EFE8DF]' : 'bg-[#F6F2EC]'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#9D8A78]">Rank</span>
                    <span className="text-xl font-black text-[#6B4C33]">{ticket.priority[0]}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#6B4C33]">{ticket.issueNumber}</span>
                      <span className="rounded-full bg-[#E5D5C5] px-2 py-0.5 text-[10px] font-bold text-[#5A4737]">
                        {ticket.category || 'General'}
                      </span>
                    </div>
                    <h4 className={`mt-1 text-sm font-bold text-[#3E2B1F] leading-snug ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {ticket.summary}
                    </h4>
                    <div className="mt-2 flex items-center justify-between text-xs">
                       <div className="flex items-center text-[#857060] max-w-[60%] truncate">
                          <MapPin size={12} className="mr-1 shrink-0" />
                          <span className="truncate">{ticket.location || 'No location'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="font-bold text-[#4A3628] bg-[#F2EBE2] px-2 py-0.5 rounded-full">{formatStatusLabel(ticket.status)}</span>
                         {isExpanded ? <ChevronUp size={16} className="text-[#857060]" /> : <ChevronDown size={16} className="text-[#857060]" />}
                       </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="border-t border-[#E7DBCF] bg-[#FAF8F5] p-5">
                    <div className="grid md:grid-cols-[1fr_250px] gap-6">
                      {/* Left Col: Actions & Notes */}
                      <div>
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#9D8A78] mb-2">Update Status</h5>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {(['submitted', 'in_progress', 'resolved', 'rejected'] as const).map((status) => (
                            <button
                              type="button"
                              key={status}
                              onClick={() => handleSetStatus(ticket, status)}
                              disabled={ticket.status === status}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                ticket.status === status
                                  ? 'border-[#C9A78A] bg-[#EFE4D6] text-[#6B4C33] cursor-default'
                                  : 'border-[#E0D3C5] bg-white text-[#6D5A48] hover:border-[#C9A78A]'
                              }`}
                            >
                              {formatStatusLabel(status)}
                            </button>
                          ))}
                        </div>

                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#9D8A78] mb-2">Internal Notes</h5>
                        <div className="rounded-xl border border-[#DDCFC0] bg-white p-3 mb-3 max-h-32 overflow-y-auto">
                          {ticket.internalNotes ? (
                            <p className="whitespace-pre-wrap text-xs text-[#5A4737]">{ticket.internalNotes}</p>
                          ) : (
                            <p className="text-xs text-[#A49484] italic">No internal notes yet.</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 rounded-xl border border-[#DDCFC0] bg-white p-1.5 focus-within:border-[#C9A78A] focus-within:ring-1 focus-within:ring-[#C9A78A] transition-all">
                          <input
                            type="text"
                            placeholder="Type a new note..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendNote(ticket)}
                            className="flex-1 bg-transparent px-2 text-sm outline-none text-[#4A3628] placeholder:text-[#B6A696]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendNote(ticket)}
                            disabled={!noteText.trim()}
                            className="shrink-0 rounded-lg bg-[#6A4834] p-2 text-white disabled:opacity-50 hover:bg-[#5A3A29] transition-colors"
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Right Col: Image & Extra Details */}
                      <div className="flex flex-col gap-4">
                        <div className="flex-1 overflow-hidden rounded-xl border border-[#DDCFC0] bg-[#EFE8DF] flex items-center justify-center min-h-[140px]">
                          {ticket.images && ticket.images.length > 0 ? (
                            <img
                              src={ticket.images[0].image}
                              alt="Issue"
                              className="h-full w-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="flex flex-col items-center text-[#A49484]">
                              <ImageIcon size={24} className="mb-2 opacity-50" />
                              <p className="text-[10px] font-semibold uppercase tracking-wider">No Image</p>
                            </div>
                          )}
                        </div>
                        <div className="rounded-xl border border-[#DDCFC0] bg-white p-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9D8A78] mb-1">Reporter</p>
                          <p className="text-sm font-semibold text-[#4A3628]">{ticket.reporter ?? 'Unknown'}</p>
                          <p className="text-xs text-[#857060]">{ticket.timeAgo}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-[#CCBBA8] p-10 text-center text-[#857060]">
            No assigned tickets match your criteria.
          </div>
        )}
      </div>
    </section>
  );
};

export default OrganizationAdminAssignedTicketsPage;
