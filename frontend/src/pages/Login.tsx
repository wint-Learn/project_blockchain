import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Wallet } from 'ethers';
import { useSnackbar } from 'notistack';
import { loginDID } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { parseQRData } from '../utils/qr-parser';

export default function Login() {
  const [qrData, setQrData] = useState('');
  const [privateKey, setPrivateKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, setUser, setToken, setPrivateKey, setCCCDInfo } = useAuthStore();

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (user?.address) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    if (!qrData.trim() || !privateKey.trim()) {
      enqueueSnackbar('Vui lòng điền đầy đủ thông tin', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Parse QR data để lấy thông tin CCCD
      const cccdInfo = parseQRData(qrData);
      if (!cccdInfo) {
        enqueueSnackbar('QR data không hợp lệ. Vui lòng kiểm tra lại.', {
          variant: 'error',
        });
        setLoading(false);
        return;
      }

      // Tạo wallet từ private key để lấy address
      const wallet = new Wallet(privateKey);
      const address = wallet.address;

      console.log('Derived address from private key:', address);

      // Generate message để sign
      const message = `Login at ${Date.now()}`;
      const signature = await wallet.signMessage(message);

      // Call API login
      const response = await loginDID({ address, message, signature, qrData });

      // Kiểm tra anomaly score
      if (response.data.anomalyScore > 0.5) {
        enqueueSnackbar(
          `Cảnh báo: Phát hiện bất thường (score: ${response.data.anomalyScore})`,
          { variant: 'warning', autoHideDuration: 5000 }
        );
      }

      // Lưu thông tin user và token
      setUser({
        address: response.data.address,
        cccdHash: response.data.cccdHash,
        anomalyScore: response.data.anomalyScore,
      });
      setToken(response.data.token);
      setPrivateKey(privateKey); // CHỈ DÙNG CHO DEMO
      setCCCDInfo(cccdInfo); // Lưu thông tin CCCD đã parse

      enqueueSnackbar('Đăng nhập thành công!', { variant: 'success' });

      // Redirect về dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Đăng nhập thất bại. Vui lòng thử lại.';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Đăng nhập DID
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Nhập QR data (CCCD) và Private Key để đăng nhập
          </Alert>

          <TextField
            fullWidth
            label="QR Data (từ CCCD)"
            placeholder="Nhập dữ liệu QR từ CCCD (cùng QR đã dùng khi đăng ký)"
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            disabled={loading}
          />

          <TextField
            fullWidth
            type="password"
            label="Private Key"
            placeholder="0x..."
            value={privateKey}
            onChange={(e) => setPrivateKeyInput(e.target.value)}
            margin="normal"
            disabled={loading}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Chưa có tài khoản?{' '}
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/register')}
                disabled={loading}
              >
                Đăng ký
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
