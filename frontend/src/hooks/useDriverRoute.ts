import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DriverRoute } from '@/lib/types';
import * as driverRepo from '@/mocks/driverRepo';

export function useDriverRoute(driverId: string | null) {
  return useQuery({
    queryKey: ['driver-route', driverId],
    queryFn: () => (driverId ? driverRepo.getRoute(driverId) : null),
    enabled: !!driverId,
  });
}

export function useUpsertDriverRoute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (route: Omit<DriverRoute, 'createdAt' | 'updatedAt'>) =>
      driverRepo.upsertRoute(route),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['driver-route', variables.driverId] });
    },
  });
}

export function useDeleteDriverRoute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: driverRepo.deleteRoute,
    onSuccess: (_, driverId) => {
      queryClient.invalidateQueries({ queryKey: ['driver-route', driverId] });
    },
  });
}
