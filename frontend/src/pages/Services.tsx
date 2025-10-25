import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Description,
  AccountBalance,
  LocalHospital,
  DirectionsCar,
  Business,
  School,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { listServices } from '../services/api';

interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  requiredFields: any;
  processingTime: string;
  fee: string;
  isActive: boolean;
}

const categoryIcons: { [key: string]: any } = {
  government: <AccountBalance />,
  health: <LocalHospital />,
  transport: <DirectionsCar />,
  business: <Business />,
  education: <School />,
  other: <Description />,
};

const Services = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

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
        setServices(response.data.services);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải danh sách dịch vụ';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = (serviceId: number) => {
    // Check if user is logged in
    const userAddress = localStorage.getItem('userAddress');
    if (!userAddress) {
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
        <Grid container spacing={3}>
          {services.map((service) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={service.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: service.isActive ? 1 : 0.6,
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
                      {categoryIcons[service.category] || categoryIcons.other}
                    </Box>
                    <Box>
                      <Typography variant="h6" component="div">
                        {service.name}
                      </Typography>
                      <Chip
                        label={service.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {service.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Thời gian xử lý:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {service.processingTime}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Phí dịch vụ:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {service.fee}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={!service.isActive}
                    onClick={() => handleRequestService(service.id)}
                  >
                    {service.isActive ? 'Đăng ký dịch vụ' : 'Tạm ngưng'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
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
