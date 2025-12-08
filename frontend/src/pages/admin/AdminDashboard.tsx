import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Container, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import {
  People, Fingerprint, HourglassEmpty, CheckCircle,
  Cancel, Assignment, TrendingUp, Warning, Shield,
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
  totalLogins?: number;
  anomalousLogins?: number;
  normalLogins?: number;
}

interface RecentRequest {
  id: number;
  service_type: string;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  created_at: string;
}

interface AnomalousLogin {
  id: number;
  userId: number;
  username: string;
  walletAddress: string;
  loginTime: string;
  ipAddress: string;
  location: string;
  countryCode: string;
  riskScore: number;
  anomalyReason: string;
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
  const [anomalousLogins, setAnomalousLogins] = useState<AnomalousLogin[]>([]);
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
      const [statsRes, requestsRes, anomalyRes, allLoginsRes] = await Promise.all([
        getDashboardStats(),
        api.get('/admin/services/recent?limit=10'),
        api.get('/admin/anomalies?limit=10'), // Lấy 10 phiên bất thường gần nhất
        api.get('/admin/logs?limit=1'), // Lấy tổng số tất cả login logs
      ]);

      if (statsRes.data.success) {
        // Map old stats structure to new
        const oldStats = statsRes.data.stats;
        
        // Calculate anomaly stats
        let totalLogins = 0;
        let anomalousLogins = 0;
        
        console.log('[AdminDashboard] allLoginsRes:', allLoginsRes.data);
        console.log('[AdminDashboard] anomalyRes:', anomalyRes.data);
        
        // Total logins from /admin/logs
        // API structure: { success: true, logs: [...], stats: { total: X } }
        if (allLoginsRes.data?.stats?.total !== undefined) {
          totalLogins = parseInt(allLoginsRes.data.stats.total) || 0;
        } else if (allLoginsRes.data?.total !== undefined) {
          totalLogins = parseInt(allLoginsRes.data.total) || 0;
        } else {
          // Fallback: If no total, assume anomalousLogins as minimum
          totalLogins = 0;
        }
        
        // Anomalous logins from /admin/anomalies (đã filter is_anomaly = true)
        if (anomalyRes.data.success) {
          anomalousLogins = anomalyRes.data.data.total || 0;
        }
        
        // If totalLogins is still 0 or less than anomalousLogins, fix it
        if (totalLogins < anomalousLogins) {
          totalLogins = anomalousLogins; // At minimum, total must equal anomalous
        }
        
        console.log('[AdminDashboard] Calculated:', { totalLogins, anomalousLogins });
        
        setStats({
          totalUsers: oldStats.totalDIDs || 0,
          totalCCCDs: oldStats.preVerified?.verified || 0,
          pendingRequests: oldStats.serviceRequests?.pending || 0,
          approvedRequests: oldStats.serviceRequests?.approved || 0,
          rejectedRequests: oldStats.serviceRequests?.rejected || 0,
          totalLogins: totalLogins,
          anomalousLogins: anomalousLogins,
          normalLogins: Math.max(0, totalLogins - anomalousLogins), // Đảm bảo không âm
        });
      }

      if (requestsRes.data.success) {
        setRecentRequests(requestsRes.data.data || []);
      }

      // Get recent anomalous logins (top 10)
      if (anomalyRes.data.success && anomalyRes.data.data.logs) {
        setAnomalousLogins(anomalyRes.data.data.logs.slice(0, 10));
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
          <LoadingSpinner message="Đang tải dữ liệu..." />
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
          Trang chủ quản trị
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
                    Xác minh người dùng
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
                    Số hồ sơ chờ duyệt
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
                    Số hồ sơ đã duyệt
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.approvedRequests}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Anomaly Detection Summary & Recent Requests */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 300px', minWidth: 300, maxWidth: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield /> Tổng quan đăng nhập bất thường
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp sx={{ color: 'info.main' }} />
                    <Typography>Tổng phiên đăng nhập</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="info.main">
                    {stats.totalLogins || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning sx={{ color: 'error.main' }} />
                    <Typography>Phiên bất thường</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {stats.anomalousLogins || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: 'success.main' }} />
                    <Typography>Phiên bình thường</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {stats.normalLogins || 0}
                  </Typography>
                </Box>
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: stats.anomalousLogins && stats.totalLogins 
                    ? ((stats.anomalousLogins / stats.totalLogins) > 0.3 ? 'error.light' : 'warning.light')
                    : 'grey.100',
                  borderRadius: 1 
                }}>
                  <Typography variant="body2" fontWeight="bold" textAlign="center">
                    Tỷ lệ bất thường: {stats.totalLogins 
                      ? ((stats.anomalousLogins || 0) / stats.totalLogins * 100).toFixed(1)
                      : 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 600px' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning /> Phiên đăng nhập bất thường gần đây
              </Typography>
              {anomalousLogins.length === 0 ? (
                <EmptyState message="Không có phiên đăng nhập bất thường" type="info" />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Người dùng</TableCell>
                        <TableCell>IP / Vị trí</TableCell>
                        <TableCell>Điểm rủi ro</TableCell>
                        <TableCell>Lý do</TableCell>
                        <TableCell>Thời gian</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {anomalousLogins.map((login) => (
                        <TableRow key={login.id} hover sx={{ bgcolor: 'error.lighter' }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {login.username || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {login.walletAddress.substring(0, 10)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{login.ipAddress}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {login.location || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={(login.riskScore * 100).toFixed(1) + '%'} 
                              color={login.riskScore > 0.7 ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {login.anomalyReason || 'Không rõ'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(login.loginTime)}
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
