import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Widget } from '@/models/dashboard.model';
import { useWidgetData } from './useWidgetData';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon (Leaflet CSS paths break with bundlers)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapWidgetProps {
  widget: Widget;
}

interface MarkerData {
  lat: number;
  lng: number;
  label: string;
}

export default function MapWidget({ widget }: MapWidgetProps) {
  const { data, loading } = useWidgetData(widget.config?.datasources, widget.config?.timewindow);

  const { markers, center, zoom } = useMemo(() => {
    const settings = widget.config?.settings || {};
    const latKey = (settings.latitudeKey as string) || 'latitude';
    const lngKey = (settings.longitudeKey as string) || 'longitude';
    const labelKey = (settings.labelKey as string) || 'label';
    const defaultLat = (settings.defaultCenterLatitude as number) || 0;
    const defaultLng = (settings.defaultCenterLongitude as number) || 0;
    const defaultZoom = (settings.defaultZoomLevel as number) || 10;

    const latEntry = data.find((d) => d.key === latKey);
    const lngEntry = data.find((d) => d.key === lngKey);
    const labelEntry = data.find((d) => d.key === labelKey);

    const m: MarkerData[] = [];

    if (latEntry && lngEntry) {
      const latVal = latEntry.values[latEntry.values.length - 1];
      const lngVal = lngEntry.values[lngEntry.values.length - 1];
      if (latVal && lngVal) {
        const lat = Number(latVal.value);
        const lng = Number(lngVal.value);
        if (!isNaN(lat) && !isNaN(lng)) {
          const lbl =
            labelEntry?.values[labelEntry.values.length - 1]?.value || '';
          m.push({ lat, lng, label: lbl });
        }
      }
    }

    const c: [number, number] =
      m.length > 0 ? [m[0].lat, m[0].lng] : [defaultLat, defaultLng];
    return { markers: m, center: c, zoom: defaultZoom };
  }, [data, widget.config?.settings]);

  if (loading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography color="text.secondary">No location data</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 200 }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m, idx) => (
          <Marker key={idx} position={[m.lat, m.lng]} icon={defaultIcon}>
            {m.label && <Popup>{m.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}
