export interface Station {
  id: string;
  name: string;
  lat: number;
  lon: number;
  nearbyAreas: string[];
}

export interface RiderRequest {
  id: string;
  riderId: string;
  stationId: string;
  destination: string;
  etaMinutes: number;
  etaAbsolute: Date;
  status: 'PENDING' | 'ASSIGNED' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverRoute {
  id: string;
  driverId: string;
  routeId?: string;
  destinationArea: string;
  seatsTotal: number;
  seatsFree: number;
  stationIds: string[];
  minutesBeforeEtaMatch: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverPosition {
  lat: number;
  lon: number;
  timestamp: Date;
}

export type Role = 'rider' | 'driver';
