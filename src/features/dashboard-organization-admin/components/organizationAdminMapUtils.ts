import L from 'leaflet';
import type { OrganizationAdminTicket } from '../organizationAdminMockData';

const createPin = (color: string) =>
  L.divIcon({
    className: 'organization-admin-map-pin',
    html: `
      <div style="display:flex;align-items:center;justify-content:center;">
        <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 1C7.373 1 2 6.373 2 13C2 22.5 14 39 14 39C14 39 26 22.5 26 13C26 6.373 20.627 1 14 1Z" fill="${color}" stroke="white" stroke-width="2" />
          <circle cx="14" cy="13" r="5" fill="white" />
        </svg>
      </div>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 38],
    popupAnchor: [0, -36],
  });

export const iconCache = new Map<string, L.DivIcon>();

export const getPinIcon = (color: string) => {
  if (!iconCache.has(color)) {
    iconCache.set(color, createPin(color));
  }
  return iconCache.get(color)!;
};

export const statusLabels: Record<OrganizationAdminTicket['status'], string> = {
  submitted: 'Submitted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
  pending_admin: 'Pending Admin',
  escalated: 'Escalated',
};

export const formatStatusLabel = (status?: OrganizationAdminTicket['status']) => {
  if (!status) return 'Submitted';
  return statusLabels[status] ?? 'Submitted';
};

export const getStatusTone = (status: OrganizationAdminTicket['status']) => {
  if (status === 'resolved') return '#16A34A';
  if (status === 'in_progress') return '#F59E0B';
  if (status === 'rejected') return '#DC2626';
  return '#2563EB';
};
