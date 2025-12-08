import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Play, Square, Navigation, Route, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDriverSimulator } from '@/hooks/useDriverSimulator';
import { GeoMap } from '@/shared/ui/GeoMap';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Notifications } from '@/components/Notifications';
import { useNotificationsStore } from '@/stores/useNotificationsStore';

const driverSchema = z.object({
    driverId: z.string().min(1, 'Driver ID is required'),
    routeId: z.string().optional(),
    destinationArea: z.string().min(1, 'Destination area is required'),
    seatsTotal: z.number().int().min(1, 'Must have at least 1 seat'),
    seatsFree: z.number().int().min(0),
    stationIds: z.array(z.string()).min(1, 'Select at least one station'),
    minutesBeforeEtaMatch: z.number().int().min(0, 'Must be 0 or greater'),
}).refine((data) => data.seatsFree <= data.seatsTotal, {
    message: 'Free seats cannot exceed total seats',
    path: ['seatsFree'],
});

type DriverFormData = z.infer<typeof driverSchema>;

interface Station {
    id: string;
    name: string;
    location: { lat: number; lon: number };
    nearbyAreas: string[];
}

export const DriverDashboard = () => {
    const { user, logout } = useAuth();
    const [stations, setStations] = useState<Station[]>([]);
    const [selectedStations, setSelectedStations] = useState<string[]>([]);
    const [existingRoute, setExistingRoute] = useState<DriverFormData | null>(null);
    const [activeTripId, setActiveTripId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { notifications } = useNotificationsStore();
    const lastNotificationIdRef = useRef<string | null>(null);

    const refreshDashboardData = async () => {
        if (!user?.id) return;
        try {
            // Fetch active route
            const routeRes = await api.getActiveRoute(user.id);
            if (routeRes.data) {
                const r = routeRes.data;
                setExistingRoute({
                    driverId: r.driver_id,
                    routeId: r.id,
                    destinationArea: r.dest_area,
                    seatsTotal: r.seats_total,
                    seatsFree: r.seats_free,
                    stationIds: r.stations.map((s: any) => s.station_id),
                    minutesBeforeEtaMatch: r.stations[0]?.minutes_before_eta_match || 10
                });
                setSelectedStations(r.stations.map((s: any) => s.station_id));
            } else {
                // If no active route, clear it (important for when route is deleted/completed)
                setExistingRoute(null);
            }

            // Fetch active trip
            const tripRes = await api.getActiveTrip(user.id);
            if (tripRes.data) {
                setActiveTripId(tripRes.data.id);
            } else {
                setActiveTripId(null);
            }
        } catch (error) {
            console.error("Failed to fetch initial data", error);
        }
    };

    // Initial fetch
    useEffect(() => {
        refreshDashboardData();
    }, [user?.id]);

    // Refresh when notifications change (e.g. new match)
    useEffect(() => {
        if (notifications.length === 0) return;
        const newest = notifications[0];

        // Only refresh if we have a new notification
        if (newest.id !== lastNotificationIdRef.current) {
            lastNotificationIdRef.current = newest.id;
            refreshDashboardData();
        }
    }, [notifications]);

    useEffect(() => {
        const fetchStations = async () => {
            try {
                const response = await api.getStations();
                // Map nearby_areas to nearbyAreas
                const mappedStations = response.data.map((station: any) => ({
                    ...station,
                    nearbyAreas: station.nearbyAreas || []
                }));
                setStations(mappedStations);
            } catch (error) {
                console.error('Failed to fetch stations', error);
            }
        };
        fetchStations();
    }, []);

    // Map selected station IDs to full station objects for the simulator
    const simulatorStations = selectedStations
        .map(id => stations.find(s => s.id === id))
        .filter((s): s is Station => !!s)
        .map(s => ({
            ...s,
            lat: s.location.lat,
            lon: s.location.lon,
            nearbyAreas: s.nearbyAreas
        }));

    const { isRunning, position, distanceToStation, etaMinutes, insideGeofence, start, stop, currentTargetIndex } =
        useDriverSimulator(simulatorStations);

    const currentTargetStation = currentTargetIndex >= 0 ? simulatorStations[currentTargetIndex] : null;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<DriverFormData>({
        resolver: zodResolver(driverSchema),
        defaultValues: {
            driverId: user?.id || '',
            seatsTotal: 4,
            seatsFree: 4,
            minutesBeforeEtaMatch: 10,
            stationIds: [],
        },
    });

    // Update driverId if user loads late
    useEffect(() => {
        if (user?.id) {
            setValue('driverId', user.id);
        }
    }, [user, setValue]);

    const watchedSeatsTotal = watch('seatsTotal');

    const lastGeofenceStationIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (insideGeofence && isRunning && currentTargetStation) {
            if (lastGeofenceStationIdRef.current !== currentTargetStation.id) {
                toast.success(`Entered geofence for ${currentTargetStation.name}—matching would trigger now (mock)`, {
                    icon: <Navigation className="h-4 w-4" />,
                });
                lastGeofenceStationIdRef.current = currentTargetStation.id;
            }
        }

        if (!insideGeofence) {
            lastGeofenceStationIdRef.current = null;
        }
    }, [insideGeofence, isRunning, currentTargetStation?.id]);

    // Send location updates when position changes
    useEffect(() => {
        if (isRunning && position && existingRoute && user?.id) {
            api.updateDriverLocation({
                driver_id: user.id,
                route_id: existingRoute.routeId || '',
                lat: position.lat,
                lon: position.lon
            }).catch(err => console.error("Failed to update location", err));
        }
    }, [isRunning, position, existingRoute, user]);

    const onSubmit = async (data: DriverFormData) => {
        setIsSubmitting(true);
        try {
            const response = await api.registerDriverRoute({
                driver_id: data.driverId,
                route_id: data.routeId, // Optional
                dest_area: data.destinationArea,
                seats_total: data.seatsTotal,
                seats_free: data.seatsFree, // Backend might not use this yet but good to send
                stations: data.stationIds,
                // minutes_before_eta_match: data.minutesBeforeEtaMatch // Backend might not support this yet
            });

            // Capture the route ID from the backend response if available
            const registeredRouteId = response.data.routeId || response.data.id || data.routeId;

            setExistingRoute({
                ...data,
                routeId: registeredRouteId
            });
            toast.success('Route registered successfully!');
            // alert('Route registered successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save route');
            // alert('Failed to save route');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteTrip = async () => {
        if (!activeTripId) return;
        try {
            await api.completeTrip(activeTripId);
            toast.success("Trip completed successfully!");
            setExistingRoute(null);
            setActiveTripId(null);
            setSelectedStations([]);
            // Reset form
            setValue('stationIds', []);
            setValue('destinationArea', '');
        } catch (error) {
            console.error("Failed to complete trip", error);
            toast.error("Failed to complete trip");
        }
    };

    const handleDeleteRoute = async () => {
        if (!existingRoute?.routeId) return;
        try {
            await api.deleteRoute(existingRoute.routeId);
            toast.success("Destination reached! Route deleted.");
            setExistingRoute(null);
            setSelectedStations([]);
            // Reset form
            setValue('stationIds', []);
            setValue('destinationArea', '');
        } catch (error) {
            console.error("Failed to delete route", error);
            toast.error("Failed to delete route");
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
        <div className="max-w-7xl mx-auto space-y-6 p-6 md:p-8 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-urban">
                            <Car className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold font-display text-foreground">Driver Dashboard</h1>
                    </div>
                    <p className="text-muted-foreground">Manage your route and offer rides</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-muted-foreground hidden sm:inline">Welcome, <span className="font-semibold text-foreground">{user?.name}</span></span>
                    <Notifications />
                    <Button variant="destructive" onClick={logout}>Logout</Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Route Form */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Route className="h-5 w-5 text-primary" />
                            <CardTitle>Register / Update Route</CardTitle>
                        </div>
                        <CardDescription>Set up your route and availability</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {existingRoute && (
                                <div className="bg-warning/10 p-4 rounded-xl border border-warning/30 mb-4 text-sm text-warning-foreground flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0"></div>
                                    <span>You already have an active route. Complete your current trip or route to create a new one.</span>
                                </div>
                            )}
                            <fieldset disabled={!!existingRoute} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="driverId">Driver ID</Label>
                                        <Input
                                            id="driverId"
                                            {...register('driverId')}
                                            readOnly
                                            className="bg-muted"
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
                                            {...register('seatsTotal', { valueAsNumber: true })}
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
                                            {...register('seatsFree', { valueAsNumber: true })}
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
                                                className={`cursor-pointer transition-all duration-200 ${selectedStations.includes(station.id) ? 'bg-primary text-primary-foreground shadow-urban' : 'hover:bg-muted'}`}
                                                onClick={() => !existingRoute && toggleStation(station.id)}
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
                                        {...register('minutesBeforeEtaMatch', { valueAsNumber: true })}
                                    />
                                    {errors.minutesBeforeEtaMatch && (
                                        <p className="text-sm text-destructive">
                                            {errors.minutesBeforeEtaMatch.message}
                                        </p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" variant="urban-gradient" disabled={isSubmitting || !!existingRoute}>
                                    {isSubmitting ? 'Saving...' : 'Save Route'}
                                </Button>
                            </fieldset>
                        </form>
                    </CardContent>
                </Card>

                {/* Active Route Summary */}
                {existingRoute && (
                    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Route className="h-4 w-4 text-primary" />
                                </div>
                                <CardTitle>Active Route</CardTitle>
                            </div>
                            <CardDescription>Your current route configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Driver ID</span>
                                    <p className="font-semibold text-foreground">{existingRoute.driverId}</p>
                                </div>
                                {existingRoute.routeId && (
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Route ID</span>
                                        <p className="font-semibold text-foreground">{existingRoute.routeId}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Destination</span>
                                    <p className="font-semibold text-foreground">{existingRoute.destinationArea}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Seats</span>
                                    <p className="font-semibold text-foreground">
                                        <span className="text-accent">{existingRoute.seatsFree}</span> / {existingRoute.seatsTotal} available
                                    </p>
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground text-sm">Stations</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {existingRoute.stationIds.map((id) => {
                                        const station = stations.find((s) => s.id === id);
                                        return (
                                            <Badge key={id} variant="secondary" className="bg-primary/10 text-primary border-0">
                                                {station?.name || id}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                            {!activeTripId && (
                                <Button
                                    onClick={handleDeleteRoute}
                                    variant="outline"
                                    className="w-full mt-2 border-primary/30 text-primary hover:bg-primary/10"
                                >
                                    Destination Reached
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Active Trip Actions */}
                {activeTripId && (
                    <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                                    <Users className="h-4 w-4 text-accent" />
                                </div>
                                <CardTitle className="text-accent-foreground">Active Trip</CardTitle>
                            </div>
                            <CardDescription>You have an ongoing trip with riders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleCompleteTrip}
                                variant="accent"
                                className="w-full"
                            >
                                Complete Trip
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Simulator */}
            <div className="grid lg:grid-cols-2 gap-6 mb-12">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                                <Navigation className="h-4 w-4 text-secondary" />
                            </div>
                            <CardTitle>Driver Movement Simulator</CardTitle>
                        </div>
                        <CardDescription>
                            Simulate driving through your selected stations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <Button
                                onClick={start}
                                disabled={isRunning || simulatorStations.length === 0}
                                className="flex-1"
                                variant="urban-gradient"
                            >
                                <Play className="mr-2 h-4 w-4" />
                                Start Simulation
                            </Button>
                            <Button onClick={stop} disabled={!isRunning} variant="destructive" className="flex-1">
                                <Square className="mr-2 h-4 w-4" />
                                Stop
                            </Button>
                        </div>

                        {simulatorStations.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-xl">
                                Select at least one station in your route to enable simulation
                            </p>
                        )}

                        {position && (
                            <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Current Position</span>
                                        <p className="font-mono text-xs text-foreground">
                                            {position.lat.toFixed(6)}, {position.lon.toFixed(6)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Target Station</span>
                                        <p className="font-semibold text-foreground">
                                            {currentTargetStation?.name || 'None'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Distance to Station</span>
                                        <p className="font-semibold text-foreground">
                                            {distanceToStation ? `${Math.round(distanceToStation)}m` : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">ETA</span>
                                        <p className="font-semibold text-foreground">{etaMinutes ? `${etaMinutes} min` : 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-muted-foreground">Geofence Status</span>
                                        <Badge variant={insideGeofence ? 'accent' : 'secondary'}>
                                            {insideGeofence ? 'Inside' : 'Outside'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Map */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-accent" />
                            </div>
                            <CardTitle>Live Position</CardTitle>
                        </div>
                        <CardDescription>
                            {simulatorStations.length > 0
                                ? `Tracking movement across ${simulatorStations.length} stations`
                                : 'Select stations to view map'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] p-0 overflow-hidden rounded-b-2xl">
                        <GeoMap stations={simulatorStations} driverPosition={position} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
