import { useMutation, useQueryClient } from '@tanstack/react-query';
import financeApi from '../api/financeApi';
import { ResolveDisputePayload } from '../types/finance.types';

export const useResolveDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ResolveDisputePayload }) => {
      const response = await financeApi.resolvePaymentDispute(id, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['tuition-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
  });
};

export default useResolveDispute;
