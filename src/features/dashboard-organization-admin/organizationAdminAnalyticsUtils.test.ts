import { describe, expect, it } from 'vitest';
import { buildResolvedKpis, filterResolvedReports } from './organizationAdminAnalyticsUtils';

describe('organization admin analytics helpers', () => {
  const tickets = [
    {
      id: '1',
      issueNumber: 'CIV-1001',
      title: 'Water main break',
      summary: 'Main line burst near Central Avenue',
      location: 'Central Avenue',
      category: 'Water Services',
      resolutionDate: '2026-01-03T12:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      priority: 'High' as const,
      status: 'resolved' as const,
      assignedAdminName: 'Jane Admin',
    },
    {
      id: '2',
      issueNumber: 'CIV-1002',
      title: 'Streetlight repaired',
      summary: 'Lamp fixed on Main Road',
      location: 'Main Road',
      category: 'Lighting',
      resolutionDate: '2026-01-05T12:00:00Z',
      createdAt: '2026-01-02T00:00:00Z',
      priority: 'Low' as const,
      status: 'resolved' as const,
      assignedAdminName: 'Jane Admin',
    },
  ];

  it('builds concise KPI cards for resolved tickets', () => {
    const kpis = buildResolvedKpis(tickets, [
      { priority: 'High' as const },
    ]);

    expect(kpis).toEqual([
      { label: 'Total Resolved', value: '2' },
      { label: 'Avg Resolve Time', value: '3.0d' },
      { label: 'Active Issues', value: '1' },
      { label: 'High Priority (Active)', value: '1' },
    ]);
  });

  it('filters reports by search text and category', () => {
    const results = filterResolvedReports(tickets, 'water', 'water');

    expect(results).toHaveLength(1);
    expect(results[0].issueNumber).toBe('CIV-1001');
  });
});
