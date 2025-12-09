import { describe, it, expect } from 'vitest';
import * as riderRepo from '@/mocks/riderRepo';

describe('Rider Flow', () => {
    it('should create a rider request and poll for status', async () => {
        // 1. Create Request
        const requestData = {
            riderId: 'RIDER_FLOW_TEST',
            stationId: 'MG_ROAD',
            destination: 'Indiranagar',
            etaMinutes: 10,
        };

        // createRequest(riderId, stationId, destination, etaMinutes)
        const req = await riderRepo.createRequest(
            requestData.riderId, requestData.stationId, requestData.destination, requestData.etaMinutes
        );
        expect(req).toHaveProperty('id');
        expect(req.status).toBe('PENDING');

        // 2. Poll Status (simulate polling)
        const requests = await riderRepo.getRequestsByRider(requestData.riderId);
        const status = requests.find(r => r.id === req.id);
        expect(status).toBeDefined();
        expect(status?.status).toBe('PENDING');

        // 3. Simulate Assignment (manually update mock if possible, or just verify pending)
        // Since we can't easily trigger the backend matcher in this mock test, 
        // we just verify the request persists.
    });

    it('should list pending requests at a station', async () => {
        // Create a request first
        await riderRepo.createRequest('RIDER_PENDING', 'STATION_A', 'Area B', 5);

        const allRequests = await riderRepo.getAllRequests();
        const pending = allRequests.filter(r => r.stationId === 'STATION_A');

        expect(pending.length).toBeGreaterThan(0);
        const found = pending.find(r => r.riderId === 'RIDER_PENDING');
        expect(found).toBeDefined();
    });
});
