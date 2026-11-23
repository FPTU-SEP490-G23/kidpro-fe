import { useMutation, useQueryClient } from '@tanstack/react-query';
import kitchenApi from '../api/kitchenApi';
import { ThreeStepFoodSafetyInspectionLog } from '../types/kitchen.types';

export const useFoodInspectionSteps = () => {
  const queryClient = useQueryClient();

  return useMutation<ThreeStepFoodSafetyInspectionLog, Error, ThreeStepFoodSafetyInspectionLog>({
    mutationFn: async (payload: ThreeStepFoodSafetyInspectionLog) => {
      const response: any = await kitchenApi.saveThreeStepInspectionLog(payload);
      const data = response?.data ?? response;
      return (data && (data.inspectionDate || data.logId)) ? data : payload;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries để đồng bộ dữ liệu toàn hệ thống
      const targetDate = data?.inspectionDate || variables?.inspectionDate;
      if (targetDate) {
        queryClient.invalidateQueries({ queryKey: ['food-inspection-log', targetDate] });
      }
      queryClient.invalidateQueries({ queryKey: ['food-samples'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
    },
  });
};

export default useFoodInspectionSteps;
