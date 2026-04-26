import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Select,
  CircularProgress,
} from '@mui/material';

const AIRCRAFT_TYPES = [
  'Single Engine',
  'Multi Engine',
  'Jet',
  'Helicopter',
  'Glider',
];

const initialForm = {
  departureAirport: '',
  date: '',
  aircraftType: '',
  pilotHours: '',
  temperature: '',
  windSpeed: '',
  visibility: '',
  fog: false,
  rain: false,
};

function FlightInputForm({ onSubmitPrediction, loading }) {
  const [formState, setFormState] = useState(initialForm);
  const airportCode = formState.departureAirport.trim().toUpperCase();
  const airportCodeValid = /^[A-Z]{3,4}$/.test(airportCode);

  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const buildWeatherConditions = () => {
    const parts = [
      `Temp:${formState.temperature || 'NA'}C`,
      `Wind:${formState.windSpeed || 'NA'}kts`,
      `Vis:${formState.visibility || 'NA'}km`,
      formState.fog ? 'Fog' : 'NoFog',
      formState.rain ? 'Rain' : 'NoRain',
    ];
    return parts.join(', ');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!airportCodeValid) return;
    onSubmitPrediction({
      departure_airport: airportCode,
      date: new Date(formState.date).toISOString(),
      aircraft_type: formState.aircraftType,
      pilot_hours: Number(formState.pilotHours),
      weather_conditions: buildWeatherConditions(),
    });
  };

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Flight Risk Input
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter flight details to generate safety risk prediction.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Departure Airport"
              value={formState.departureAirport}
              onChange={updateField('departureAirport')}
              required
              placeholder="e.g. KJFK"
              inputProps={{ maxLength: 8 }}
              error={Boolean(formState.departureAirport) && !airportCodeValid}
              helperText={
                !formState.departureAirport || airportCodeValid
                  ? 'Use IATA/ICAO style code, e.g. JFK or KJFK'
                  : 'Enter 3-4 letters only.'
              }
              fullWidth
            />
            <TextField
              type="date"
              placeholder="Flight Date"
              value={formState.date}
              onChange={updateField('date')}
              required
              inputProps={{ 'aria-label': 'Flight date' }}
              fullWidth
            />
            <FormControl fullWidth required>
              <InputLabel id="aircraft-type-label">Aircraft Type</InputLabel>
              <Select
                labelId="aircraft-type-label"
                label="Aircraft Type"
                value={formState.aircraftType}
                onChange={updateField('aircraftType')}
              >
                {AIRCRAFT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Pilot Hours"
              type="number"
              value={formState.pilotHours}
              onChange={updateField('pilotHours')}
              required
              inputProps={{ min: 0 }}
              fullWidth
            />
            <TextField
              label="Temperature (C)"
              type="number"
              value={formState.temperature}
              onChange={updateField('temperature')}
              fullWidth
            />
            <TextField
              label="Wind Speed (knots)"
              type="number"
              value={formState.windSpeed}
              onChange={updateField('windSpeed')}
              fullWidth
            />
            <TextField
              label="Visibility (km)"
              type="number"
              value={formState.visibility}
              onChange={updateField('visibility')}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={<Checkbox checked={formState.fog} onChange={updateField('fog')} />}
                label="Fog"
              />
              <FormControlLabel
                control={<Checkbox checked={formState.rain} onChange={updateField('rain')} />}
                label="Rain"
              />
            </Stack>

            <Button type="submit" variant="contained" disabled={loading || !airportCodeValid}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Predict Risk'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

export default FlightInputForm;
