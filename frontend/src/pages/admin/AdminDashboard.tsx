import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  People,
  Fingerprint,
  HourglassEmpty,
  CheckCircle,
  Cancel,
  Assignment,
  TrendingUp,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import StatusChip from '../../components/shared/StatusChip';
import { getDashboardStats } from '../../services/api';
import api from '../../services/api';

interface DashboardStats {
  totalUsers: number;
  totalCCCDs: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

interface RecentRequest {
  id: number;
  service_type: string;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  created_at: string;
}

const serviceTypeLabels: { [key: string]: string } = {
  business_registration: 'Đăng ký kinh doanh',
  vehicle_registration: 'Đăng ký xe máy',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
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

    fetchDashboardData();
  }, [navigate, enqueueSnackbar]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsRes, requestsRes] = await Promise.all([
        getDashboardStats(),
        api.get('/api/admin/services/recent?limit=10'),
      ]);

      if (statsRes.data.success) {
        // Map old stats structure to new
        const oldStats = statsRes.data.stats;
        setStats({
          totalUsers: oldStats.totalDIDs || 0,
          totalCCCDs: oldStats.preVerified?.verified || 0,
          pendingRequests: oldStats.serviceRequests?.pending || 0,
          approvedRequests: oldStats.serviceRequests?.approved || 0,
          rejectedRequests: oldStats.serviceRequests?.rejected || 0,
        });
      }

      if (requestsRes.data.success) {
        setRecentRequests(requestsRes.data.data || []);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải dữ liệu dashboard';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <LoadingSpinner message="Đang tải dashboard..." />
        </Container>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <EmptyState 
            message={error} 
            type="error" 
            action={{ label: 'Thử lại', onClick: fetchDashboardData }} 
          />
        </Container>
      </AdminLayout>
    );
  }

  if (!stats) return null;

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Dashboard Admin
        </Typography>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: 1,
                    mr: 2,
                  }}
                >
                  <People />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Người dùng
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalUsers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    bgcolor: 'info.main',
                    color: 'white',
                    borderRadius: 1,
                    mr: 2,
                  }}
                >
                  <Fingerprint />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    CCCD Pre-verified
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.totalCCCDs}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    bgcolor: 'warning.main',
                    color: 'white',
                    borderRadius: 1,
                    mr: 2,
                  }}
                >
                  <HourglassEmpty />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Chờ duyệt
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.pendingRequests}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    bgcolor: 'success.main',
                    color: 'white',
                    borderRadius: 1,
                    mr: 2,
                  }}
                >
                  <CheckCircle />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Đã duyệt
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.approvedRequests}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Request Summary & Recent Requests */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 300px', minWidth: 300, maxWidth: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp /> Tổng quan yêu cầu
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HourglassEmpty sx={{ color: 'warning.main' }} />
                    <Typography>Chờ duyệt</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {stats.pendingRequests}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: 'success.main' }} />
                    <Typography>Đã duyệt</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {stats.approvedRequests}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Cancel sx={{ color: 'error.main' }} />
                    <Typography>Đã từ chối</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {stats.rejectedRequests}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 600px' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assignment /> Yêu cầu gần đây
              </Typography>
              {recentRequests.length === 0 ? (
                <EmptyState message="Chưa có yêu cầu nào" type="info" />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Người nộp</TableCell>
                        <TableCell>Dịch vụ</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Thời gian</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentRequests.map((request) => (
                        <TableRow key={request.id} hover>
                          <TableCell>#{request.id}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {request.full_name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {serviceTypeLabels[request.service_type] || request.service_type}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={request.status} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(request.created_at)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default AdminDashboard;
