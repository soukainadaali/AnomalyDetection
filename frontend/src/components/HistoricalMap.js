import { useMemo } from 'react';
import { Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

const severityColors = {
  NONE: '#2e7d32',
  MINR: '#f9a825',
  SERS: '#ef6c00',
  FATL: '#c62828',
};

function createMarkerIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<span style="display:block;width:14px;height:14px;border-radius:999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function parseCoordinates(item) {
  const lat = Number(item.latitude ?? item.lat);
  const lng = Number(item.longitude ?? item.lon ?? item.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

function HistoricalMap({ loading, error, records }) {
  const validRecords = useMemo(
    () =>
      (records || [])
        .map((item) => ({ ...item, coords: parseCoordinates(item) }))
        .filter((item) => Array.isArray(item.coords)),
    [records]
  );

  const center = validRecords.length ? validRecords[0].coords : [39.8283, -98.5795];

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Historical Accidents Map
        </Typography>
        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
          {Object.entries(severityColors).map(([label, color]) => (
            <Stack key={label} direction="row" spacing={0.75} alignItems="center">
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: color,
                }}
              />
              <Typography variant="caption">{label}</Typography>
            </Stack>
          ))}
        </Stack>

        {loading && (
          <Stack alignItems="center" py={2}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {!loading && !error && (
          <div className="map-wrapper">
            <MapContainer center={center} zoom={4} scrollWheelZoom className="leaflet-map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {validRecords.map((record) => {
                const severity = (record.severity || 'NONE').toUpperCase();
                const icon = createMarkerIcon(severityColors[severity] || '#455a64');

                return (
                  <Marker key={record._id || `${record.coords[0]}-${record.coords[1]}`} position={record.coords} icon={icon}>
                    <Popup>
                      <Typography variant="subtitle2">{record.departure_airport || 'Unknown airport'}</Typography>
                      <Typography variant="body2">Severity: {severity}</Typography>
                      <Typography variant="body2">
                        Date: {record.date ? new Date(record.date).toLocaleDateString() : 'Unknown'}
                      </Typography>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HistoricalMap;
