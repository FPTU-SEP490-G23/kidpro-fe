import { useMutation, useQueryClient } from '@tanstack/react-query';
import financeApi from '../api/financeApi';
import {
  BatchDebtReminderPayload,
  BatchReminderResult,
  PersonalizedReminderPayload,
} from '../types/finance.types';

export const useTriggerDebtReminders = () => {
  const queryClient = useQueryClient();

  const batchReminderMutation = useMutation<BatchReminderResult, Error, BatchDebtReminderPayload>({
    mutationFn: async (payload: BatchDebtReminderPayload) => {
      const response = await financeApi.triggerBatchDebtReminders(payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const individualReminderMutation = useMutation<any, Error, PersonalizedReminderPayload>({
    mutationFn: async (payload: PersonalizedReminderPayload) => {
      const response = await financeApi.sendPersonalizedDebtReminder(payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    batchReminderMutation,
    individualReminderMutation,
  };
};

export default useTriggerDebtReminders;
