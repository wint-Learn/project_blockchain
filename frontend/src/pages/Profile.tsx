import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Divider, Alert, Chip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { getUserProfile } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useMetaMask } from '../hooks/useMetaMask';
import UserLayout from '../components/layout/UserLayout';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BadgeIcon from '@mui/icons-material/Badge';
import CakeIcon from '@mui/icons-material/Cake';
import WcIcon from '@mui/icons-material/Wc';
import HomeIcon from '@mui/icons-material/Home';
import EventIcon from '@mui/icons-material/Event';

interface DIDInfo {
  address: string;
  publicKey: string;
  cccdHashOnChain: string;
  hasMetadata: boolean;
  registeredAt?: string;
}

interface CCCDInfo {
  cccdNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  issueDate: string;
  phoneNumber: string;
}

interface ProfileData {
  address: string;
  didInfo: DIDInfo | null;
  cccdInfo: CCCDInfo | null;
  anomalyScore: number;
}

export default function Profile() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthStore();
  const { account, isConnected } = useMetaMask();

  useEffect(() => {
    if (!user?.address) {
      navigate('/login');
      return;
    }

    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user?.address) return;

    try {
      setLoading(true);
      const response = await getUserProfile(user.address);
      setProfileData(response.data.data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      enqueueSnackbar('Không thể tải thông tin cá nhân', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UserLayout title="Thông tin cá nhân" showBackButton={true}>
        <Container maxWidth="lg">
          <LoadingSpinner message="Đang tải thông tin cá nhân..." />
        </Container>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Thông tin cá nhân" showBackButton={true}>
      <Container maxWidth="lg" sx={{ py: 3 }}>

        {/* Account Status Alert */}
        {isConnected && account ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            <strong>Ví đã kết nối:</strong> {account}
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 3 }}>
            MetaMask chưa kết nối. Vui lòng kết nối ví để sử dụng đầy đủ tính năng.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Thông tin CCCD */}
          {profileData?.cccdInfo && (
            <Box sx={{ flex: 1 }}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <BadgeIcon sx={{ mr: 1 }} />
                  Thông Tin CCCD
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                      Số CCCD:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {profileData.cccdInfo.cccdNumber || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                      Họ và tên:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {profileData.cccdInfo.fullName || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CakeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                      Ngày sinh:
                    </Typography>
                    <Typography variant="body1">
                      {profileData.cccdInfo.dateOfBirth 
                        ? new Date(profileData.cccdInfo.dateOfBirth).toLocaleDateString('vi-VN')
                        : 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WcIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                      Giới tính:
                    </Typography>
                    <Typography variant="body1">
                      {profileData.cccdInfo.gender || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <HomeIcon sx={{ mr: 1, mt: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                      Địa chỉ:
                    </Typography>
                    <Typography variant="body1">
                      {profileData.cccdInfo.address || 'N/A'}
                    </Typography>
                  </Box>

                  {profileData.cccdInfo.issueDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
                        Ngày cấp:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(profileData.cccdInfo.issueDate).toLocaleDateString('vi-VN')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          )}

          {/* Thông tin DID/Blockchain */}
          <Box sx={{ flex: 1 }}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                Thông Tin DID
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {profileData?.didInfo ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Địa chỉ ví:
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                      {profileData.didInfo.address}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Public Key:
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                      {profileData.didInfo.publicKey.slice(0, 50)}...
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      CCCD Hash (On-chain):
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                      {profileData.didInfo.cccdHashOnChain}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Trạng thái:
                    </Typography>
                    <Chip
                      label="Đã đăng ký DID on-chain"
                      color="success"
                      size="small"
                    />
                  </Box>

                  {profileData.didInfo.registeredAt && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Ngày đăng ký DID:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(profileData.didInfo.registeredAt).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="warning">
                  Không tìm thấy thông tin DID trên blockchain
                </Alert>
              )}
            </Paper>
          </Box>
        </Box>

        {/* Anomaly Score (nếu có) */}
        {profileData?.anomalyScore !== undefined && profileData.anomalyScore > 0 && (
          <Box sx={{ mt: 3 }}>
            <Alert
              severity={profileData.anomalyScore > 0.5 ? 'error' : 'warning'}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  Cảnh báo bất thường: {(profileData.anomalyScore * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2">
                  Hệ thống phát hiện hoạt động đăng nhập có dấu hiệu bất thường.
                  Nếu không phải bạn, vui lòng liên hệ admin.
                </Typography>
              </Box>
            </Alert>
          </Box>
        )}
      </Container>
    </UserLayout>
  );
}
