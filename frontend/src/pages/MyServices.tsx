import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Paper,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getMyServices } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import UserLayout from '../components/layout/UserLayout';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import StatusChip from '../components/shared/StatusChip';

interface ServiceRequest {
  id: number;
  service_type: string;
  status: 'pending' | 'approved' | 'rejected';
  service_data: any;
  rejection_reason?: string;
  tx_hash?: string;
  service_id?: number;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

const serviceTypeLabels: { [key: string]: string } = {
  business_registration: 'Đăng ký kinh doanh',
  vehicle_registration: 'Đăng ký xe máy',
};

const MyServices = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((state) => state.user);

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('[MyServices] Component mounted or user changed');
    console.log('[MyServices] User:', user);
    console.log('[MyServices] User address:', user?.address);
    
    // Wait a bit for auth store to load from localStorage
    const timer = setTimeout(() => {
      if (user?.address) {
        fetchMyServices();
      } else {
        setError('Vui lòng đăng nhập để xem dịch vụ của bạn');
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user?.address]);

  const fetchMyServices = async () => {
    setLoading(true);
    setError('');

    // Check if user is logged in
    if (!user?.address) {
      setError('Thiếu địa chỉ ví. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    try {
      const response = await getMyServices(user.address);
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải danh sách yêu cầu';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <UserLayout title="Dịch vụ của tôi" showBackButton={true}>
        <Container maxWidth="lg">
          <LoadingSpinner message="Đang tải danh sách dịch vụ..." />
        </Container>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout title="Dịch vụ của tôi" showBackButton={true}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <EmptyState 
            message={error} 
            type="error" 
            action={{ label: 'Thử lại', onClick: fetchMyServices }} 
          />
        </Container>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Dịch vụ của tôi" showBackButton={true}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 3 }}>
          <Button startIcon={<Refresh />} onClick={fetchMyServices}>
            Làm mới
          </Button>
          <Button variant="outlined" onClick={() => navigate('/services')}>
            Đăng ký dịch vụ mới
          </Button>
        </Box>

        {requests.length === 0 ? (
          <EmptyState 
            message="Bạn chưa đăng ký dịch vụ nào." 
            type="info"
            action={{ label: 'Xem danh sách dịch vụ', onClick: () => navigate('/services') }}
          />
        ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã yêu cầu</TableCell>
                <TableCell>Tên dịch vụ</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày nộp</TableCell>
                <TableCell>Blockchain TX</TableCell>
                <TableCell>Ghi chú</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>#{request.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {serviceTypeLabels[request.service_type] || request.service_type}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={request.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(request.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {request.tx_hash ? (
                      <Typography variant="body2" color="primary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {request.tx_hash.substring(0, 10)}...{request.tx_hash.substring(request.tx_hash.length - 8)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {request.status === 'rejected' && request.rejection_reason && (
                      <Typography variant="body2" color="error.main">
                        {request.rejection_reason}
                      </Typography>
                    )}
                    {request.status === 'pending' && (
                      <Typography variant="body2" color="text.secondary">
                        Đang chờ xử lý
                      </Typography>
                    )}
                    {request.status === 'approved' && (
                      <Typography variant="body2" color="success.main">
                        Đã duyệt (Service ID: {request.service_id})
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      </Container>
    </UserLayout>
  );
};

export default MyServices;
