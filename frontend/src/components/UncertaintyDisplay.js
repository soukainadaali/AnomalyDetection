import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';

function UncertaintyDisplay({ uncertaintyInterval }) {
  const labels = Array.isArray(uncertaintyInterval) ? uncertaintyInterval : [];

  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Prediction Uncertainty
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Model is 90% confident the true class lies in this set:
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {labels.length ? (
            labels.map((label) => <Chip key={label} label={label} color="primary" variant="outlined" />)
          ) : (
            <Typography variant="body2">No uncertainty interval returned.</Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default UncertaintyDisplay;
