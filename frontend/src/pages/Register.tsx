import { useState } from 'react';
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
import { registerDID } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export default function Register() {
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrivateKeyWarning, setShowPrivateKeyWarning] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { setUser, setToken, setPrivateKey } = useAuthStore();

  const handleRegister = async () => {
    if (!qrData.trim()) {
      enqueueSnackbar('Vui lòng nhập QR Data từ CCCD', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Generate random wallet
      const wallet = Wallet.createRandom();
      const privateKey = wallet.privateKey;
      const address = wallet.address;

      console.log('Generated wallet:', { address, privateKey });

      // Call API register
      const response = await registerDID({ qrData, privateKey });

      // Lưu thông tin user và token
      setUser({
        address: response.data.address,
        cccdHash: response.data.cccdHash,
      });
      setToken(response.data.token);
      setPrivateKey(privateKey); // CHỈ DÙNG CHO DEMO

      setShowPrivateKeyWarning(true);

      enqueueSnackbar('Đăng ký thành công!', { variant: 'success' });

      // Redirect về dashboard sau 3s
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error: any) {
      console.error('Register error:', error);
      const message =
        error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
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
            Đăng ký DID
          </Typography>

          {showPrivateKeyWarning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>CẢNH BÁO:</strong> Private key đang được lưu trong trình
              duyệt (localStorage) chỉ để demo. Trong thực tế, KHÔNG BAO GIỜ lưu
              private key như vậy - hãy dùng MetaMask hoặc wallet extension!
            </Alert>
          )}

          <TextField
            fullWidth
            label="QR Data (từ CCCD)"
            placeholder="Nhập dữ liệu QR từ CCCD"
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            margin="normal"
            multiline
            rows={4}
            disabled={loading}
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleRegister}
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Đăng ký'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Đã có tài khoản?{' '}
              <Button
                variant="text"
                size="small"
                onClick={() => navigate('/login')}
                disabled={loading}
              >
                Đăng nhập
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
