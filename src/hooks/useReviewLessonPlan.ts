import { useMutation, useQueryClient } from '@tanstack/react-query';
import { academicApi } from '../api/academicApi';
import { ReviewLessonPlanPayload } from '../types/classroom.types';

interface ReviewLessonPlanMutationArgs {
  id: string;
  payload: ReviewLessonPlanPayload;
}

export const useReviewLessonPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: ReviewLessonPlanMutationArgs) => {
      const response = await academicApi.reviewLessonPlan(id, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plans'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-lesson-plans'] });
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
};
