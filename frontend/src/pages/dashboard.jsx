import * as React from 'react';
import { Box, Tabs, Tab, Container, Typography, Tooltip } from '@mui/material'
import { useNavigate, useLocation, Outlet } from 'react-router';
import { LogoutOutlined } from '@mui/icons-material'

const routes = [
  { path: '/submit', label: 'Submit' },
  { path: '/results', label: 'Result' },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTabIndex = routes.findIndex(route => route.path === location.pathname);
  const value = currentTabIndex >= 0 ? currentTabIndex : 0;
  
  const handleChange = (_event, newValue) => {
    navigate(routes[newValue].path);
  };

  return (
    <Container sx={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'flex-start', padding: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.3)', display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 400 }}>Preflight</Typography>
        <Tabs 
          value={value}
          onChange={handleChange}
          aria-label="navigation tabs"
          sx={{
            '& .MuiTab-root': {
              color: 'secondary',
            },
            '& .MuiTab-root.Mui-selected': {
              color: 'primary',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary',
            },
          }}
        >
          {routes.map((route, index) => (
            <Tab key={route.path} label={route.label} id={`nav-tab-${index}`} />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Container>
  )
}