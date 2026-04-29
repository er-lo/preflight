import { Paper, Typography, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

export function SectionCard({ title, description, children, sx, ...paperProps }) {
  return (
    <Paper
      variant="outlined"
      elevation={0}
      {...paperProps}
      sx={[
        (theme) => ({
          p: { xs: 2.25, sm: 3 },
          borderRadius: 2,
          width: '100%',
          border: `1px solid ${alpha(theme.palette.divider, 0.85)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.65),
          boxShadow: `0 0 0 1px ${alpha(theme.palette.common.black, 0.2)} inset`,
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {(title || description) && (
        <Box sx={{ mb: 2.5 }}>
          {title ? (
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          ) : null}
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.65 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
      )}
      {children}
    </Paper>
  );
}
