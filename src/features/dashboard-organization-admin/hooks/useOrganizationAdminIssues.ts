import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationAdminIssueApi } from '../services/organizationAdminIssueService';
import {
  toOrganizationAdminTicket,
  type OrganizationAdminIssue,
  type OrganizationAdminTicket,
  type IssuePriority,
  type IssueStatus,
} from '../organizationAdminMockData';

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
  updatePriority: (ticketId: string, priority: IssuePriority) => Promise<void>;
}

const isResolvedStatus = (status: OrganizationAdminTicket['status']) => status === 'resolved';

const splitResolved = (tickets: OrganizationAdminTicket[]) => {
  const resolved = tickets.filter((ticket) => isResolvedStatus(ticket.status));
  const active = tickets.filter((ticket) => !isResolvedStatus(ticket.status));
  return { active, resolved };
};

export const useOrganizationAdminIssues = (accountId?: string): UseOrganizationAdminIssuesResult => {
  const queryClient = useQueryClient();
  const queryKey = ['orgAdminIssues', accountId ?? 'unauthenticated'] as const;

  const { data: allTickets = [], isLoading, error, refetch } = useQuery<OrganizationAdminTicket[], Error>({
    queryKey,
    enabled: Boolean(accountId),
    queryFn: async () => {
      const issues = await organizationAdminIssueApi.getAll();
      return issues.map((issue: OrganizationAdminIssue) => toOrganizationAdminTicket(issue));
    },
  });

  const { active, resolved } = splitResolved(allTickets);

  const statusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: IssueStatus }) => {
      return await organizationAdminIssueApi.updateStatus(ticketId, status);
    },
    onSuccess: (updated, variables) => {
      const hasFullPayload = Boolean(updated && 'issue_number' in updated);
      const updatedTicket = hasFullPayload
        ? toOrganizationAdminTicket(updated as OrganizationAdminIssue)
        : null;

      queryClient.setQueryData<OrganizationAdminTicket[]>(queryKey, (old) => {
        if (!old) return [];
        if (updatedTicket) {
          const exists = old.some((t) => t.id === variables.ticketId);
          if (exists) {
            return old.map((t) => (t.id === variables.ticketId ? updatedTicket : t));
          }
          return [updatedTicket, ...old];
        }
        return old.map((t) => (t.id === variables.ticketId ? { ...t, status: variables.status } : t));
      });
    },
  });

  const notesMutation = useMutation({
    mutationFn: async ({ ticketId, notes }: { ticketId: string; notes: string }) => {
      return await organizationAdminIssueApi.updateInternalNotes(ticketId, notes);
    },
    onSuccess: (updated, variables) => {
      const hasFullPayload = Boolean(updated && 'issue_number' in updated);
      const updatedTicket = hasFullPayload
        ? toOrganizationAdminTicket(updated as OrganizationAdminIssue)
        : null;

      queryClient.setQueryData<OrganizationAdminTicket[]>(queryKey, (old) => {
        if (!old) return [];
        if (updatedTicket) {
          return old.map((t) => (t.id === variables.ticketId ? updatedTicket : t));
        }
        return old.map((t) => (t.id === variables.ticketId ? { ...t, internalNotes: variables.notes } : t));
      });
    },
  });

  const priorityMutation = useMutation({
    mutationFn: async ({ ticketId, priority }: { ticketId: string; priority: IssuePriority }) => {
      return await organizationAdminIssueApi.updatePriority(ticketId, priority);
    },
    onSuccess: (updated, variables) => {
      const hasFullPayload = Boolean(updated && 'issue_number' in updated);
      const updatedTicket = hasFullPayload
        ? toOrganizationAdminTicket(updated as OrganizationAdminIssue)
        : null;

      queryClient.setQueryData<OrganizationAdminTicket[]>(queryKey, (old) => {
        if (!old) return [];
        if (updatedTicket) {
          return old.map((t) => (t.id === variables.ticketId ? updatedTicket : t));
        }
        return old.map((t) => (t.id === variables.ticketId ? { ...t, priority: variables.priority } : t));
      });
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async ({ ticketId, note }: { ticketId: string; note?: string }) => {
      return await organizationAdminIssueApi.release(ticketId, note);
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData<OrganizationAdminTicket[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map((t) =>
          t.id === variables.ticketId
            ? { ...t, status: 'submitted', assignedAdminName: undefined }
            : t
        );
      });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async ({ ticketId, reason }: { ticketId: string; reason: string }) => {
      return await organizationAdminIssueApi.escalate(ticketId, reason);
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData<OrganizationAdminTicket[]>(queryKey, (old) => {
        if (!old) return [];
        return old.map((t) =>
          t.id === variables.ticketId
            ? { ...t, status: 'escalated', assignedAdminName: undefined }
            : t
        );
      });
    },
  });

  const assignUnit = (ticketId: string, unit: string) => {
    queryClient.setQueryData<OrganizationAdminTicket[]>(queryKey, (old) => {
      if (!old) return [];
      return old.map((t) => (t.id === ticketId ? { ...t, assignedUnit: unit } : t));
    });
  };

  return {
    tickets: active,
    resolvedTickets: resolved,
    isLoading,
    error: error ? error.message : null,
    refresh: () => refetch(),
    updateStatus: async (ticketId, status) => { await statusMutation.mutateAsync({ ticketId, status }); },
    updateInternalNotes: async (ticketId, notes) => { await notesMutation.mutateAsync({ ticketId, notes }); },
    releaseIssue: async (ticketId, note) => { await releaseMutation.mutateAsync({ ticketId, note }); },
    escalateIssue: async (ticketId, reason) => { await escalateMutation.mutateAsync({ ticketId, reason }); },
    assignUnit,
    updatePriority: async (ticketId, priority) => { await priorityMutation.mutateAsync({ ticketId, priority }); },
  };
};
