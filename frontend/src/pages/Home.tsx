import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { 
  AccountBalanceWallet, 
  Login, 
  Dashboard,
  VerifiedUser 
} from '@mui/icons-material';
import { useAuthStore } from '../store/useAuthStore';

export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

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
            {user ? (
              // Nếu đã đăng nhập, hiển thị nút Dashboard
              <Button
                variant="contained"
                size="large"
                startIcon={<Dashboard />}
                onClick={() => navigate('/dashboard')}
                sx={{ px: 4, py: 1.5 }}
              >
                Vào Dashboard
              </Button>
            ) : (
              // Nếu chưa đăng nhập, hiển thị nút Xác thực/Đăng nhập
              <>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<VerifiedUser />}
                  onClick={() => navigate('/verify')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Xác thực & Đăng ký
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
              </>
            )}
          </Box>

        </Paper>
      </Box>
    </Container>
  );
}
