import { useMutation, useQueryClient } from '@tanstack/react-query';
import { academicApi } from '../api/academicApi';
import { ClassroomEquipmentItem, TransferEquipmentPayload, EquipmentRequisitionItem } from '../types/classroom.types';

export const useClassroomEquipment = () => {
  const queryClient = useQueryClient();

  const saveInventoryMutation = useMutation({
    mutationFn: async ({ classId, items }: { classId: string; items: ClassroomEquipmentItem[] }) => {
      const response = await academicApi.saveClassroomEquipmentInventory(classId, items);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-equipment'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const transferEquipmentMutation = useMutation({
    mutationFn: async (payload: TransferEquipmentPayload) => {
      const response = await academicApi.transferClassroomEquipment(payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-equipment'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const requisitionMutation = useMutation({
    mutationFn: async (requisition: EquipmentRequisitionItem) => {
      const response = await academicApi.createEquipmentRequisition(requisition);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-equipment'] });
    },
  });

  return {
    saveInventory: saveInventoryMutation.mutateAsync,
    isSavingInventory: saveInventoryMutation.isPending,
    transferEquipment: transferEquipmentMutation.mutateAsync,
    isTransferring: transferEquipmentMutation.isPending,
    createRequisition: requisitionMutation.mutateAsync,
    isCreatingRequisition: requisitionMutation.isPending,
  };
};
