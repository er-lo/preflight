import { Box, Typography } from '@mui/material';

/**
 * Consistent tool page layout: hero title, optional subtitle, content area.
 */
export function PageShell({ title, subtitle, eyebrow = 'Tool', children, maxContentWidth = 880 }) {
  return (
    <Box
      component="article"
      sx={{
        position: 'relative',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2.5, sm: 3.5, md: 4 },
        maxWidth: maxContentWidth + 160,
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: { xs: -24, sm: -40 },
          right: { xs: '-8%', sm: '5%' },
          width: { xs: 200, sm: 320 },
          height: { xs: 200, sm: 280 },
          borderRadius: '50%',
          filter: 'blur(2px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 1, mb: { xs: 3, sm: 4 } }}>
        <Typography
          variant="overline"
          sx={{
            color: 'primary.light',
            letterSpacing: '0.18em',
            fontWeight: 700,
            fontSize: '0.7rem',
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            mt: 0.75,
            fontSize: { xs: '1.65rem', sm: '2rem', md: '2.25rem' },
            color: 'text.primary',
            pl: 2,
            ml: -2,
            borderLeft: '3px solid',
            borderColor: 'primary.main',
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1.75, maxWidth: 640, lineHeight: 1.75, fontSize: '1.02rem' }}
          >
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: maxContentWidth, mx: 'auto' }}>{children}</Box>
    </Box>
  );
}
