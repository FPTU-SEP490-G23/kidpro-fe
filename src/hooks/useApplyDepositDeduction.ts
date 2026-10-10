import { useMutation, useQueryClient } from '@tanstack/react-query';
import financeApi from '../api/financeApi';
import { DeductDepositPayload } from '../types/finance.types';

export const useApplyDepositDeduction = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, DeductDepositPayload>({
    mutationFn: async (payload: DeductDepositPayload) => {
      const response = await financeApi.deductEnrollmentDeposit(payload);
      return response.data;
    },
    onSuccess: () => {
      // Làm mới danh sách tiền cọc, hóa đơn học phí và công nợ
      queryClient.invalidateQueries({ queryKey: ['enrollment-deposits'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
    },
  });
};

export default useApplyDepositDeduction;
