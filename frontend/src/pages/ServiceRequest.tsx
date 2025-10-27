import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { listServices, requestService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  requiredFields: any;
  processingTime: string;
  fee: string;
}

const ServiceRequest = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((state) => state.user);

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await listServices();
      if (response.data.success) {
        const foundService = response.data.services.find(
          (s: Service) => s.id === parseInt(serviceId || '0')
        );
        
        if (!foundService) {
          setError('Không tìm thấy dịch vụ');
          return;
        }

        setService(foundService);

        // Initialize form data with empty values for required fields
        const initialData: { [key: string]: string } = {};
        if (foundService.requiredFields) {
          Object.keys(foundService.requiredFields).forEach(key => {
            initialData[key] = '';
          });
        }
        setFormData(initialData);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải thông tin dịch vụ';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!user?.address) {
      enqueueSnackbar('Vui lòng đăng nhập để sử dụng dịch vụ', { variant: 'warning' });
      navigate('/login');
      return;
    }

    // Validate required fields
    if (service?.requiredFields) {
      const emptyFields = Object.keys(service.requiredFields).filter(
        key => !formData[key]?.trim()
      );

      if (emptyFields.length > 0) {
        enqueueSnackbar('Vui lòng điền đầy đủ thông tin', { variant: 'warning' });
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await requestService(parseInt(serviceId || '0'), {
        userAddress: user.address,
        requestData: formData,
      });

      if (response.data.success) {
        enqueueSnackbar('Đã gửi yêu cầu dịch vụ thành công!', { variant: 'success' });
        navigate('/my-services');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể gửi yêu cầu';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !service) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Không tìm thấy dịch vụ'}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/services')}>
            Quay lại danh sách dịch vụ
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/services')} sx={{ mb: 2 }}>
        Quay lại
      </Button>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {service.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {service.description}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Phí dịch vụ:
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="success.main">
              {service.fee}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Thời gian xử lý:
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {service.processingTime}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            Thông tin đăng ký
          </Typography>

          {service.requiredFields && Object.keys(service.requiredFields).length > 0 ? (
            Object.entries(service.requiredFields).map(([field, label]) => (
              <TextField
                key={field}
                label={label as string}
                fullWidth
                required
                value={formData[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                sx={{ mb: 2 }}
              />
            ))
          ) : (
            <TextField
              label="Ghi chú (tùy chọn)"
              fullWidth
              multiline
              rows={4}
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              sx={{ mb: 2 }}
            />
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/services')}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={<Send />}
              disabled={submitting}
            >
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ServiceRequest;
