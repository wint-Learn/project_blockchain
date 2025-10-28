import type { ReactNode } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Badge as BadgeIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  ExitToApp as LogoutIcon,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Tổng quan', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { label: 'Người dùng đã đăng ký', path: '/admin/users', icon: <PeopleIcon /> },
  { label: 'CCCD Pre-verified', path: '/admin/cccd', icon: <BadgeIcon /> },
  { label: 'Yêu cầu dịch vụ', path: '/admin/services', icon: <AssignmentIcon /> },
  { label: 'Lịch sử hoạt động', path: '/admin/logs', icon: <HistoryIcon /> },
];

const drawerWidth = 260;

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box
        sx={{
          p: 2.5,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.dark' }}>
          <AdminPanelSettings />
        </Avatar>
        <Stack>
          <Typography variant="h6" fontWeight="bold">
            Admin Panel
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            Hệ thống quản lý
          </Typography>
        </Stack>
      </Box>
      
      <Divider />
      
      {/* Navigation */}
      <List sx={{ flexGrow: 1, px: 1, py: 2 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      {/* Logout */}
      <List sx={{ px: 1, py: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'error.lighter',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" sx={{ color: 'error.main' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {title || 'Admin Dashboard'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
