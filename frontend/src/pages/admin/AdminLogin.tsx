import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { adminLogin } from '../../services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      const response = await adminLogin({ username, password });

      if (response.data.success) {
        // Save admin token
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(response.data.admin));

        enqueueSnackbar('Đăng nhập thành công!', { variant: 'success' });

        // Navigate to admin dashboard
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <AdminPanelSettings sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Panel
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Đăng nhập để quản lý hệ thống
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Tên đăng nhập"
            variant="outlined"
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
          />

          <TextField
            fullWidth
            label="Mật khẩu"
            variant="outlined"
            margin="normal"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
          </Button>

          <Button
            fullWidth
            variant="text"
            size="large"
            sx={{ mt: 2 }}
            onClick={() => navigate('/')}
          >
            Quay về trang chủ
          </Button>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            <strong>Demo credentials:</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Username: <code>admin</code>
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Password: <code>admin123</code>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminLogin;
