import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, MapPin, Play, Square, Navigation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useStations } from '@/hooks/useStations';
import { useDriverRoute, useUpsertDriverRoute } from '@/hooks/useDriverRoute';
import { useDriverSimulator } from '@/hooks/useDriverSimulator';
import { GeoMap } from '@/shared/ui/GeoMap';
import { toast } from 'sonner';

const driverSchema = z.object({
  driverId: z.string().min(1, 'Driver ID is required'),
  routeId: z.string().optional(),
  destinationArea: z.string().min(1, 'Destination area is required'),
  seatsTotal: z.coerce.number().int().min(1, 'Must have at least 1 seat'),
  seatsFree: z.coerce.number().int().min(0),
  stationIds: z.array(z.string()).min(1, 'Select at least one station'),
  minutesBeforeEtaMatch: z.coerce.number().int().min(0, 'Must be 0 or greater'),
}).refine((data) => data.seatsFree <= data.seatsTotal, {
  message: 'Free seats cannot exceed total seats',
  path: ['seatsFree'],
});

type DriverFormData = z.infer<typeof driverSchema>;

export default function Driver() {
  const [driverId, setDriverId] = useState(localStorage.getItem('lastmile-driverId') || '');
  const [selectedStations, setSelectedStations] = useState<string[]>([]);

  const { data: stations = [] } = useStations();
  const { data: existingRoute } = useDriverRoute(driverId || null);
  const upsertRoute = useUpsertDriverRoute();

  const firstStation = stations.find((s) => s.id === selectedStations[0]);
  const { isRunning, position, distanceToStation, etaMinutes, insideGeofence, start, stop } =
    useDriverSimulator(firstStation || null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      driverId,
      seatsTotal: 4,
      seatsFree: 4,
      minutesBeforeEtaMatch: 10,
      stationIds: [],
    },
  });

  const watchedSeatsTotal = watch('seatsTotal');

  useEffect(() => {
    if (existingRoute) {
      setValue('driverId', existingRoute.driverId);
      setValue('routeId', existingRoute.routeId || '');
      setValue('destinationArea', existingRoute.destinationArea);
      setValue('seatsTotal', existingRoute.seatsTotal);
      setValue('seatsFree', existingRoute.seatsFree);
      setValue('stationIds', existingRoute.stationIds);
      setValue('minutesBeforeEtaMatch', existingRoute.minutesBeforeEtaMatch);
      setSelectedStations(existingRoute.stationIds);
    }
  }, [existingRoute, setValue]);

  useEffect(() => {
    if (insideGeofence && isRunning) {
      toast.success('Entered geofence—matching would trigger now (mock)', {
        icon: <Navigation className="h-4 w-4" />,
      });
    }
  }, [insideGeofence, isRunning]);

  const onSubmit = async (data: DriverFormData) => {
    try {
      await upsertRoute.mutateAsync({
        id: existingRoute?.id || '',
        driverId: data.driverId,
        routeId: data.routeId,
        destinationArea: data.destinationArea,
        seatsTotal: data.seatsTotal,
        seatsFree: data.seatsFree,
        stationIds: data.stationIds,
        minutesBeforeEtaMatch: data.minutesBeforeEtaMatch,
      });
      localStorage.setItem('lastmile-driverId', data.driverId);
      setDriverId(data.driverId);
      toast.success(existingRoute ? 'Route updated successfully!' : 'Route registered successfully!');
    } catch (error) {
      toast.error('Failed to save route');
    }
  };

  const toggleStation = (stationId: string) => {
    const newStations = selectedStations.includes(stationId)
      ? selectedStations.filter((id) => id !== stationId)
      : [...selectedStations, stationId];
    setSelectedStations(newStations);
    setValue('stationIds', newStations);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Driver Dashboard</h1>
        <p className="text-muted-foreground">Manage your route and offer rides</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Route Form */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Register / Update Route</CardTitle>
            <CardDescription>Set up your route and availability</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driverId">Driver ID</Label>
                  <Input
                    id="driverId"
                    placeholder="e.g., DRV001"
                    {...register('driverId')}
                  />
                  {errors.driverId && (
                    <p className="text-sm text-destructive">{errors.driverId.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routeId">Route ID (Optional)</Label>
                  <Input
                    id="routeId"
                    placeholder="e.g., RT-123"
                    {...register('routeId')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destinationArea">Destination Area</Label>
                <Input
                  id="destinationArea"
                  placeholder="e.g., Indiranagar"
                  {...register('destinationArea')}
                />
                {errors.destinationArea && (
                  <p className="text-sm text-destructive">{errors.destinationArea.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seatsTotal">Total Seats</Label>
                  <Input
                    id="seatsTotal"
                    type="number"
                    min="1"
                    {...register('seatsTotal')}
                  />
                  {errors.seatsTotal && (
                    <p className="text-sm text-destructive">{errors.seatsTotal.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seatsFree">Seats Available</Label>
                  <Input
                    id="seatsFree"
                    type="number"
                    min="0"
                    max={watchedSeatsTotal}
                    {...register('seatsFree')}
                  />
                  {errors.seatsFree && (
                    <p className="text-sm text-destructive">{errors.seatsFree.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Stations (Select multiple)</Label>
                <div className="flex flex-wrap gap-2">
                  {stations.map((station) => (
                    <Badge
                      key={station.id}
                      variant={selectedStations.includes(station.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleStation(station.id)}
                    >
                      {station.name}
                    </Badge>
                  ))}
                </div>
                {errors.stationIds && (
                  <p className="text-sm text-destructive">{errors.stationIds.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minutesBeforeEtaMatch">
                  Minutes Before ETA to Match
                  <span className="text-muted-foreground text-sm ml-2">
                    (How early to start matching?)
                  </span>
                </Label>
                <Input
                  id="minutesBeforeEtaMatch"
                  type="number"
                  min="0"
                  {...register('minutesBeforeEtaMatch')}
                />
                {errors.minutesBeforeEtaMatch && (
                  <p className="text-sm text-destructive">
                    {errors.minutesBeforeEtaMatch.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={upsertRoute.isPending}>
                {upsertRoute.isPending ? 'Saving...' : 'Save Route'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Route Summary */}
        {existingRoute && (
          <Card className="rounded-2xl bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <CardTitle>Active Route</CardTitle>
              </div>
              <CardDescription>Your current route configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Driver ID:</span>
                  <p className="font-semibold">{existingRoute.driverId}</p>
                </div>
                {existingRoute.routeId && (
                  <div>
                    <span className="text-muted-foreground">Route ID:</span>
                    <p className="font-semibold">{existingRoute.routeId}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Destination:</span>
                  <p className="font-semibold">{existingRoute.destinationArea}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Seats:</span>
                  <p className="font-semibold">
                    {existingRoute.seatsFree} / {existingRoute.seatsTotal} available
                  </p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">Stations:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {existingRoute.stationIds.map((id) => {
                    const station = stations.find((s) => s.id === id);
                    return (
                      <Badge key={id} variant="secondary">
                        {station?.name || id}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Simulator */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Driver Movement Simulator</CardTitle>
            <CardDescription>
              Simulate driving to the first station in your route
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={start}
                disabled={isRunning || !firstStation}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Simulation
              </Button>
              <Button onClick={stop} disabled={!isRunning} variant="destructive" className="flex-1">
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>

            {!firstStation && (
              <p className="text-sm text-muted-foreground text-center">
                Select at least one station in your route to enable simulation
              </p>
            )}

            {position && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Position:</span>
                    <p className="font-mono text-xs">
                      {position.lat.toFixed(6)}, {position.lon.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Distance to Station:</span>
                    <p className="font-semibold">
                      {distanceToStation ? `${Math.round(distanceToStation)}m` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ETA:</span>
                    <p className="font-semibold">{etaMinutes ? `${etaMinutes} min` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Geofence Status:</span>
                    <Badge variant={insideGeofence ? 'default' : 'secondary'} className={insideGeofence ? 'bg-success' : ''}>
                      {insideGeofence ? 'Inside' : 'Outside'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Live Position</CardTitle>
            <CardDescription>
              {firstStation
                ? `Tracking movement to ${firstStation.name}`
                : 'Select a station to view map'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-0">
            <GeoMap station={firstStation || null} driverPosition={position} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
