import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Trash2, MapPin, Train, Navigation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useStations, useUpsertStation, useDeleteStation } from '@/hooks/useStations';
import { GeoMap } from '@/shared/ui/GeoMap';
import { Station } from '@/lib/types';
import { toast } from 'sonner';

const stationSchema = z.object({
  id: z.string().min(1, 'Station ID is required').regex(/^[A-Z_]+$/, 'Use uppercase letters and underscores only'),
  name: z.string().min(1, 'Station name is required'),
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  nearbyAreas: z.string().min(1, 'Enter at least one nearby area'),
});

type StationFormData = z.infer<typeof stationSchema>;

export default function Stations() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: stations = [] } = useStations();
  const upsertStation = useUpsertStation();
  const deleteStation = useDeleteStation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StationFormData>({
    resolver: zodResolver(stationSchema),
  });

  const openEditSheet = (station: Station | null) => {
    setEditingStation(station);
    if (station) {
      setValue('id', station.id);
      setValue('name', station.name);
      setValue('lat', station.lat);
      setValue('lon', station.lon);
      setValue('nearbyAreas', station.nearbyAreas.join(', '));
    } else {
      reset({
        id: '',
        name: '',
        lat: 12.9716,
        lon: 77.5946,
        nearbyAreas: '',
      });
    }
    setSheetOpen(true);
  };

  const onSubmit = async (data: StationFormData) => {
    try {
      const station: Station = {
        id: data.id,
        name: data.name,
        lat: data.lat,
        lon: data.lon,
        nearbyAreas: data.nearbyAreas
          .split(',')
          .map((area) => area.trim())
          .filter((area) => area.length > 0),
      };
      await upsertStation.mutateAsync(station);
      toast.success(editingStation ? 'Station updated!' : 'Station created!');
      setSheetOpen(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save station');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this station?')) return;
    try {
      await deleteStation.mutateAsync(id);
      toast.success('Station deleted');
      if (selectedStation?.id === id) {
        setSelectedStation(null);
      }
    } catch (error) {
      toast.error('Failed to delete station');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-[hsl(240,50%,45%)] flex items-center justify-center shadow-urban">
              <Train className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-display">Stations Admin</h1>
          </div>
          <p className="text-muted-foreground">Manage metro stations and their locations</p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => openEditSheet(null)} variant="accent">
              <Plus className="mr-2 h-4 w-4" />
              Add Station
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-display">{editingStation ? 'Edit Station' : 'Add New Station'}</SheetTitle>
              <SheetDescription>
                {editingStation ? 'Update station details' : 'Create a new metro station'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="id">Station ID</Label>
                <Input
                  id="id"
                  placeholder="e.g., MG_ROAD"
                  disabled={!!editingStation}
                  {...register('id')}
                />
                {errors.id && <p className="text-sm text-destructive">{errors.id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Station Name</Label>
                <Input id="name" placeholder="e.g., MG Road Metro" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    placeholder="12.9716"
                    {...register('lat')}
                  />
                  {errors.lat && <p className="text-sm text-destructive">{errors.lat.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lon">Longitude</Label>
                  <Input
                    id="lon"
                    type="number"
                    step="any"
                    placeholder="77.5946"
                    {...register('lon')}
                  />
                  {errors.lon && <p className="text-sm text-destructive">{errors.lon.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nearbyAreas">
                  Nearby Areas
                  <span className="text-muted-foreground text-sm ml-2">(comma-separated)</span>
                </Label>
                <Input
                  id="nearbyAreas"
                  placeholder="e.g., Indiranagar, Domlur, Ulsoor"
                  {...register('nearbyAreas')}
                />
                {errors.nearbyAreas && (
                  <p className="text-sm text-destructive">{errors.nearbyAreas.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" variant="urban-gradient" disabled={upsertStation.isPending}>
                {upsertStation.isPending ? 'Saving...' : editingStation ? 'Update Station' : 'Create Station'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Stations List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>All Stations</CardTitle>
            </div>
            <CardDescription>Click a station to view on map</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stations.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 bg-muted/30 rounded-xl">
                  <Train className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No stations yet. Add your first station.</p>
                </div>
              ) : (
                stations.map((station) => (
                  <div
                    key={station.id}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 ${selectedStation?.id === station.id
                        ? 'border-primary bg-primary/5 shadow-urban'
                        : 'hover:bg-muted/50 hover:border-primary/30'
                      }`}
                    onClick={() => setSelectedStation(station)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className={`h-4 w-4 ${selectedStation?.id === station.id ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="font-semibold">{station.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono mb-2">
                          {station.id}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {station.lat.toFixed(4)}, {station.lon.toFixed(4)}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {station.nearbyAreas.map((area) => (
                            <Badge key={area} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditSheet(station);
                          }}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(station.id);
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
                : 'Select a station to view location'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[500px] p-0 overflow-hidden rounded-b-2xl">
            <GeoMap station={selectedStation} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
