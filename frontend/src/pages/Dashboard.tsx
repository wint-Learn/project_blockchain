import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Card, CardContent, Stack, Typography, Paper, Chip, TableContainer,
  Table, TableHead, TableRow, TableCell, TableBody, Alert
} from '@mui/material';
import {
  AccountBalanceWallet, Fingerprint, CalendarToday, TrendingUp
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getDIDInfo, getLogs, getUserProfile } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import UserLayout from '../components/layout/UserLayout';
import LoadingSpinner from '../components/shared/LoadingSpinner';

interface DIDInfo {
  address: string;
  publicKey: string;
  cccdHashOnChain: string;
  hasMetadata: boolean;
  registeredAt: string;
}

interface LogEntry {
  id: number;
  wallet_address: string;
  action: string;
  ip_address?: string;
  anomaly_score: number;
  timestamp: string;
}

export default function Dashboard() {
  const [didInfo, setDidInfo] = useState<DIDInfo | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    console.log('[Dashboard] useEffect triggered, user:', user);
    
    if (!user?.address) {
      console.log('[Dashboard] No user address, redirecting to /login');
      navigate('/login');
      return;
    }

    console.log('[Dashboard] Fetching data for address:', user.address);
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch DID info
      const didResponse = await getDIDInfo(user!.address);
      console.log('[Dashboard] DID Response:', didResponse);
      setDidInfo(didResponse.data);

      // Fetch logs
      const logsResponse = await getLogs({ limit: 10 });
      console.log('[Dashboard] Logs Response:', logsResponse);
      setLogs(logsResponse.data.logs || []);

      // 🆕 Nếu user chưa có cccdInfo, fetch từ getUserProfile
      if (!user?.cccdInfo) {
        console.log('[Dashboard] User missing cccdInfo, fetching from profile API...');
        try {
          const profileResponse = await getUserProfile(user!.address);
          console.log('[Dashboard] Profile Response:', profileResponse);
          
          if (profileResponse.data?.data?.cccdInfo) {
            // Cập nhật user store với cccdInfo
            setUser({
              ...user,
              address: user?.address ?? '', // Ensure address is always a string
              cccdInfo: profileResponse.data.data.cccdInfo
            });
            console.log('[Dashboard] Updated user with cccdInfo:', profileResponse.data.data.cccdInfo);
          }
        } catch (profileError) {
          console.warn('[Dashboard] Failed to fetch cccdInfo:', profileError);
          // Non-blocking error
        }
      }
    } catch (error: any) {
      console.error('Fetch data error:', error);
      console.error('Error response:', error.response);
      const message =
        error.response?.data?.message || error.message || 'Không thể tải dữ liệu';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UserLayout title="Dashboard" showBackButton={false}>
        <Container maxWidth="lg">
          <LoadingSpinner message="Đang tải dữ liệu..." />
        </Container>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Dashboard" showBackButton={false}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 4 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <AccountBalanceWallet color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Họ và tên</Typography>
                  <Typography variant="h6">
                    {user?.cccdInfo?.fullName || 'Chưa cập nhật'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Fingerprint color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Trạng thái DID</Typography>
                  <Typography variant="h6" color="success.main">Đã đăng ký</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <CalendarToday color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Ngày tạo</Typography>
                  <Typography variant="h6">
                    {didInfo ? new Date(didInfo.registeredAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TrendingUp color={user?.anomalyScore && user.anomalyScore > 0.5 ? 'error' : 'success'} sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Anomaly Score</Typography>
                  <Typography variant="h6" color={user?.anomalyScore && user.anomalyScore > 0.5 ? 'error.main' : 'success.main'}>
                    {user?.anomalyScore?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {/* DID Info Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Thông tin DID
          </Typography>

          {didInfo && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>Địa chỉ ví:</strong> {didInfo.address}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>CCCD Hash:</strong> {didInfo.cccdHashOnChain}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Public Key:</strong>{' '}
                {didInfo.publicKey.slice(0, 20)}...{didInfo.publicKey.slice(-20)}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Thời điểm đăng ký:</strong>{' '}
                {new Date(didInfo.registeredAt).toLocaleString('vi-VN')}
              </Typography>

              {/* Hiển thị thông tin CCCD nếu có */}
              {user?.cccdInfo && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    📋 Thông tin CCCD
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>Số CCCD:</strong> {user.cccdInfo.cccdNumber}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>Họ và tên:</strong> {user.cccdInfo.fullName}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>Ngày sinh:</strong> {user.cccdInfo.dateOfBirth}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>Giới tính:</strong> {user.cccdInfo.gender}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>Địa chỉ:</strong> {user.cccdInfo.address}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    <strong>Ngày cấp:</strong> {user.cccdInfo.issueDate}
                  </Typography>
                  {user.cccdInfo.oldNumber && (
                    <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                      <strong>Số CMND cũ:</strong> {user.cccdInfo.oldNumber}
                    </Typography>
                  )}
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <strong>Lưu ý:</strong> Thông tin này chỉ hiển thị trong session hiện tại và không được lưu trữ lâu dài.
                  </Alert>
                </Box>
              )}

              {didInfo.hasMetadata && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" component="div">
                    <strong>Trạng thái Blockchain:</strong>{' '}
                    <Chip label="Đã đăng ký on-chain" color="success" size="small" />
                  </Typography>
                </Box>
              )}

              {user?.loginRisk?.isAnomaly && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    ⚠️ Phát hiện đăng nhập bất thường!
                  </Typography>
                  <Typography variant="body2">
                    Điểm rủi ro: <strong>{((user.loginRisk.riskScore || 0) * 100).toFixed(1)}%</strong>
                  </Typography>
                  {user.loginRisk.location?.full && (
                    <Typography variant="body2">
                      Vị trí: {user.loginRisk.location.full}
                    </Typography>
                  )}
                  {user.loginRisk.details?.reason && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Lý do: {user.loginRisk.details.reason}
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>
          )}
        </Paper>

        {/* Logs Section */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Lịch sử hoạt động
          </Typography>

          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Hành động</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Anomaly Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Chưa có lịch sử hoạt động
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action ? (log.action === 'register' ? 'Đăng ký' : log.action === 'login' ? 'Đăng nhập' : log.action) : 'N/A'}
                          color={
                            log.action === 'register' ? 'primary' : log.action === 'login' ? 'secondary' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.ip_address || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={(log.anomaly_score ?? 0).toFixed(2)}
                          color={
                            (log.anomaly_score ?? 0) > 0.5 ? 'error' : 'success'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </UserLayout>
  );
}
