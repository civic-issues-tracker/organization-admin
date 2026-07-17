import { useQuery } from '@tanstack/react-query';
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
  const { data, isLoading, error, refetch } = useQuery<MyPerformanceResponse, Error>({
    queryKey: ['orgAdminPerformance'],
    queryFn: async () => {
      return await organizationAdminIssueApi.getMyPerformance();
    },
  });

  return {
    weeklyPerformance: data?.weekly_performance ?? [],
    kpis: data?.kpis ?? defaultKPIs,
    isLoading,
    error: error ? error.message : null,
    refresh: () => refetch(),
  };
};
