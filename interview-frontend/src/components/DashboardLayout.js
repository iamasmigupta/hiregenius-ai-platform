import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Divider, ListItemButton, IconButton, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventIcon from '@mui/icons-material/Event';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DescriptionIcon from '@mui/icons-material/Description';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { label: 'Schedule Interview', icon: <EventIcon />, path: '/admin/schedule' },
  { label: 'Create User', icon: <PersonAddIcon />, path: '/admin/create-user' },
  { label: 'Templates', icon: <DescriptionIcon />, path: '/admin/templates' },
  { label: 'Reports', icon: <BarChartIcon />, path: '/admin/reports' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/admin/settings' },
];

const drawerWidth = 240;

const DashboardLayout = ({ activePath, onNavigate, onLogout, children }) => {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const handleDrawerToggle = () => setOpen((prev) => !prev);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: theme.palette.background.default }}>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : 64,
          flexShrink: 0,
          transition: 'width 0.2s',
          [`& .MuiDrawer-paper`]: {
            width: open ? drawerWidth : 64,
            boxSizing: 'border-box',
            background: theme.palette.background.sidebar,
            backdropFilter: 'blur(8px)',
            borderRight: 'none',
            borderRadius: 0,
            boxShadow: theme.palette.custom.shadow,
            transition: 'width 0.2s',
            overflowX: 'hidden',
            p: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            m: 0,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-end' : 'center', px: 2, py: 3 }}>
          <IconButton onClick={handleDrawerToggle} sx={{ color: theme.palette.primary.main, ml: open ? 1 : 0 }}>
            <MenuIcon />
          </IconButton>
        </Box>
        <Divider sx={{ bgcolor: theme.palette.primary.main, opacity: 0.2, mb: 1 }} />
        <List>
          {navItems.map((item) => (
            <Tooltip title={open ? '' : item.label} placement="right" arrow key={item.label}>
              <ListItem disablePadding sx={{ justifyContent: open ? 'flex-start' : 'center' }}>
                <ListItemButton
                  selected={activePath === item.path}
                  onClick={() => onNavigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    mx: 1,
                    pl: open ? 1.5 : 0.5,
                    background: activePath === item.path ? theme.palette.custom.sidebarActive : 'none',
                    color: activePath === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                    boxShadow: activePath === item.path ? theme.palette.custom.glow : 'none',
                    '&:hover': {
                      background: theme.palette.custom.sidebarHover,
                      color: theme.palette.primary.main,
                    },
                    transition: 'all 0.2s',
                    justifyContent: open ? 'flex-start' : 'center',
                    minHeight: 48,
                  }}
                >
                  <ListItemIcon sx={{ color: activePath === item.path ? theme.palette.primary.main : theme.palette.text.primary, minWidth: 36, justifyContent: 'center' }}>
                    {item.icon}
                  </ListItemIcon>
                  {open && <ListItemText primary={item.label} sx={{ fontFamily: 'inherit' }} />}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        {open && (
          <Box sx={{ textAlign: 'center', px: 1, py: 1 }}>
            <Divider sx={{ bgcolor: theme.palette.primary.main, opacity: 0.15, mb: 1 }} />
            <Typography variant="caption" sx={{ color: '#bdbdbd', fontSize: '0.65rem', display: 'block' }}>
              Made with ❤️ by Asmi Gupta
            </Typography>
            <Typography variant="caption" sx={{ color: '#888', fontSize: '0.6rem', display: 'block', mt: 0.3 }}>
              © 2026 | HireGenius
            </Typography>
          </Box>
        )}
        <List>
          <Tooltip title={open ? '' : 'Logout'} placement="right" arrow>
            <ListItem disablePadding sx={{ justifyContent: open ? 'flex-start' : 'center' }}>
              <ListItemButton
                onClick={onLogout}
                sx={{
                  color: '#ff5252',
                  borderRadius: 2,
                  mb: 2,
                  mx: 1,
                  pl: open ? 1.5 : 0.5,
                  background: 'rgba(255,82,82,0.08)',
                  '&:hover': { background: '#ff5252', color: '#fff' },
                  minHeight: 48,
                  transition: 'all 0.2s',
                  justifyContent: open ? 'flex-start' : 'center',
                }}
              >
                <ListItemIcon sx={{ color: '#ff5252', minWidth: 36, justifyContent: 'center' }}><LogoutIcon /></ListItemIcon>
                {open && <ListItemText primary="Logout" />}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, md: 4 }, minHeight: '100vh', background: 'none' }}>
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout; 