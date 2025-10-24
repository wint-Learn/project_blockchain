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
import { registerDID } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { parseQRData } from '../utils/qr-parser';

export default function Register() {
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrivateKeyWarning, setShowPrivateKeyWarning] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, setUser, setPrivateKey } = useAuthStore();

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (user?.address) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleRegister = async () => {
    if (!qrData.trim()) {
      enqueueSnackbar('Vui lòng nhập QR Data từ CCCD', { variant: 'warning' });
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

      // Generate random wallet
      const wallet = Wallet.createRandom();
      const privateKey = wallet.privateKey;
      const address = wallet.address;

      console.log('Generated wallet:', { address, privateKey });
      console.log('Parsed CCCD info:', cccdInfo);

      // Call API register
      const response = await registerDID({ qrData, privateKey });

      console.log('Register response:', response.data);

      // Lưu thông tin user VÀ cccdInfo cùng lúc
      setUser({
        address: response.data.address,
        cccdHash: response.data.cccdHash,
        cccdInfo: cccdInfo, // Thêm cccdInfo vào user object luôn
      });
      // Token sẽ được set khi login
      setPrivateKey(privateKey); // CHỈ DÙNG CHO DEMO
      
      console.log('User set with cccdInfo:', { address: response.data.address, cccdInfo });

      // Lưu credentials để hiển thị cho user
      setGeneratedCredentials({
        address: response.data.address,
        privateKey: privateKey,
      });

      setShowPrivateKeyWarning(true);

      enqueueSnackbar('Đăng ký thành công! Vui lòng lưu lại Private Key!', { variant: 'success' });

      // KHÔNG auto redirect - để user copy private key
      // setTimeout(() => {
      //   navigate('/dashboard');
      // }, 3000);
    } catch (error: any) {
      console.error('Register error:', error);
      
      // Handle specific error codes
      if (error.response?.status === 409 && error.response?.data?.code === 'CCCD_ALREADY_EXISTS') {
        enqueueSnackbar(
          'CCCD này đã được đăng ký trước đó. Vui lòng sử dụng chức năng đăng nhập.', 
          { 
            variant: 'warning',
            autoHideDuration: 5000 
          }
        );
        // Redirect to login after 2s
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const message =
          error.response?.data?.error || 
          error.response?.data?.message || 
          'Đăng ký thất bại. Vui lòng thử lại.';
        enqueueSnackbar(message, { variant: 'error' });
      }
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

          {generatedCredentials && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                🎉 Đăng ký thành công!
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Địa chỉ ví:</strong>
              </Typography>
              <TextField
                fullWidth
                value={generatedCredentials.address}
                size="small"
                sx={{ mb: 2, fontFamily: 'monospace' }}
                InputProps={{ readOnly: true }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Typography variant="body2" gutterBottom color="error">
                <strong>⚠️ Private Key (LƯU LẠI NGAY!):</strong>
              </Typography>
              <TextField
                fullWidth
                value={generatedCredentials.privateKey}
                size="small"
                sx={{ mb: 2, fontFamily: 'monospace' }}
                InputProps={{ readOnly: true }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Typography variant="caption" color="error" display="block" gutterBottom>
                🔒 Private key chỉ hiển thị 1 lần duy nhất. Vui lòng copy và lưu lại để đăng nhập sau này!
              </Typography>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => navigate('/dashboard')}
                sx={{ mt: 2 }}
              >
                Vào Dashboard
              </Button>
            </Alert>
          )}

          {showPrivateKeyWarning && !generatedCredentials && (
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
