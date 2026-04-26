import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import FlightInputForm from './components/FlightInputForm';
import RiskGauge from './components/RiskGauge';
import UncertaintyDisplay from './components/UncertaintyDisplay';
import ExplanationPanel from './components/ExplanationPanel';
import HistoricalMap from './components/HistoricalMap';
import { explainPrediction, getHistoricalAccidents, predictRisk } from './api';
import './App.css';

function App() {
  const [historicalFilters, setHistoricalFilters] = useState({
    startDate: '',
    endDate: '',
    severity: '',
    state: '',
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [topFeatures, setTopFeatures] = useState([]);
  const [historicalRecords, setHistoricalRecords] = useState([]);
  const [formPayload, setFormPayload] = useState(null);

  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  const [predictError, setPredictError] = useState('');
  const [explainError, setExplainError] = useState('');
  const [historicalError, setHistoricalError] = useState('');

  const fetchHistorical = async (filters = historicalFilters) => {
    setLoadingHistorical(true);
    setHistoricalError('');
    try {
      const requestFilters = {
        start_date: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
        end_date: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
        severity: filters.severity || undefined,
        state: filters.state?.trim().toUpperCase() || undefined,
      };
      const data = await getHistoricalAccidents(requestFilters);
      setHistoricalRecords(data.results || []);
    } catch (error) {
      setHistoricalError(error.message || 'Unable to fetch historical accidents.');
    } finally {
      setLoadingHistorical(false);
    }
  };

  const fetchExplanation = async (payload) => {
    setLoadingExplanation(true);
    setExplainError('');
    try {
      const data = await explainPrediction(payload);
      setTopFeatures(data.top_feature_contributions || []);
    } catch (error) {
      setTopFeatures([]);
      setExplainError(error.message || 'Unable to generate explanation.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handlePrediction = async (payload) => {
    setFormPayload(payload);
    setLoadingPrediction(true);
    setPredictError('');

    try {
      const data = await predictRisk(payload);
      setPredictionResult(data);
      fetchExplanation(payload);
      fetchHistorical(historicalFilters);
    } catch (error) {
      setPredictionResult(null);
      setTopFeatures([]);
      setPredictError(error.message || 'Unable to generate prediction.');
    } finally {
      setLoadingPrediction(false);
    }
  };

  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setHistoricalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchHistorical(historicalFilters);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Aviation Safety Risk Predictor
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Predict operational risk, inspect uncertainty, and review historical severity patterns.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 360px) 1fr' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        <Box>
          <FlightInputForm onSubmitPrediction={handlePrediction} loading={loadingPrediction} />
          {predictError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {predictError}
            </Alert>
          )}
        </Box>

        <Box>
          <Stack spacing={2}>
            <RiskGauge
              prediction={predictionResult?.prediction}
              riskScore={predictionResult?.risk_score}
              confidence={predictionResult?.confidence}
            />
            <UncertaintyDisplay uncertaintyInterval={predictionResult?.uncertainty_interval} />
            <ExplanationPanel
              loading={loadingExplanation}
              error={explainError}
              topFeatureContributions={topFeatures}
              requestPayload={formPayload}
            />
            <Box
              sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                backgroundColor: 'background.paper',
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Historical Filters
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr auto' },
                  gap: 1.5,
                  alignItems: 'center',
                }}
              >
                <TextField
                  size="small"
                  type="date"
                  placeholder="Start Date"
                  value={historicalFilters.startDate}
                  onChange={handleFilterChange('startDate')}
                  inputProps={{ 'aria-label': 'Start date' }}
                />
                <TextField
                  size="small"
                  type="date"
                  placeholder="End Date"
                  value={historicalFilters.endDate}
                  onChange={handleFilterChange('endDate')}
                  inputProps={{ 'aria-label': 'End date' }}
                />
                <FormControl size="small">
                  <InputLabel id="severity-filter-label">Severity</InputLabel>
                  <Select
                    labelId="severity-filter-label"
                    label="Severity"
                    value={historicalFilters.severity}
                    onChange={handleFilterChange('severity')}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="NONE">NONE</MenuItem>
                    <MenuItem value="MINR">MINR</MenuItem>
                    <MenuItem value="SERS">SERS</MenuItem>
                    <MenuItem value="FATL">FATL</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="State"
                  placeholder="e.g. CA"
                  value={historicalFilters.state}
                  onChange={handleFilterChange('state')}
                  inputProps={{ maxLength: 2 }}
                />
                <Button variant="outlined" onClick={handleApplyFilters} disabled={loadingHistorical}>
                  Apply
                </Button>
              </Box>
            </Box>
            <HistoricalMap loading={loadingHistorical} error={historicalError} records={historicalRecords} />
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}

export default App;
