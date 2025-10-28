import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  DirectionsCar,
  Business,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { listServices } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface ServiceField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface Service {
  id: string; // 'business_registration' or 'vehicle_registration'
  name: string;
  description: string;
  icon: string;
  fields: ServiceField[];
}

const Services = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((state) => state.user);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await listServices();
      if (response.data.success) {
        setServices(response.data.data); // Fix: data.data instead of data.services
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải danh sách dịch vụ';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = (serviceId: string) => {
    // Check if user is logged in
    if (!user?.address) {
      enqueueSnackbar('Vui lòng đăng nhập để sử dụng dịch vụ', { variant: 'warning' });
      navigate('/login');
      return;
    }

    navigate(`/services/${serviceId}/request`);
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
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dịch vụ công trực tuyến
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Sử dụng DID của bạn để đăng ký các dịch vụ công một cách nhanh chóng và bảo mật
      </Typography>

      {services.length === 0 ? (
        <Alert severity="info">Hiện tại chưa có dịch vụ nào</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {services.map((service) => (
            <Box key={service.id} sx={{ flex: '1 1 calc(50% - 24px)', minWidth: 300 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 1,
                        mr: 2,
                      }}
                    >
                      {service.icon === 'business' ? <Business /> : <DirectionsCar />}
                    </Box>
                    <Box>
                      <Typography variant="h6" component="div">
                        {service.name}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {service.description}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Số trường bắt buộc: {service.fields?.filter(f => f.required).length || 0}
                  </Typography>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleRequestService(service.id)}
                  >
                    Đăng ký dịch vụ
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button variant="outlined" onClick={() => navigate('/my-services')}>
          Xem dịch vụ của tôi
        </Button>
      </Box>
    </Container>
  );
};

export default Services;
