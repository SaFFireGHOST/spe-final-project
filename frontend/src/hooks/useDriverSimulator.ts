import { useState, useEffect, useCallback, useRef } from 'react';
// Force IDE re-index
import { Station } from '@/lib/types';
import { calculateDistance, calculateBearing, movePoint } from '@/lib/geo';

interface SimulatorState {
  isRunning: boolean;
  position: { lat: number; lon: number } | null;
  distanceToStation: number | null;
  etaMinutes: number | null;
  insideGeofence: boolean;
  currentTargetIndex: number;
}

const GEOFENCE_RADIUS = 400; // meters
const SPEED_MPS = 25; // 25 meters per second (~90 km/h)
const UPDATE_INTERVAL = 1000; // Update every second

export function useDriverSimulator(targetStations: Station[]) {
  const [state, setState] = useState<SimulatorState>({
    isRunning: false,
    position: null,
    distanceToStation: null,
    etaMinutes: null,
    insideGeofence: false,
    currentTargetIndex: -1,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedGeofenceRef = useRef(false);

  const start = useCallback(() => {
    if (!targetStations || targetStations.length === 0) return;

    // Start 1 km away from the first station
    const firstStation = targetStations[0];
    const startDistance = 1000; // meters
    const bearing = Math.random() * 360; // Random direction
    const startPos = movePoint(
      firstStation.lat,
      firstStation.lon,
      bearing,
      startDistance
    );

    setState({
      isRunning: true,
      position: startPos,
      distanceToStation: startDistance,
      etaMinutes: Math.ceil(startDistance / SPEED_MPS / 60),
      insideGeofence: false,
      currentTargetIndex: 0,
    });

    notifiedGeofenceRef.current = false;
  }, [targetStations]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({
      isRunning: false,
      position: null,
      distanceToStation: null,
      etaMinutes: null,
      insideGeofence: false,
      currentTargetIndex: -1,
    });
    notifiedGeofenceRef.current = false;
  }, []);

  useEffect(() => {
    if (!state.isRunning || !state.position || targetStations.length === 0 || state.currentTargetIndex === -1) return;

    const currentTarget = targetStations[state.currentTargetIndex];
    if (!currentTarget) return;

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.position) return prev;

        const distance = calculateDistance(
          prev.position.lat,
          prev.position.lon,
          currentTarget.lat,
          currentTarget.lon
        );

        // Check if arrived at current station
        if (distance < 10) {
          // If there are more stations, move to next
          if (prev.currentTargetIndex < targetStations.length - 1) {
            // Reset geofence notification for the next station
            notifiedGeofenceRef.current = false;

            return {
              ...prev,
              currentTargetIndex: prev.currentTargetIndex + 1,
              distanceToStation: null, // Will be recalculated next tick for new target
              etaMinutes: null,
              insideGeofence: false,
            };
          } else {
            // Arrived at final station
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return {
              ...prev,
              isRunning: false,
              distanceToStation: 0,
              etaMinutes: 0,
              insideGeofence: true,
            };
          }
        }

        // Move towards current station
        const bearing = calculateBearing(
          prev.position.lat,
          prev.position.lon,
          currentTarget.lat,
          currentTarget.lon
        );

        const newPos = movePoint(
          prev.position.lat,
          prev.position.lon,
          bearing,
          SPEED_MPS
        );

        const newDistance = calculateDistance(
          newPos.lat,
          newPos.lon,
          currentTarget.lat,
          currentTarget.lon
        );

        const insideGeofence = newDistance <= GEOFENCE_RADIUS;

        // Notify when entering geofence
        if (insideGeofence && !notifiedGeofenceRef.current) {
          notifiedGeofenceRef.current = true;
          // This will be picked up by the component
        }

        return {
          ...prev,
          position: newPos,
          distanceToStation: newDistance,
          etaMinutes: Math.ceil(newDistance / SPEED_MPS / 60),
          insideGeofence,
        };
      });
    }, UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.currentTargetIndex, targetStations]);

  return {
    ...state,
    start,
    stop,
  };
}
