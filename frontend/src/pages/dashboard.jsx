import { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Toolbar,
  AppBar,
  IconButton,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import TerminalOutlinedIcon from '@mui/icons-material/TerminalOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import { useNavigate, useLocation, Outlet } from 'react-router';

const DRAWER_WIDTH = 268;

const routes = [
  { path: '/tools/api-analysis', label: 'API analysis', icon: AnalyticsOutlinedIcon },
  { path: '/tools/openapi-from-curl', label: 'OpenAPI from cURL', icon: TerminalOutlinedIcon },
  { path: '/tools/openapi-endpoint-guide', label: 'Endpoint data guide', icon: AccountTreeOutlinedIcon },
];

function currentTitle(pathname) {
  return routes.find((r) => r.path === pathname)?.label ?? 'Preflight';
}

export function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Toolbar
        sx={{
          minHeight: 76,
          alignItems: 'flex-start',
          flexDirection: 'column',
          justifyContent: 'center',
          px: 2.5,
          gap: 0.5,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 12,
            bottom: 12,
            width: 3,
            borderRadius: 1,
            background: `linear-gradient(180deg, ${theme.palette.primary.light}, ${theme.palette.primary.dark})`,
          },
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 800, letterSpacing: '-0.03em', pl: 1.25 }}>
          Preflight
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, pl: 1.25, fontWeight: 500 }}>
          Tools
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: alpha(theme.palette.common.white, 0.08) }} />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 1.5, mb: 1, display: 'block', fontSize: '0.65rem', letterSpacing: '0.12em' }}
        >
          Workspace
        </Typography>
        {routes.map((route) => {
          const Icon = route.icon;
          const selected = location.pathname === route.path;
          return (
            <ListItem key={route.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                onClick={() => handleNav(route.path)}
                sx={{
                  borderRadius: 1.5,
                  py: 1.1,
                  px: 1.5,
                  transition: theme.transitions.create(['background-color', 'transform', 'box-shadow'], {
                    duration: 180,
                  }),
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.28),
                    boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.light, 0.35)}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.36),
                    },
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.06),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 42, color: selected ? 'primary.light' : 'text.secondary' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={route.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: selected ? 600 : 500,
                    color: 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
          Pick a tool to open it in this panel.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          color: 'text.primary',
          zIndex: (z) => z.drawer + 1,
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 56 }}>
          <IconButton
            color="inherit"
            aria-label="open navigation menu"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 600 }}>
            {currentTitle(location.pathname)}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }} aria-label="Tools">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              minHeight: '100%',
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
              boxShadow: (t) => `8px 0 32px ${alpha(t.palette.common.black, 0.35)}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              minHeight: '100vh',
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
              boxShadow: (t) => `8px 0 32px ${alpha(t.palette.common.black, 0.35)}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          pt: { xs: '56px', sm: 0 },
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
