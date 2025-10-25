import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { getDIDInfo, getLogs } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import Loading from '../components/Loading';

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
  anomaly_score: number;
  timestamp: string;
}

export default function Dashboard() {
  const [didInfo, setDidInfo] = useState<DIDInfo | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, logout } = useAuthStore();

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
      setDidInfo(didResponse.data);

      // Fetch logs
      const logsResponse = await getLogs({ limit: 10 });
      setLogs(logsResponse.data.logs || []);
    } catch (error: any) {
      console.error('Fetch data error:', error);
      const message =
        error.response?.data?.message || 'Không thể tải dữ liệu';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    enqueueSnackbar('Đã đăng xuất', { variant: 'info' });
    navigate('/login');
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Loading message="Đang tải dữ liệu..." />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={() => navigate('/services')}>
              Dịch vụ công
            </Button>
            <Button variant="outlined" onClick={() => navigate('/my-services')}>
              Dịch vụ của tôi
            </Button>
            <Button variant="outlined" color="error" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </Box>
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
                <strong>Ngày tạo:</strong>{' '}
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
                  <Typography variant="body1">
                    <strong>Trạng thái Blockchain:</strong>{' '}
                    <Chip label="Đã đăng ký on-chain" color="success" size="small" />
                  </Typography>
                </Box>
              )}

              {user?.anomalyScore !== undefined && user.anomalyScore > 0.5 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Phát hiện hoạt động bất thường (Anomaly Score:{' '}
                  {user.anomalyScore.toFixed(2)})
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
                  <TableCell>ID</TableCell>
                  <TableCell>Địa chỉ ví</TableCell>
                  <TableCell>Hành động</TableCell>
                  <TableCell>Anomaly Score</TableCell>
                  <TableCell>Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Chưa có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.id}</TableCell>
                      <TableCell>
                        {log.wallet_address.substring(0, 10)}...
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          color={
                            log.action === 'register' ? 'primary' : 'secondary'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={(log.anomaly_score ?? 0).toFixed(2)}
                          color={
                            (log.anomaly_score ?? 0) > 0.5 ? 'error' : 'success'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
}
