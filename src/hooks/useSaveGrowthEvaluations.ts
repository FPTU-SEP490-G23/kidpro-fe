import { useMutation, useQueryClient } from '@tanstack/react-query';
import { academicApi } from '../api/academicApi';
import { SaveClassEvaluationPayload } from '../types/classroom.types';

export const useSaveGrowthEvaluations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SaveClassEvaluationPayload) => {
      const response = await academicApi.saveClassEvaluationsBatch(payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['student-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['development-evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};
