import { describe, it, expect, beforeEach } from 'vitest';
import * as stationsRepo from '@/mocks/stationsRepo';

describe('Stations Repository', () => {
  it('should return all stations', async () => {
    const stations = await stationsRepo.getAllStations();
    expect(stations.length).toBeGreaterThan(0);
    expect(stations[0]).toHaveProperty('id');
    expect(stations[0]).toHaveProperty('name');
    expect(stations[0]).toHaveProperty('lat');
    expect(stations[0]).toHaveProperty('lon');
    expect(stations[0]).toHaveProperty('nearbyAreas');
  });

  it('should get station by id', async () => {
    const station = await stationsRepo.getStationById('MG_ROAD');
    expect(station).not.toBeNull();
    expect(station?.name).toBe('MG Road Metro');
  });

  it('should create a new station', async () => {
    const newStation = {
      id: 'TEST_STATION',
      name: 'Test Station',
      lat: 12.9,
      lon: 77.6,
      nearbyAreas: ['Area1', 'Area2'],
    };

    const created = await stationsRepo.createStation(newStation);
    expect(created.id).toBe(newStation.id);

    const fetched = await stationsRepo.getStationById('TEST_STATION');
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Test Station');

    // Cleanup
    await stationsRepo.deleteStation('TEST_STATION');
  });

  it('should update an existing station', async () => {
    const station = await stationsRepo.getStationById('MG_ROAD');
    expect(station).not.toBeNull();

    const updated = await stationsRepo.updateStation('MG_ROAD', {
      nearbyAreas: ['Updated Area'],
    });

    expect(updated.nearbyAreas).toContain('Updated Area');
  });

  it('should delete a station', async () => {
    const newStation = {
      id: 'DELETE_TEST',
      name: 'Delete Test Station',
      lat: 12.9,
      lon: 77.6,
      nearbyAreas: ['Area1'],
    };

    await stationsRepo.createStation(newStation);
    await stationsRepo.deleteStation('DELETE_TEST');

    const fetched = await stationsRepo.getStationById('DELETE_TEST');
    expect(fetched).toBeNull();
  });
});
