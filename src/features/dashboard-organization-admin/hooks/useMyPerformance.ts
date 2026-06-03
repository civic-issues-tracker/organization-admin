import { useCallback, useEffect, useState } from 'react';
import {
  organizationAdminIssueApi,
  type MyPerformanceResponse,
  type WeeklyPerformanceDay,
  type PerformanceKPIs,
} from '../services/organizationAdminIssueService';

interface UseMyPerformanceResult {
  weeklyPerformance: WeeklyPerformanceDay[];
  kpis: PerformanceKPIs | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const defaultKPIs: PerformanceKPIs = {
  total_resolved: 0,
  active_issues: 0,
  high_priority_active: 0,
  avg_resolve_time_days: 0,
};

export const useMyPerformance = (): UseMyPerformanceResult => {
  const [weeklyPerformance, setWeeklyPerformance] = useState<WeeklyPerformanceDay[]>([]);
  const [kpis, setKpis] = useState<PerformanceKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: MyPerformanceResponse = await organizationAdminIssueApi.getMyPerformance();
      setWeeklyPerformance(data.weekly_performance ?? []);
      setKpis(data.kpis ?? defaultKPIs);
    } catch (err: any) {
      console.error('Failed to fetch performance data:', err);
      setError(err?.response?.data?.detail || 'Failed to load performance data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    weeklyPerformance,
    kpis,
    isLoading,
    error,
    refresh: fetchPerformance,
  };
};
