import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  PersonAdd,
  VerifiedUser,
  RequestPage,
  Warning,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getDashboardStats } from '../../services/api';

interface DashboardStats {
  totalDIDs: number;
  todayRegistrations: number;
  preVerified: {
    pending: number;
    verified: number;
    blacklisted: number;
    claimed: number;
  };
  anomalyAlerts: number;
  recentLogins: Array<{
    date: string;
    count: string;
  }>;
  serviceRequests: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      enqueueSnackbar('Vui lòng đăng nhập với tài khoản admin', { variant: 'warning' });
      navigate('/admin/login');
      return;
    }

    fetchStats();
  }, [navigate, enqueueSnackbar]);

  const fetchStats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getDashboardStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải thống kê';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });

      // If unauthorized, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!stats) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Tổng Quan
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 3 }}>
        {/* Total DIDs */}
        <Card sx={{ flex: '1 1 calc(25% - 24px)', minWidth: 200, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <People sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4">{stats.totalDIDs}</Typography>
                <Typography variant="body2">Tổng số DID</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Today Registrations */}
        <Card sx={{ flex: '1 1 calc(25% - 24px)', minWidth: 200, bgcolor: 'success.main', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonAdd sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4">{stats.todayRegistrations}</Typography>
                <Typography variant="body2">Đăng ký hôm nay</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Pre-verified Pending */}
        <Card sx={{ flex: '1 1 calc(25% - 24px)', minWidth: 200, bgcolor: 'warning.main', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <VerifiedUser sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4">{stats.preVerified.pending}</Typography>
                <Typography variant="body2">CCCD chờ xác thực</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Service Requests Pending */}
        <Card sx={{ flex: '1 1 calc(25% - 24px)', minWidth: 200, bgcolor: 'info.main', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <RequestPage sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4">{stats.serviceRequests.pending}</Typography>
                <Typography variant="body2">Yêu cầu chờ duyệt</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Detailed Stats */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 4 }}>
        {/* Pre-verified CCCD Details */}
        <Paper sx={{ flex: '1 1 calc(50% - 12px)', minWidth: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Chi tiết CCCD Pre-verified
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Chờ xác thực:</Typography>
              <Typography variant="body1" fontWeight="bold" color="warning.main">
                {stats.preVerified.pending}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Đã xác thực:</Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {stats.preVerified.verified}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Đã đăng ký DID:</Typography>
              <Typography variant="body1" fontWeight="bold" color="info.main">
                {stats.preVerified.claimed}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Bị blacklist:</Typography>
              <Typography variant="body1" fontWeight="bold" color="error.main">
                {stats.preVerified.blacklisted}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Service Requests Details */}
        <Paper sx={{ flex: '1 1 calc(50% - 12px)', minWidth: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Chi tiết Yêu cầu Dịch vụ
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Chờ duyệt:</Typography>
              <Typography variant="body1" fontWeight="bold" color="warning.main">
                {stats.serviceRequests.pending}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Đã duyệt:</Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {stats.serviceRequests.approved}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Đã từ chối:</Typography>
              <Typography variant="body1" fontWeight="bold" color="error.main">
                {stats.serviceRequests.rejected}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Additional Stats */}
        <Paper sx={{ flex: '1 1 calc(50% - 12px)', minWidth: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Hoạt động gần đây
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Đăng nhập (7 ngày):</Typography>
              <Typography variant="body1" fontWeight="bold">
                {stats.recentLogins.reduce((sum, day) => sum + parseInt(day.count), 0)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Cảnh báo bất thường:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {stats.anomalyAlerts > 0 && (
                  <Warning sx={{ color: 'error.main', mr: 1, fontSize: 20 }} />
                )}
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  color={stats.anomalyAlerts > 0 ? 'error.main' : 'success.main'}
                >
                  {stats.anomalyAlerts}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
