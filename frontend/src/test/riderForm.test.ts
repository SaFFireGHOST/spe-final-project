import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const riderSchema = z.object({
  riderId: z.string().min(1, 'Rider ID is required'),
  stationId: z.string().min(1, 'Station is required'),
  destination: z.string().min(1, 'Destination is required'),
  etaMinutes: z.coerce.number().int().min(0, 'ETA must be 0 or greater'),
});

describe('Rider Form Validation', () => {
  it('should validate correct form data', () => {
    const validData = {
      riderId: 'RIDER001',
      stationId: 'MG_ROAD',
      destination: 'Indiranagar',
      etaMinutes: 15,
    };

    expect(() => riderSchema.parse(validData)).not.toThrow();
  });

  it('should reject empty destination', () => {
    const invalidData = {
      riderId: 'RIDER001',
      stationId: 'MG_ROAD',
      destination: '',
      etaMinutes: 15,
    };

    expect(() => riderSchema.parse(invalidData)).toThrow();
  });

  it('should reject negative ETA minutes', () => {
    const invalidData = {
      riderId: 'RIDER001',
      stationId: 'MG_ROAD',
      destination: 'Indiranagar',
      etaMinutes: -5,
    };

    expect(() => riderSchema.parse(invalidData)).toThrow();
  });

  it('should accept zero ETA minutes', () => {
    const validData = {
      riderId: 'RIDER001',
      stationId: 'MG_ROAD',
      destination: 'Indiranagar',
      etaMinutes: 0,
    };

    expect(() => riderSchema.parse(validData)).not.toThrow();
  });
});
