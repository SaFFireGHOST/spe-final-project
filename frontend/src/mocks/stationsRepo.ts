import { Station } from '@/lib/types';

let stations: Station[] = [
  {
    id: 'MG_ROAD',
    name: 'MG Road Metro',
    lat: 12.9756,
    lon: 77.6069,
    nearbyAreas: ['Indiranagar', 'Domlur', 'Ulsoor', 'Ashok Nagar'],
  },
  {
    id: 'TRINITY',
    name: 'Trinity Metro',
    lat: 12.9716,
    lon: 77.6412,
    nearbyAreas: ['HAL', 'Old Airport Road', 'Jeevanbhima Nagar'],
  },
  {
    id: 'RV_ROAD',
    name: 'RV Road Metro',
    lat: 12.9343,
    lon: 77.5802,
    nearbyAreas: ['Basavanagudi', 'Gandhi Bazaar', 'Jayanagar'],
  },
  {
    id: 'CUBBON_PARK',
    name: 'Cubbon Park Metro',
    lat: 12.9767,
    lon: 77.5920,
    nearbyAreas: ['MG Road', 'Brigade Road', 'Shivaji Nagar'],
  },
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAllStations(): Promise<Station[]> {
  await delay(300 + Math.random() * 300);
  return [...stations];
}

export async function getStationById(id: string): Promise<Station | null> {
  await delay(300 + Math.random() * 300);
  return stations.find((s) => s.id === id) || null;
}

export async function createStation(station: Station): Promise<Station> {
  await delay(300 + Math.random() * 300);
  const exists = stations.find((s) => s.id === station.id);
  if (exists) {
    throw new Error('Station with this ID already exists');
  }
  stations.push(station);
  return station;
}

export async function updateStation(id: string, updates: Partial<Station>): Promise<Station> {
  await delay(300 + Math.random() * 300);
  const index = stations.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error('Station not found');
  }
  stations[index] = { ...stations[index], ...updates };
  return stations[index];
}

export async function deleteStation(id: string): Promise<void> {
  await delay(300 + Math.random() * 300);
  stations = stations.filter((s) => s.id !== id);
}
