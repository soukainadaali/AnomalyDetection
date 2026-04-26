import { Box, Card, CardContent, Typography } from '@mui/material';

const riskColorMap = {
  NONE: '#2e7d32',
  MINR: '#f9a825',
  SERS: '#ef6c00',
  FATL: '#c62828',
};

const riskToPercentMap = {
  NONE: 12.5,
  MINR: 37.5,
  SERS: 62.5,
  FATL: 87.5,
};

function describeRiskLabel(risk) {
  if (!risk) return 'N/A';
  return risk;
}

function RiskGauge({ prediction, riskScore, confidence }) {
  const normalizedRisk = prediction || 'NONE';
  const pointerValue = typeof riskScore === 'number' ? riskScore * 100 : (riskToPercentMap[normalizedRisk] || 0);
  const pointerRotation = -90 + (pointerValue / 100) * 180;
  const color = riskColorMap[normalizedRisk] || '#607d8b';

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Risk Gauge
        </Typography>
        <Box display="flex" justifyContent="center" mt={1}>
          <svg width="260" height="150" viewBox="0 0 260 150" role="img" aria-label="Risk speedometer">
            <path d="M30 130 A100 100 0 0 1 80 43" stroke={riskColorMap.NONE} strokeWidth="16" fill="none" />
            <path d="M80 43 A100 100 0 0 1 130 30" stroke={riskColorMap.MINR} strokeWidth="16" fill="none" />
            <path d="M130 30 A100 100 0 0 1 180 43" stroke={riskColorMap.SERS} strokeWidth="16" fill="none" />
            <path d="M180 43 A100 100 0 0 1 230 130" stroke={riskColorMap.FATL} strokeWidth="16" fill="none" />

            <g transform={`rotate(${pointerRotation} 130 130)`}>
              <line x1="130" y1="130" x2="130" y2="52" stroke={color} strokeWidth="5" />
            </g>
            <circle cx="130" cy="130" r="8" fill={color} />
          </svg>
        </Box>

        <Typography variant="h5" align="center" sx={{ color, fontWeight: 700 }}>
          {describeRiskLabel(prediction)}
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          Confidence: {typeof confidence === 'number' ? `${(confidence * 100).toFixed(1)}%` : 'N/A'}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default RiskGauge;
