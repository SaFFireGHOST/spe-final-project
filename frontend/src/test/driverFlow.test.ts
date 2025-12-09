import { describe, it, expect } from 'vitest';
import * as driverRepo from '@/mocks/driverRepo';

describe('Driver Flow', () => {
    it('should register a route and update seats', async () => {
        // 1. Register Route
        const routeData = {
            id: 'ROUTE_FLOW_TEST',
            driverId: 'DRIVER_FLOW_TEST',
            destinationArea: 'Whitefield',
            seatsTotal: 4,
            seatsFree: 4,
            stationIds: ['MG_ROAD'],
            minutesBeforeEtaMatch: 10
        };

        const route = await driverRepo.upsertRoute(routeData);
        expect(route).toHaveProperty('id');
        expect(route.seatsFree).toBe(4);

        // 2. Update Seats (upsert again)
        const updatedData = { ...routeData, seatsFree: 3 };
        const updated = await driverRepo.upsertRoute(updatedData);
        expect(updated.seatsFree).toBe(3);

        // 3. Verify Get Route
        const fetched = await driverRepo.getRoute(routeData.driverId);
        expect(fetched?.seatsFree).toBe(3);
    });

    it('should delete a route', async () => {
        const routeData = {
            id: 'ROUTE_DELETE_TEST',
            driverId: 'DRIVER_DELETE_TEST',
            destinationArea: 'Koramangala',
            seatsTotal: 3,
            seatsFree: 3,
            stationIds: [],
            minutesBeforeEtaMatch: 5
        };

        await driverRepo.upsertRoute(routeData);

        await driverRepo.deleteRoute(routeData.driverId);
        const fetched = await driverRepo.getRoute(routeData.driverId);
        expect(fetched).toBeNull();
    });
});
