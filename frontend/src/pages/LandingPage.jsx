import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
  Card,
  CardActionArea,
  CardContent,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// array for the tools to allow for easy addition if necessary
const tools = [
  {
    path: '/tools/api-analysis',
    title: 'API analysis',
    description:
      'Submit a schema, sample payload, and requirements and return risk-focused findings for your API.',
    Icon: AnalyticsOutlinedIcon,
    buttonText: 'Perform analysis',
  },
  {
    path: '/tools/openapi-from-curl',
    title: 'OpenAPI from cURL',
    description:
      'Paste a cURL command, a sample request body, and a sample response body and return structured OpenAPI specifications you can add straight to your documentation.',
    Icon: TerminalOutlinedIcon,
    buttonText: 'Generate specification',
  },
  {
    path: '/tools/openapi-endpoint-guide',
    title: 'Endpoint data guide',
    description:
      'Turn an OpenAPI document into a concise, step-oriented guide so consumers know how to shape requests and interpret responses.',
    Icon: AccountTreeOutlinedIcon,
    buttonText: 'Generate API guide',
  },
];

export function LandingPage() {
  const theme = useTheme();

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, 0.72),
          backdropFilter: 'blur(12px)',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'text.primary',
              textDecoration: 'none',
              '&:hover': { color: 'primary.light' },
            }}
          >
            Preflight
          </Typography>
          <Button component={RouterLink} to="/tools/api-analysis" variant="outlined" size="small" color="primary">
            Open workspace
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 5, md: 8 } }}>
        <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '2.85rem' },
              letterSpacing: '-0.04em',
              lineHeight: 1.12,
            }}
          >
            API Tool Suite built for developers
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 600 }}>
            Preflight bundles practical tools for teams working with APIs. Preflight helps you analyze behavior against requirements, bootstrap
            specs from real traffic, and publish endpoint guides your partners can follow.
          </Typography>
        </Stack>

        <Box id="tools" sx={{ scrollMarginTop: 96, pt: { xs: 6, md: 8 } }}>
          <Typography variant="h4" component="h2" sx={{ mt: 1, mb: 3, letterSpacing: '-0.03em' }}>
            Everything in one workspace
          </Typography>

          <Grid container spacing={2.5}>
            {tools.map(({ path, title, description, Icon, buttonText }) => (
              <Grid key={path} size={{ xs: 12, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: theme.transitions.create(['border-color', 'box-shadow', 'transform'], { duration: 200 }),
                    '&:hover': {
                      borderColor: alpha(theme.palette.primary.main, 0.45),
                      boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.35)}`,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardActionArea component={RouterLink} to={path} sx={{ height: '100%', alignItems: 'stretch' }}>
                    <CardContent sx={{ p: 2.75, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.18),
                            color: 'primary.light',
                          }}
                        >
                          <Icon fontSize="small" />
                        </Box>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                          {title}
                        </Typography>
                      </Stack>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, flex: 1 }}>
                        {description}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'primary.light', fontWeight: 600 }}>
                        <Typography variant="body2">{buttonText}</Typography>
                        <ArrowForwardIcon sx={{ fontSize: 18 }} />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
