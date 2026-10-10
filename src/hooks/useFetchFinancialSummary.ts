import { useQuery } from '@tanstack/react-query';
import financeApi from '../api/financeApi';
import { FinancialReportFilter, FinancialReportData } from '../types/finance.types';

export const useFetchFinancialSummary = (filter: FinancialReportFilter, enabled: boolean = true) => {
  return useQuery<FinancialReportData>({
    queryKey: ['financial-summary', filter],
    queryFn: async () => {
      const response = await financeApi.getFinancialSummaryReport(filter);
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
};

export default useFetchFinancialSummary;
