import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { AccountBalanceWallet, Login, AppRegistration } from '@mui/icons-material';

export default function Home() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 5 }}>
          <AccountBalanceWallet sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h3" component="h1" gutterBottom>
            Hệ thống DID Blockchain
          </Typography>
          
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Quản lý danh tính phi tập trung với CCCD và Blockchain
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AppRegistration />}
              onClick={() => navigate('/register')}
              sx={{ px: 4, py: 1.5 }}
            >
              Đăng ký
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<Login />}
              onClick={() => navigate('/login')}
              sx={{ px: 4, py: 1.5 }}
            >
              Đăng nhập
            </Button>
          </Box>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Lưu ý:</strong> Đây là phiên bản demo. Private key được lưu trong localStorage 
              chỉ để thử nghiệm. Trong môi trường thực tế, hãy sử dụng MetaMask hoặc các wallet extension khác.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
