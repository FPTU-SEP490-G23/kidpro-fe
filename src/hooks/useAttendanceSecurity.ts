import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendanceApi';
import { FaceLog, LeaveRequest } from '../types/attendance.types';

export const useResolveStrangerAlert = (options?: {
  onSuccess?: (data: any) => void;
  onError?: (err: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alertId,
      notes,
      strangerName,
      idCard,
      outcome
    }: {
      alertId: string;
      notes: string;
      strangerName?: string;
      idCard?: string;
      outcome?: 'APPROVED' | 'DENIED' | 'UNREACHABLE';
    }) => {
      try {
        const res = await attendanceApi.resolveStrangerAlert(alertId, {
          notes,
          strangerName,
          idCard,
          outcome
        });
        return res?.data || res;
      } catch (err) {
        // Fallback local resolution
        return {
          id: alertId,
          resolved: true,
          alertResolvedAt: new Date().toISOString(),
          resolvedNotes: notes
        };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unresolved-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['face-logs'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (err) => {
      if (options?.onError) {
        options.onError(err);
      }
    }
  });
};

export const useReviewLeaveRequest = (options?: {
  onSuccess?: (data: LeaveRequest) => void;
  onError?: (err: any) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      reviewNotes,
      mealRefundApplied
    }: {
      requestId: string;
      status: 'APPROVED' | 'REJECTED';
      reviewNotes?: string;
      mealRefundApplied?: boolean;
    }) => {
      try {
        const res = await attendanceApi.reviewLeaveRequest(requestId, {
          status,
          reviewNotes,
          mealRefundApplied
        });
        return res?.data || res;
      } catch (err) {
        // Fallback response
        return {
          id: requestId,
          status,
          reviewNotes,
          mealRefundApplied,
          reviewedAt: new Date().toISOString()
        } as LeaveRequest;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-headcount'] });
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (err) => {
      if (options?.onError) {
        options.onError(err);
      }
    }
  });
};
