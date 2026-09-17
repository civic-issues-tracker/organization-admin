import type { OrganizationAdminTicket } from './organizationAdminMockData';

export const buildResolvedKpis = (
  myResolvedTickets: OrganizationAdminTicket[],
  myTickets: Pick<OrganizationAdminTicket, 'priority'>[],
) => {
  const highPriority = myTickets.filter((t) => t.priority === 'High').length;

  let totalResolveTimeMs = 0;
  let ticketsWithTime = 0;

  myResolvedTickets.forEach((ticket) => {
    if (ticket.createdAt && ticket.resolutionDate) {
      const start = new Date(ticket.createdAt).getTime();
      const end = new Date(ticket.resolutionDate).getTime();
      if (end > start) {
        totalResolveTimeMs += end - start;
        ticketsWithTime += 1;
      }
    }
  });

  const avgTimeDays = ticketsWithTime > 0
    ? `${(totalResolveTimeMs / ticketsWithTime / (1000 * 60 * 60 * 24)).toFixed(1)}d`
    : '0.0d';

  return [
    { label: 'Total Resolved', value: myResolvedTickets.length.toString() },
    { label: 'Avg Resolve Time', value: avgTimeDays },
    { label: 'Active Issues', value: myTickets.length.toString() },
    { label: 'High Priority (Active)', value: highPriority.toString() },
  ];
};

export const filterResolvedReports = (
  tickets: OrganizationAdminTicket[],
  searchQuery: string,
  reportFilter: string,
) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const normalizedFilter = reportFilter.trim().toLowerCase();

  return tickets.filter((ticket) => {
    const textTargets = [
      ticket.issueNumber,
      ticket.title ?? '',
      ticket.summary ?? '',
      ticket.location,
      ticket.category ?? '',
      ticket.resolutionDate ?? '',
    ].join(' ').toLowerCase();

    const matchesQuery = !normalizedQuery || textTargets.includes(normalizedQuery);
    const matchesFilter = !normalizedFilter || [
      ticket.category ?? '',
      ticket.location,
      ticket.issueNumber,
    ].some((value) => value.toLowerCase().includes(normalizedFilter));

    return matchesQuery && matchesFilter;
  });
};
