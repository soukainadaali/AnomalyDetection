import { Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';

const positiveColor = '#c62828';
const negativeColor = '#2e7d32';

function ExplanationBar({ item, maxAbs }) {
  const width = maxAbs > 0 ? Math.max(4, (Math.abs(item.shap_value) / maxAbs) * 100) : 0;
  const barColor = item.shap_value >= 0 ? positiveColor : negativeColor;

  return (
    <Stack spacing={0.5}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {item.feature}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.shap_value.toFixed(4)}
        </Typography>
      </Stack>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${width}%`, backgroundColor: barColor }} />
      </div>
    </Stack>
  );
}

function ExplanationPanel({ loading, error, topFeatureContributions }) {
  const items = Array.isArray(topFeatureContributions) ? topFeatureContributions : [];
  const maxAbs = items.length ? Math.max(...items.map((entry) => Math.abs(entry.shap_value))) : 1;

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          SHAP Explanation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Top 10 feature contributions for the current prediction.
        </Typography>

        {loading && (
          <Stack alignItems="center" py={3}>
            <CircularProgress />
          </Stack>
        )}

        {!loading && error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {!loading && !error && !items.length && (
          <Typography variant="body2">No explanation available yet.</Typography>
        )}

        {!loading && !error && items.length > 0 && (
          <Stack spacing={1.5}>
            {items.map((item) => (
              <ExplanationBar key={item.feature} item={item} maxAbs={maxAbs} />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default ExplanationPanel;
