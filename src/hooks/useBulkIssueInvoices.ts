import { useMutation, useQueryClient } from '@tanstack/react-query';
import financeApi from '../api/financeApi';
import { BulkIssuancePayload, BulkIssuanceResult } from '../types/finance.types';

export const useBulkIssueInvoices = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkIssuanceResult, Error, BulkIssuancePayload>({
    mutationFn: async (payload: BulkIssuancePayload) => {
      const response = await financeApi.bulkIssueInvoices(payload);
      return response.data;
    },
    onSuccess: () => {
      // Tự động làm mới danh sách dữ liệu tài chính liên quan
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['student-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic-invoices'] });
    },
  });
};

export default useBulkIssueInvoices;
