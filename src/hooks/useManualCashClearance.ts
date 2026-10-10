import { useMutation, useQueryClient } from '@tanstack/react-query';
import financeApi from '../api/financeApi';
import { CashPaymentPayload, CashPaymentReceipt } from '../types/finance.types';

interface ManualCashClearanceParams {
  invoiceId: string;
  payload: CashPaymentPayload;
}

export const useManualCashClearance = () => {
  const queryClient = useQueryClient();

  return useMutation<CashPaymentReceipt, Error, ManualCashClearanceParams>({
    mutationFn: async ({ invoiceId, payload }: ManualCashClearanceParams) => {
      const response = await financeApi.clearInvoiceWithCash(invoiceId, payload);
      return response.data;
    },
    onSuccess: () => {
      // Revalidation tự động các danh mục nợ và sổ quỹ tiền mặt
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      queryClient.invalidateQueries({ queryKey: ['student-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register'] });
    },
  });
};

export default useManualCashClearance;
