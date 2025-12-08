import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, MapPin, CheckCircle2, Loader2, Users, Train, Navigation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { GeoMap } from '@/shared/ui/GeoMap';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Notifications } from '@/components/Notifications';
import { useNotificationsStore } from '@/stores/useNotificationsStore';

const riderSchema = z.object({
    riderId: z.string().min(1, 'Rider ID is required'),
    stationId: z.string().min(1, 'Station is required'),
    destination: z.string().min(1, 'Destination is required'),
    etaMinutes: z.number().int().min(0, 'ETA must be 0 or greater'),
});

type RiderFormData = z.infer<typeof riderSchema>;

interface Station {
    id: string;
    name: string;
    location: { lat: number; lon: number };
    nearbyAreas: string[];
}

export const RiderDashboard = () => {
    const { user, logout } = useAuth();
    const [stations, setStations] = useState<Station[]>([]);
    const [stationsLoading, setStationsLoading] = useState(true);
    const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
    const [simulateEnabled, setSimulateEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);

    // Fetch my requests
    const { notifications } = useNotificationsStore();
    const lastNotificationIdRef = useRef<string | null>(null);

    const refreshRiderData = async () => {
        if (!user?.id) return;
        try {
            const response = await api.getRiderRequests(user.id);
            const mapped = response.data.map((r: any) => ({
                ...r,
                etaAbsolute: new Date(r.etaUnix * 1000),
                updatedAt: new Date() // Backend doesn't send this yet
            }));
            setRequests(mapped);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        }
    };

    // Initial fetch
    useEffect(() => {
        refreshRiderData();
    }, [user?.id]);

    // Refresh when notifications change (e.g. match assigned)
    useEffect(() => {
        if (notifications.length === 0) return;
        const newest = notifications[0];

        // Only refresh if we have a new notification
        if (newest.id !== lastNotificationIdRef.current) {
            lastNotificationIdRef.current = newest.id;
            refreshRiderData();
        }
    }, [notifications]);

    useEffect(() => {
        const fetchStations = async () => {
            try {
                const response = await api.getStations();
                const mappedStations = response.data.map((station: any) => ({
                    ...station,
                    nearbyAreas: station.nearbyAreas || []
                }));
                setStations(mappedStations);
            } catch (error) {
                console.error('Failed to fetch stations', error);
                toast.error('Failed to load stations');
            } finally {
                setStationsLoading(false);
            }
        };
        fetchStations();
    }, []);

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
            riderId: user?.id || '',
            etaMinutes: 10,
        },
    });

    const watchedStationId = watch('stationId');

    useEffect(() => {
        if (watchedStationId) {
            setSelectedStationId(watchedStationId);
        }
    }, [watchedStationId]);

    // Update riderId if user loads late
    useEffect(() => {
        if (user?.id) {
            setValue('riderId', user.id);
        }
    }, [user, setValue]);

    const activeRequest = requests.find(r => ['PENDING', 'ASSIGNED'].includes(r.status));

    const onSubmit = async (data: RiderFormData) => {
        setIsSubmitting(true);
        try {
            const response = await api.createRiderRequest({
                rider_id: data.riderId,
                station_id: data.stationId,
                dest_area: data.destination,
                eta_minutes: data.etaMinutes,
            });

            // Add to local requests list for immediate feedback
            const newRequest = {
                id: response.data.id || 'REQ-' + Date.now(),
                stationId: data.stationId,
                destination: data.destination,
                etaAbsolute: new Date(Date.now() + data.etaMinutes * 60000),
                updatedAt: new Date(),
                status: 'PENDING'
            };
            setRequests(prev => [newRequest, ...prev]);

            toast.success('Ride request created successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; label: string }> = {
            PENDING: { variant: 'warning', label: 'Pending' },
            ASSIGNED: { variant: 'accent', label: 'Assigned' },
            COMPLETED: { variant: 'secondary', label: 'Completed' },
        };
        const config = variants[status] || variants.PENDING;
        return (
            <Badge variant={config.variant}>
                {config.label}
            </Badge>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-[hsl(82,72%,40%)] flex items-center justify-center shadow-lime-glow">
                            <Users className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold font-display text-foreground">Rider Dashboard</h1>
                    </div>
                    <p className="text-muted-foreground">Request rides from metro stations</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-muted-foreground hidden sm:inline">Welcome, <span className="font-semibold text-foreground">{user?.name}</span></span>
                    <Notifications />
                    <Button variant="destructive" onClick={logout}>Logout</Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Request Form */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Train className="h-5 w-5 text-primary" />
                            <CardTitle>Create Ride Request</CardTitle>
                        </div>
                        <CardDescription>Enter your details to request a ride</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="riderId">Rider ID</Label>
                                <Input
                                    id="riderId"
                                    {...register('riderId')}
                                    readOnly // Make read-only as it comes from auth
                                    className="bg-muted"
                                />
                                {errors.riderId && (
                                    <p className="text-sm text-destructive">{errors.riderId.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stationId">Metro Station</Label>
                                <Select
                                    onValueChange={(value) => setValue('stationId', value)}
                                    disabled={stationsLoading || !!activeRequest}
                                >
                                    <SelectTrigger id="stationId" className="h-11">
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

                            {selectedStation && selectedStation.nearbyAreas && (
                                <div className="space-y-2">
                                    <Label>Suggested Nearby Areas</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStation.nearbyAreas.map((area) => (
                                            <Badge
                                                key={area}
                                                variant="secondary"
                                                className={`cursor-pointer transition-all duration-200 hover:bg-primary hover:text-primary-foreground ${activeRequest ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={() => !activeRequest && setValue('destination', area)}
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
                                    disabled={!!activeRequest}
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
                                    {...register('etaMinutes', { valueAsNumber: true })}
                                    disabled={!!activeRequest}
                                />
                                {errors.etaMinutes && (
                                    <p className="text-sm text-destructive">{errors.etaMinutes.message}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" variant="accent" disabled={isSubmitting || !!activeRequest}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {activeRequest ? 'Ride in Progress' : 'Request Ride'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Map */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-accent" />
                            <CardTitle>Station Location</CardTitle>
                        </div>
                        <CardDescription>
                            {selectedStation
                                ? `${selectedStation.name} - 400m geofence`
                                : 'Select a station to view map'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] p-0 overflow-hidden rounded-b-2xl">
                        <GeoMap stations={selectedStation ? [{
                            id: selectedStation.id,
                            name: selectedStation.name,
                            lat: selectedStation.location.lat,
                            lon: selectedStation.location.lon,
                            nearbyAreas: selectedStation.nearbyAreas
                        }] : []} />
                    </CardContent>
                </Card>
            </div>

            {/* My Requests */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle>My Requests</CardTitle>
                                <CardDescription>
                                    Showing recent requests
                                </CardDescription>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-xl">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p>No requests yet. Create your first ride request above.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((request) => {
                                const station = stations.find((s) => s.id === request.stationId);
                                return (
                                    <div
                                        key={request.id}
                                        className="flex items-start gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-all duration-200"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground">{request.id}</span>
                                                {getStatusBadge(request.status)}
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                                    <span>{station?.name || request.stationId}</span>
                                                    <span className="text-muted-foreground/50">→</span>
                                                    <span>{request.destination}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5 text-secondary" />
                                                    <span>ETA: {request.etaAbsolute.toLocaleTimeString()}</span>
                                                    <span className="text-xs text-muted-foreground/70">({formatDistanceToNow(request.etaAbsolute, { addSuffix: true })})</span>
                                                </div>
                                            </div>
                                        </div>
                                        {request.status === 'ASSIGNED' && (
                                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-5 w-5 text-accent" />
                                            </div>
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
