import { useState, useEffect } from 'react';
import {
  Alert, Container, Card, CardContent, Typography,
  Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Tooltip, IconButton,
  InputAdornment, TextField, Stack,
} from '@mui/material';
import {
  Refresh, Search, CheckCircle, Warning, Error as ErrorIcon, LocationOn, Devices,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import api from '../../services/api';

interface LoginLog {
  id: number;
  user_id: number;
  username: string;
  wallet_address: string;
  login_time: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  is_anomaly: boolean;
  anomaly_reason?: string;
  status: 'success' | 'failed' | 'suspicious';
}

const ActivityLogs = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    anomalies: 0,
    failedAttempts: 0,
  });

  useEffect(() => {
    fetchLoginLogs();
  }, []);

  const fetchLoginLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/login-logs');
      setLogs(response.data.logs || []);
      setStats(response.data.stats || { total: 0, anomalies: 0, failedAttempts: 0 });
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Không thể tải lịch sử đăng nhập', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const parseUserAgent = (userAgent: string) => {
    // Simple parsing - you can use a library like ua-parser-js for better results
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  };

  const filteredLogs = logs.filter((log) =>
    log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ip_address.includes(searchTerm) ||
    (log.location && log.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <LoadingSpinner message="Đang tải lịch sử đăng nhập..." />
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Lịch sử đăng nhập
          </Typography>
          <Tooltip title="Làm mới">
            <IconButton onClick={fetchLoginLogs} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="success" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Tổng đăng nhập
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Đáng ngờ
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {stats.anomalies}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon color="error" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Thất bại
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {stats.failedAttempts}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Anomaly Detection:</strong> Hệ thống tự động phát hiện đăng nhập bất thường dựa trên:
            IP khác lạ, vị trí địa lý mới, thiết bị không nhận diện, thời gian đăng nhập bất thường.
          </Typography>
        </Alert>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Tìm theo username, địa chỉ ví, IP, hoặc vị trí..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {/* Login Logs Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Thời gian</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Địa chỉ ví</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Vị trí</TableCell>
                <TableCell>Thiết bị</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Anomaly</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState message="Chưa có lịch sử đăng nhập" type="info" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow 
                    key={log.id} 
                    hover
                    sx={{ 
                      bgcolor: log.is_anomaly ? 'warning.lighter' : 'inherit',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontSize="0.8rem">
                        {formatDate(log.login_time)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {log.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                        {log.wallet_address.substring(0, 8)}...{log.wallet_address.substring(log.wallet_address.length - 6)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                        {log.ip_address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {log.location ? (
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" fontSize="0.8rem">
                            {log.location}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                          Không xác định
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Devices fontSize="small" color="action" />
                        <Typography variant="body2" fontSize="0.8rem">
                          {parseUserAgent(log.user_agent)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          log.status === 'success' ? 'Thành công' :
                          log.status === 'failed' ? 'Thất bại' :
                          'Đáng ngờ'
                        }
                        color={
                          log.status === 'success' ? 'success' :
                          log.status === 'failed' ? 'error' :
                          'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {log.is_anomaly ? (
                        <Tooltip title={log.anomaly_reason || 'Phát hiện bất thường'}>
                          <Chip
                            icon={<Warning />}
                            label="Cảnh báo"
                            color="warning"
                            size="small"
                          />
                        </Tooltip>
                      ) : (
                        <Chip
                          label="Bình thường"
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
              
      </Container>
    </AdminLayout>
  );
};

export default ActivityLogs;
