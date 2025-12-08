import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useStations } from '@/hooks/useStations';
import { useCreateRiderRequest, useRiderRequests } from '@/hooks/useRiderRequests';
import { GeoMap } from '@/shared/ui/GeoMap';
import { toast } from 'sonner';
import { simulateAssignments } from '@/mocks/riderRepo';
import { formatDistanceToNow } from 'date-fns';

const riderSchema = z.object({
  riderId: z.string().min(1, 'Rider ID is required'),
  stationId: z.string().min(1, 'Station is required'),
  destination: z.string().min(1, 'Destination is required'),
  etaMinutes: z.coerce.number().int().min(0, 'ETA must be 0 or greater'),
});

type RiderFormData = z.infer<typeof riderSchema>;

export default function Rider() {
  const [riderId, setRiderId] = useState(localStorage.getItem('lastmile-riderId') || '');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [simulateEnabled, setSimulateEnabled] = useState(false);

  const { data: stations = [], isLoading: stationsLoading } = useStations();
  const { data: requests = [], isLoading: requestsLoading } = useRiderRequests(riderId || null);
  const createRequest = useCreateRiderRequest();

  const selectedStation = stations.find((s) => s.id === selectedStationId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RiderFormData>({
    resolver: zodResolver(riderSchema),
    defaultValues: {
      riderId,
      etaMinutes: 10,
    },
  });

  const watchedStationId = watch('stationId');
  const watchedDestination = watch('destination');

  useEffect(() => {
    if (watchedStationId) {
      setSelectedStationId(watchedStationId);
    }
  }, [watchedStationId]);

  // Simulate assignments
  useEffect(() => {
    if (!simulateEnabled) return;
    const interval = setInterval(() => {
      simulateAssignments();
    }, 5000);
    return () => clearInterval(interval);
  }, [simulateEnabled]);

  const onSubmit = async (data: RiderFormData) => {
    try {
      await createRequest.mutateAsync({
        riderId: data.riderId,
        stationId: data.stationId,
        destination: data.destination,
        etaMinutes: data.etaMinutes,
      });
      localStorage.setItem('lastmile-riderId', data.riderId);
      setRiderId(data.riderId);
      toast.success('Ride request created successfully!');
    } catch (error) {
      toast.error('Failed to create request');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      PENDING: { variant: 'outline', label: 'Pending' },
      ASSIGNED: { variant: 'default', label: 'Assigned' },
      COMPLETED: { variant: 'secondary', label: 'Completed' },
    };
    const config = variants[status] || variants.PENDING;
    return (
      <Badge variant={config.variant} className={
        status === 'ASSIGNED' ? 'bg-success text-success-foreground' :
        status === 'PENDING' ? 'bg-warning/20 text-warning-foreground border-warning' :
        ''
      }>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rider Dashboard</h1>
          <p className="text-muted-foreground">Request rides from metro stations</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Create Ride Request</CardTitle>
            <CardDescription>Enter your details to request a ride</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="riderId">Rider ID</Label>
                <Input
                  id="riderId"
                  placeholder="e.g., RIDER001"
                  {...register('riderId')}
                />
                {errors.riderId && (
                  <p className="text-sm text-destructive">{errors.riderId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stationId">Metro Station</Label>
                <Select
                  onValueChange={(value) => setValue('stationId', value)}
                  disabled={stationsLoading}
                >
                  <SelectTrigger id="stationId">
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stationId && (
                  <p className="text-sm text-destructive">{errors.stationId.message}</p>
                )}
              </div>

              {selectedStation && (
                <div className="space-y-2">
                  <Label>Suggested Nearby Areas</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedStation.nearbyAreas.map((area) => (
                      <Badge
                        key={area}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setValue('destination', area)}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="destination">Destination Area</Label>
                <Input
                  id="destination"
                  placeholder="e.g., Indiranagar"
                  {...register('destination')}
                />
                {errors.destination && (
                  <p className="text-sm text-destructive">{errors.destination.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="etaMinutes">
                  ETA in minutes from now
                  <span className="text-muted-foreground text-sm ml-2">
                    (When will you arrive at station?)
                  </span>
                </Label>
                <Input
                  id="etaMinutes"
                  type="number"
                  min="0"
                  {...register('etaMinutes')}
                />
                {errors.etaMinutes && (
                  <p className="text-sm text-destructive">{errors.etaMinutes.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={createRequest.isPending}>
                {createRequest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Ride
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Station Location</CardTitle>
            <CardDescription>
              {selectedStation
                ? `${selectedStation.name} - 400m geofence`
                : 'Select a station to view map'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] p-0">
            <GeoMap station={selectedStation || null} />
          </CardContent>
        </Card>
      </div>

      {/* My Requests */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Requests</CardTitle>
              <CardDescription>
                {riderId ? `Showing requests for ${riderId}` : 'Enter Rider ID to see requests'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="simulate">Simulate Assignment</Label>
              <Switch
                id="simulate"
                checked={simulateEnabled}
                onCheckedChange={setSimulateEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No requests yet. Create your first ride request above.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const station = stations.find((s) => s.id === request.stationId);
                return (
                  <div
                    key={request.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{request.id}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{station?.name || request.stationId}</span>
                          <span className="mx-1">→</span>
                          <span>{request.destination}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>ETA: {request.etaAbsolute.toLocaleTimeString()}</span>
                          <span className="text-xs">({formatDistanceToNow(request.etaAbsolute, { addSuffix: true })})</span>
                        </div>
                        <div className="text-xs">
                          Updated {formatDistanceToNow(request.updatedAt, { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    {request.status === 'ASSIGNED' && (
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
