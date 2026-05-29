import { useCallback, useEffect, useState } from 'react';
import { organizationAdminIssueApi } from '../services/organizationAdminIssueService';
import {
  toOrganizationAdminTicket,
  type OrganizationAdminIssue,
  type OrganizationAdminTicket,
  type IssueStatus,
} from '../organizationAdminMockData';

let cachedTickets: OrganizationAdminTicket[] = [];
let cachedResolvedTickets: OrganizationAdminTicket[] = [];
let hasCachedIssues = false;

interface UseOrganizationAdminIssuesResult {
  tickets: OrganizationAdminTicket[];
  resolvedTickets: OrganizationAdminTicket[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  updateStatus: (ticketId: string, status: IssueStatus) => Promise<void>;
  updateInternalNotes: (ticketId: string, notes: string) => Promise<void>;
  assignUnit: (ticketId: string, unit: string) => void;
  releaseIssue: (ticketId: string, note?: string) => Promise<void>;
  escalateIssue: (ticketId: string, reason: string) => Promise<void>;
}

const isResolvedStatus = (status: OrganizationAdminTicket['status']) => status === 'resolved';

const splitResolved = (tickets: OrganizationAdminTicket[]) => {
  const resolved = tickets.filter((ticket) => isResolvedStatus(ticket.status));
  const active = tickets.filter((ticket) => !isResolvedStatus(ticket.status));
  return { active, resolved };
};

export const useOrganizationAdminIssues = (_seedValue?: string | null): UseOrganizationAdminIssuesResult => {
  const [tickets, setTickets] = useState<OrganizationAdminTicket[]>(cachedTickets);
  const [resolvedTickets, setResolvedTickets] = useState<OrganizationAdminTicket[]>(cachedResolvedTickets);
  const [isLoading, setIsLoading] = useState(!hasCachedIssues);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadIssues = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const issues = await organizationAdminIssueApi.getAll();
        if (!isActive) return;

        const mapped = issues.map((issue: OrganizationAdminIssue) => toOrganizationAdminTicket(issue));
        const { active, resolved } = splitResolved(mapped);
        setTickets(active);
        setResolvedTickets(resolved);
        cachedTickets = active;
        cachedResolvedTickets = resolved;
        hasCachedIssues = true;
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Failed to load issues from the server.');
        setTickets([]);
        setResolvedTickets([]);
        cachedTickets = [];
        cachedResolvedTickets = [];
        hasCachedIssues = false;
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadIssues();
    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  const updateStatus = useCallback(
    async (ticketId: string, status: IssueStatus) => {
      try {
        const updated = await organizationAdminIssueApi.updateStatus(ticketId, status);
        const hasFullPayload = Boolean(updated && 'issue_number' in updated);
        const updatedTicket = hasFullPayload
          ? toOrganizationAdminTicket(updated as OrganizationAdminIssue)
          : null;

        if (updatedTicket && isResolvedStatus(updatedTicket.status)) {
          // Moving TO resolved: remove from active, add to resolved
          setTickets((prev) => prev.filter((t) => t.id !== ticketId));
          setResolvedTickets((prev) => {
            const next = [updatedTicket, ...prev.filter((t) => t.id !== ticketId)];
            cachedTickets = cachedTickets.filter((t) => t.id !== ticketId);
            cachedResolvedTickets = next;
            return next;
          });
        } else if (updatedTicket) {
          // Moving AWAY from resolved (or between active statuses):
          // remove from resolved list and ensure it exists in active list
          setResolvedTickets((prev) => {
            const nextResolved = prev.filter((t) => t.id !== ticketId);
            cachedResolvedTickets = nextResolved;
            return nextResolved;
          });
          setTickets((prev) => {
            const exists = prev.some((t) => t.id === ticketId);
            if (exists) {
              const next = prev.map((t) => (t.id === ticketId ? updatedTicket : t));
              cachedTickets = next;
              return next;
            }
            // Ticket was in resolvedTickets — bring it back to active
            const next = [updatedTicket, ...prev];
            cachedTickets = next;
            return next;
          });
        } else {
          setResolvedTickets((prev) => {
            const nextResolved = prev.filter((t) => t.id !== ticketId);
            cachedResolvedTickets = nextResolved;
            return nextResolved;
          });
          setTickets((prev) => {
            const next = prev.map((t) => (t.id === ticketId ? { ...t, status } : t));
            cachedTickets = next;
            return next;
          });
        }
      } catch {
        throw new Error('Failed to update status.');
      }
    },
    [],
  );

  const assignUnit = useCallback((ticketId: string, unit: string) => {
    setTickets((prev) => {
      const next = prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, assignedUnit: unit } : ticket));
      cachedTickets = next;
      return next;
    });
  }, []);

  const updateInternalNotes = useCallback(
    async (ticketId: string, notes: string) => {
      try {
        const updated = await organizationAdminIssueApi.updateInternalNotes(ticketId, notes);
        const hasFullPayload = Boolean(updated && 'issue_number' in updated);
        const updatedTicket = hasFullPayload
          ? toOrganizationAdminTicket(updated as OrganizationAdminIssue)
          : null;
        if (updatedTicket) {
          setTickets((prev) => {
            const next = prev.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket));
            cachedTickets = next;
            return next;
          });
          setResolvedTickets((prev) => {
            const next = prev.map((ticket) => (ticket.id === ticketId ? updatedTicket : ticket));
            cachedResolvedTickets = next;
            return next;
          });
        } else {
          setTickets((prev) => {
            const next = prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, internalNotes: notes } : ticket));
            cachedTickets = next;
            return next;
          });
          setResolvedTickets((prev) => {
            const next = prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, internalNotes: notes } : ticket));
            cachedResolvedTickets = next;
            return next;
          });
        }
      } catch (err) {
        console.error('Failed to update internal notes', err);
        throw err;
      }
    },
    []
  );

  const releaseIssue = useCallback(
    async (ticketId: string, note?: string) => {
      await organizationAdminIssueApi.release(ticketId, note);
      setTickets((prev) => {
        const next: OrganizationAdminTicket[] = prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: 'submitted', assignedAdminName: undefined }
            : ticket
        );
        cachedTickets = next;
        return next;
      });
      setResolvedTickets((prev) => {
        const next = prev.filter((ticket) => ticket.id !== ticketId);
        cachedResolvedTickets = next;
        return next;
      });
    },
    []
  );

  const escalateIssue = useCallback(
    async (ticketId: string, reason: string) => {
      await organizationAdminIssueApi.escalate(ticketId, reason);
      setTickets((prev) => {
        const next: OrganizationAdminTicket[] = prev.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: 'escalated', assignedAdminName: undefined }
            : ticket
        );
        cachedTickets = next;
        return next;
      });
      setResolvedTickets((prev) => {
        const next = prev.filter((ticket) => ticket.id !== ticketId);
        cachedResolvedTickets = next;
        return next;
      });
    },
    []
  );

  return {
    tickets,
    resolvedTickets,
    isLoading,
    error,
    refresh,
    updateStatus,
    updateInternalNotes,
    releaseIssue,
    escalateIssue,
    assignUnit,
  };
};
