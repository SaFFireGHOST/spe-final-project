import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '@/lib/types';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface GeoMapProps {
  center?: { lat: number; lon: number };
  stations?: Station[];
  driverPosition?: { lat: number; lon: number } | null;
  geofenceRadius?: number;
  className?: string;
}

export function GeoMap({
  center,
  stations = [],
  driverPosition,
  geofenceRadius = 400,
  className = '',
}: GeoMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{
    stations: L.LayerGroup;
    driver?: L.Marker;
  }>({ stations: L.layerGroup() });

  const prevStationIds = useRef<string>('');

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter = center || (stations.length > 0 ? stations[0] : { lat: 12.9716, lon: 77.5946 });

    mapRef.current = L.map(mapContainerRef.current).setView(
      [defaultCenter.lat, defaultCenter.lon],
      14
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markersRef.current.stations.addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update station markers and geofences
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.stations.clearLayers();

    if (stations && stations.length > 0) {
      const bounds = L.latLngBounds([]);
      const currentStationIds = stations.map(s => s.id).sort().join(',');

      stations.forEach(station => {
        // Add station marker
        const stationIcon = L.divIcon({
          html: `<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="16" height="16" x="4" y="4" rx="2"/>
              <rect width="6" height="6" x="9" y="9" rx="1"/>
              <path d="M15 2v2"/>
              <path d="M15 20v2"/>
              <path d="M2 15h2"/>
              <path d="M2 9h2"/>
              <path d="M20 15h2"/>
              <path d="M20 9h2"/>
              <path d="M9 2v2"/>
              <path d="M9 20v2"/>
              <path d="M9 20v2"/>
            </svg>
          </div>`,
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([station.lat, station.lon], {
          icon: stationIcon,
        })
          .bindPopup(`<strong>${station.name}</strong><br/>Areas: ${station.nearbyAreas.join(', ')}`);

        markersRef.current.stations.addLayer(marker);

        // Add geofence circle
        const circle = L.circle([station.lat, station.lon], {
          color: 'hsl(200, 98%, 39%)',
          fillColor: 'hsl(200, 98%, 39%)',
          fillOpacity: 0.1,
          radius: geofenceRadius,
        });

        markersRef.current.stations.addLayer(circle);

        bounds.extend([station.lat, station.lon]);
      });

      // Fit bounds only if stations have changed
      if (stations.length > 0 && currentStationIds !== prevStationIds.current) {
        if (stations.length === 1) {
          // If only one station, zoom to it with a specific level (e.g., 15)
          mapRef.current.setView([stations[0].lat, stations[0].lon], 15);
        } else {
          // If multiple stations, fit bounds to show all
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
        prevStationIds.current = currentStationIds;
      }
    }
  }, [stations, geofenceRadius]);

  // Update driver marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (markersRef.current.driver) {
      markersRef.current.driver.remove();
    }

    if (driverPosition) {
      const driverIcon = L.divIcon({
        html: `<div class="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      markersRef.current.driver = L.marker(
        [driverPosition.lat, driverPosition.lon],
        { icon: driverIcon }
      )
        .addTo(mapRef.current)
        .bindPopup('Driver');
    }
  }, [driverPosition]);

  // Update center
  useEffect(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.setView([center.lat, center.lon]);
  }, [center]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full h-full rounded-2xl overflow-hidden ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}
