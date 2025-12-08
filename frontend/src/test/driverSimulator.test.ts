import { describe, it, expect } from 'vitest';
import { calculateDistance, calculateBearing, movePoint } from '@/lib/geo';

describe('Driver Simulator Math', () => {
  const bangaloreStation = { lat: 12.9716, lon: 77.5946 };
  const testPoint = { lat: 12.9816, lon: 77.5946 }; // ~1.1km north

  it('should calculate distance correctly', () => {
    const distance = calculateDistance(
      bangaloreStation.lat,
      bangaloreStation.lon,
      testPoint.lat,
      testPoint.lon
    );

    // Should be approximately 1.1km (1100m)
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(1200);
  });

  it('should calculate bearing correctly', () => {
    const bearing = calculateBearing(
      bangaloreStation.lat,
      bangaloreStation.lon,
      testPoint.lat,
      testPoint.lon
    );

    // Should be approximately 0 degrees (north)
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(10);
  });

  it('should move point correctly', () => {
    const moved = movePoint(bangaloreStation.lat, bangaloreStation.lon, 0, 500);

    // Should be ~500m north
    expect(moved.lat).toBeGreaterThan(bangaloreStation.lat);
    expect(Math.abs(moved.lon - bangaloreStation.lon)).toBeLessThan(0.001);

    const distance = calculateDistance(
      bangaloreStation.lat,
      bangaloreStation.lon,
      moved.lat,
      moved.lon
    );
    expect(distance).toBeGreaterThan(450);
    expect(distance).toBeLessThan(550);
  });

  it('should decrease distance when moving towards target', () => {
    const start = { lat: 12.9616, lon: 77.5946 }; // 1km south
    const target = bangaloreStation;

    const bearing = calculateBearing(start.lat, start.lon, target.lat, target.lon);
    const moved = movePoint(start.lat, start.lon, bearing, 100);

    const distanceBefore = calculateDistance(start.lat, start.lon, target.lat, target.lon);
    const distanceAfter = calculateDistance(moved.lat, moved.lon, target.lat, target.lon);

    expect(distanceAfter).toBeLessThan(distanceBefore);
  });
});
