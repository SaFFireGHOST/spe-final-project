import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Station } from '@/lib/types';
import * as stationsRepo from '@/mocks/stationsRepo';

export function useStations() {
  return useQuery({
    queryKey: ['stations'],
    queryFn: stationsRepo.getAllStations,
  });
}

export function useStation(id: string | null) {
  return useQuery({
    queryKey: ['station', id],
    queryFn: () => (id ? stationsRepo.getStationById(id) : null),
    enabled: !!id,
  });
}

export function useUpsertStation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (station: Station) => {
      try {
        return await stationsRepo.updateStation(station.id, station);
      } catch {
        return await stationsRepo.createStation(station);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: stationsRepo.deleteStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
}
