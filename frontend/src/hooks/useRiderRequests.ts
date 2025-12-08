import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as riderRepo from '@/mocks/riderRepo';

export function useCreateRiderRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      riderId,
      stationId,
      destination,
      etaMinutes,
    }: {
      riderId: string;
      stationId: string;
      destination: string;
      etaMinutes: number;
    }) => riderRepo.createRequest(riderId, stationId, destination, etaMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-requests'] });
    },
  });
}

export function useRiderRequests(riderId: string | null) {
  return useQuery({
    queryKey: ['rider-requests', riderId],
    queryFn: () => (riderId ? riderRepo.getRequestsByRider(riderId) : []),
    enabled: !!riderId,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });
}

export function useAllRequests() {
  return useQuery({
    queryKey: ['all-rider-requests'],
    queryFn: riderRepo.getAllRequests,
    refetchInterval: 3000,
  });
}
