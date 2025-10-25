import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ArrowBack, Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getMyServices } from '../services/api';

interface ServiceRequest {
  id: number;
  serviceName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestData: any;
  adminNotes?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: { [key: string]: 'warning' | 'success' | 'error' } = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

const statusLabels: { [key: string]: string } = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Đã từ chối',
};

const MyServices = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyServices();
  }, []);

  const fetchMyServices = async () => {
    setLoading(true);
    setError('');

    // Check if user is logged in
    const userAddress = localStorage.getItem('userAddress');
    if (!userAddress) {
      enqueueSnackbar('Vui lòng đăng nhập để xem dịch vụ của bạn', { variant: 'warning' });
      navigate('/login');
      return;
    }

    try {
      const response = await getMyServices(userAddress);
      if (response.data.success) {
        setRequests(response.data.requests);
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
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/services')}>
            Quay lại danh sách dịch vụ
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dịch vụ của tôi</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button startIcon={<Refresh />} onClick={fetchMyServices}>
            Làm mới
          </Button>
          <Button variant="outlined" onClick={() => navigate('/services')}>
            Đăng ký dịch vụ mới
          </Button>
        </Box>
      </Box>

      {requests.length === 0 ? (
        <Alert severity="info">
          Bạn chưa đăng ký dịch vụ nào.{' '}
          <Button onClick={() => navigate('/services')} sx={{ ml: 1 }}>
            Xem danh sách dịch vụ
          </Button>
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã yêu cầu</TableCell>
                <TableCell>Tên dịch vụ</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày nộp</TableCell>
                <TableCell>Ngày cập nhật</TableCell>
                <TableCell>Ghi chú</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>#{request.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {request.serviceName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[request.status]}
                      color={statusColors[request.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(request.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(request.updatedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {request.status === 'approved' && request.adminNotes && (
                      <Typography variant="body2" color="success.main">
                        {request.adminNotes}
                      </Typography>
                    )}
                    {request.status === 'rejected' && request.rejectReason && (
                      <Typography variant="body2" color="error.main">
                        {request.rejectReason}
                      </Typography>
                    )}
                    {request.status === 'pending' && (
                      <Typography variant="body2" color="text.secondary">
                        Đang chờ xử lý
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
  );
};

export default MyServices;
