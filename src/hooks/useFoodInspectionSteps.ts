import { useMutation, useQueryClient } from '@tanstack/react-query';
import kitchenApi from '../api/kitchenApi';
import { ThreeStepFoodSafetyInspectionLog } from '../types/kitchen.types';

export const useFoodInspectionSteps = () => {
  const queryClient = useQueryClient();

  return useMutation<ThreeStepFoodSafetyInspectionLog, Error, ThreeStepFoodSafetyInspectionLog>({
    mutationFn: async (payload: ThreeStepFoodSafetyInspectionLog) => {
      const response = await kitchenApi.saveThreeStepInspectionLog(payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate queries để đồng bộ dữ liệu toàn hệ thống
      queryClient.invalidateQueries({ queryKey: ['food-inspection-log', data.inspectionDate] });
      queryClient.invalidateQueries({ queryKey: ['food-samples'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
    },
  });
};

export default useFoodInspectionSteps;
