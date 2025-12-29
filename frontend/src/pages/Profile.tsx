import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Paper, Divider, Alert, Chip
} from '@mui/material';
import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Badge as BadgeIcon,
  Home as HomeIcon,
  Event as EventIcon,
  Person as PersonIcon,
  Cake as CakeIcon,
  Wc as WcIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getUserProfile } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useMetaMask } from '../hooks/useMetaMask';
import UserLayout from '../components/layout/UserLayout';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import type { DIDInfo } from '../types/cccd';

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
  useMetaMask();

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

          {/* Thông tin DID */}
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
                      Địa chỉ ví liên kết: 
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {profileData.didInfo.address.slice(0, 6)}...{profileData.didInfo.address.slice(-4)}
                    </Typography> 
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Trạng thái:
                    </Typography>
                    <Chip
                      label="Đã xác thực danh tính"
                      color="success"
                      size="small"
                    />
                  </Box>

                  {profileData.didInfo.registeredAt && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Ngày xác thực:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(profileData.didInfo.registeredAt).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="warning">
                  Bạn chưa có DID. Vui lòng thực hiện xác thực để tạo DID.
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
                  Nếu không phải bạn, vui lòng liên hệ hỗ trợ viên.
                </Typography>
              </Box>
            </Alert>
          </Box>
        )}
      </Container>
    </UserLayout>
  );
}
