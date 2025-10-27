import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';
import { useMetaMask } from '../hooks/useMetaMask';
import { getLoginMessage, loginWithMetaMask } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const LoginMetaMask: React.FC = () => {
  const navigate = useNavigate();
  const { isInstalled, isConnected, account, connect, signMessage, error: metamaskError } = useMetaMask();
  const setUser = useAuthStore((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<'connect' | 'sign' | 'done'>('connect');

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Kết nối MetaMask
      if (!isConnected) {
        setStep('connect');
        const address = await connect();
        
        if (!address) {
          setError('Không thể kết nối MetaMask');
          setLoading(false);
          return;
        }
      }

      // Step 2: Lấy message từ backend
      setStep('sign');
      const messageResponse = await getLoginMessage(account!);
      const message = messageResponse.data.message;

      // Step 3: Ký message
      const signature = await signMessage(message);
      
      if (!signature) {
        setError('Không thể ký message');
        setLoading(false);
        return;
      }

      // Step 4: Gửi signature lên backend
      const loginResponse = await loginWithMetaMask({
        address: account!,
        signature,
      });

      // Step 5: Lưu user vào store
      setUser(loginResponse.data.user);
      setStep('done');

      // Step 6: Chuyển đến dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err: any) {
      console.error('Login error:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Đăng nhập thất bại');
      }
      
      setLoading(false);
      setStep('connect');
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case 'connect':
        return 'Đang kết nối MetaMask...';
      case 'sign':
        return 'Vui lòng ký message trong MetaMask...';
      case 'done':
        return 'Đăng nhập thành công!';
      default:
        return '';
    }
  };

  if (!isInstalled) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <AccountBalanceWallet sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              MetaMask chưa được cài đặt
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Vui lòng cài đặt MetaMask extension để đăng nhập
            </Typography>
            <Button
              variant="contained"
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tải MetaMask
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <AccountBalanceWallet sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Đăng nhập
          </Typography>
          <Typography color="text.secondary">
            Sử dụng MetaMask để đăng nhập vào hệ thống
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {metamaskError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {metamaskError}
          </Alert>
        )}

        {isConnected && account && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Địa chỉ ví đã kết nối:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {account}
            </Typography>
          </Alert>
        )}

        {loading && (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {getStepMessage()}
            </Typography>
          </Box>
        )}

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleLogin}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
          sx={{ mt: 2, py: 1.5 }}
        >
          {loading ? 'Đang xử lý...' : isConnected ? 'Đăng nhập' : 'Kết nối MetaMask'}
        </Button>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Chưa có tài khoản?{' '}
            <Button
              variant="text"
              onClick={() => navigate('/verify')}
              disabled={loading}
            >
              Đăng ký ngay
            </Button>
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" component="div">
            <strong>Lưu ý:</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>MetaMask sẽ yêu cầu bạn ký một message để xác thực</li>
              <li>Việc ký message không tốn phí</li>
            </ul>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginMetaMask;
