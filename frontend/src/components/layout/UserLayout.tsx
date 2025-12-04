import type { ReactNode } from 'react';
import {
  Box, AppBar, Toolbar, Typography, IconButton,
  Avatar, Button, Menu, MenuItem, Divider, ListItemIcon,
} from '@mui/material';
import {
  ArrowBack, Person, Business, Assignment,
  History as HistoryIcon,
  Logout, KeyboardArrowDown,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface UserLayoutProps {
  children: ReactNode;
  title: string;
  showBackButton?: boolean;
}

const UserLayout = ({ children, title, showBackButton = true }: UserLayoutProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const getUserInitials = () => {
    if (!user?.address) return '??';
    return user.address.substring(2, 4).toUpperCase();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar position="sticky">
        <Toolbar>
          {showBackButton && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate('/dashboard')}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: 'center' }}>
            {title}
          </Typography>

          {/* User menu */}
          <Button
            color="inherit"
            onClick={handleMenuOpen}
            startIcon={<Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>{getUserInitials()}</Avatar>}
            endIcon={<KeyboardArrowDown />}
          >
            {user?.address.substring(0, 6)}...{user?.address.substring(38)}
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Thông tin cá nhân
            </MenuItem>
            <MenuItem onClick={() => { navigate('/services'); handleMenuClose(); }}>
              <ListItemIcon>
                <Business fontSize="small" />
              </ListItemIcon>
              Dịch vụ công
            </MenuItem>
            <MenuItem onClick={() => { navigate('/my-services'); handleMenuClose(); }}>
              <ListItemIcon>
                <Assignment fontSize="small" />
              </ListItemIcon>
              Dịch vụ của tôi
            </MenuItem>
            <MenuItem onClick={() => { navigate('/activity'); handleMenuClose(); }}>
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              Lịch sử hoạt động
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Đăng xuất</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

export default UserLayout;
