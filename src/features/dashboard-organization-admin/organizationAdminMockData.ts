export type IssuePriority = 'High' | 'Medium' | 'Low';
export type IssueStatus =
  | 'submitted'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'pending_admin'
  | 'escalated';

export interface OrganizationAdminIssue {
  id: string;
  issue_number: string;
  title: string;
  description: string;
  category_name?: string;
  subcategory_name?: string;
  resident_name?: string;
  resident_phone?: string;
  priority: IssuePriority;
  status: IssueStatus;
  assigned_to_org_admin?: string | null;
  assigned_admin_name?: string | null;
  reopen_reason?: string | null;
  location_address: string;
  location_lat?: number | null;
  location_long?: number | null;
  created_at: string;
  // list API returns a single Cloudinary URL; detail API returns the full images[]
  image_url?: string | null;
  images?: { id: string; image: string; created_at: string }[];
  internal_notes?: string;
  status_history?: { old: string; new: string; date: string; note?: string }[];
}

export interface OrganizationAdminTicket {
  id: string;
  issueNumber: string;
  title: string;
  location: string;
  priority: IssuePriority;
  status: IssueStatus;
  assignedAdminId?: string;
  assignedAdminName?: string;
  reopenReason?: string;
  assignedUnit?: string;
  summary?: string;
  timeAgo?: string;
  reporter?: string;
  reporterPhone?: string;
  category?: string;
  resolutionDate?: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
  internalNotes?: string;
  images?: { id: string; image: string; created_at: string }[];
}

export interface OrganizationAdminMessage {
  id: string;
  from: 'dispatch' | 'organization_admin';
  text: string;
  at: string;
}

export interface OrganizationAdminConversation {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  active?: boolean;
  online?: boolean;
  messages: OrganizationAdminMessage[];
}

const buildTimeAgo = (isoDate?: string) => {
  if (!isoDate) return undefined;
  const ms = Date.now() - new Date(isoDate).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 'just now';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const toOrganizationAdminTicket = (issue: OrganizationAdminIssue): OrganizationAdminTicket => ({
  id: issue.id,
  issueNumber: issue.issue_number,
  title: issue.title,
  location: issue.location_address,
  priority: issue.priority,
  status: issue.status,
  assignedAdminId: issue.assigned_to_org_admin ?? undefined,
  assignedAdminName: issue.assigned_admin_name ?? undefined,
  reopenReason: issue.reopen_reason ?? undefined,
  summary: issue.description,
  reporter: issue.resident_name,
  reporterPhone: issue.resident_phone,
  category: issue.category_name,
  timeAgo: buildTimeAgo(issue.created_at),
  createdAt: issue.created_at,
  lat: issue.location_lat ?? undefined,
  lng: issue.location_long ?? undefined,
  internalNotes: issue.internal_notes,
  // Prefer the images[] array (from detail API); fall back to the single image_url from list API
  images: issue.images ?? (
    issue.image_url
      ? [{ id: 'cover', image: issue.image_url, created_at: issue.created_at }]
      : undefined
  ),
});

