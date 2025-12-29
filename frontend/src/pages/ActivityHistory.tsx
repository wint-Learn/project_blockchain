import { useState, useEffect } from 'react';
import {
  Container, Box, Paper, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Typography
} from '@mui/material';
import { Refresh, Login, Description } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../store/useAuthStore';
import UserLayout from '../components/layout/UserLayout';
import api from '../services/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';
import StatusChip from '../components/shared/StatusChip';

interface LoginActivity {
  id: number;
  wallet_address: string;
  ip_address: string;
  user_agent: string;
  login_time: string;
  location?: string;
}

interface ServiceActivity {
  id: number;
  service_type: string;
  status: 'pending' | 'approved' | 'rejected';
  tx_hash?: string;
  service_id?: number;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`activity-tabpanel-${index}`}
      aria-labelledby={`activity-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const serviceTypeLabels: { [key: string]: string } = {
  business_registration: 'Đăng ký kinh doanh',
  vehicle_registration: 'Đăng ký xe máy',
};

const ActivityHistory = () => {
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((state) => state.user);

  const [tabValue, setTabValue] = useState(0);
  const [loginActivities, setLoginActivities] = useState<LoginActivity[]>([]);
  const [serviceActivities, setServiceActivities] = useState<ServiceActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.address) {
      fetchActivities();
    }
  }, [user?.address]);

  const fetchActivities = async () => {
    setLoading(true);
    setError('');

    if (!user?.address) {
      setError('Thiếu địa chỉ ví. Vui lòng đăng nhập lại.');
      setLoading(false);
      return;
    }

    try {
      // Fetch login activities
      const loginResponse = await api.get('/activity/login', {
        params: { walletAddress: user.address }
      });
      if (loginResponse.data.success) {
        setLoginActivities(loginResponse.data.data || []);
      }

      // Fetch service activities
      const serviceResponse = await api.get('/services/my-requests', {
        params: { walletAddress: user.address }
      });
      if (serviceResponse.data.success) {
        setServiceActivities(serviceResponse.data.data || []);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải lịch sử hoạt động';
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
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <UserLayout title="Lịch sử hoạt động" showBackButton={true}>
        <Container maxWidth="lg">
          <LoadingSpinner message="Đang tải lịch sử hoạt động..." />
        </Container>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout title="Lịch sử hoạt động" showBackButton={true}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <EmptyState 
            message={error} 
            type="error" 
            action={{ label: 'Thử lại', onClick: fetchActivities }} 
          />
        </Container>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="Lịch sử hoạt động" showBackButton={true}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button startIcon={<Refresh />} onClick={fetchActivities}>
            Làm mới
          </Button>
        </Box>

        <Paper>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Login />} iconPosition="start" label="Đăng nhập" />
          <Tab icon={<Description />} iconPosition="start" label="Dịch vụ công" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {loginActivities.length === 0 ? (
            <EmptyState message="Chưa có lịch sử đăng nhập" type="info" />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thời gian</TableCell>
                    <TableCell>Địa chỉ IP</TableCell>
                    <TableCell>Thiết bị</TableCell>
                    <TableCell>Vị trí</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loginActivities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(activity.login_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {activity.ip_address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {activity.user_agent}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {activity.location || 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {serviceActivities.length === 0 ? (
            <EmptyState message="Chưa có hoạt động dịch vụ công" type="info" />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Dịch vụ</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày yêu cầu</TableCell>
                    <TableCell>Admin xử lý</TableCell>
                    <TableCell>Blockchain TX</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {serviceActivities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell>#{activity.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {serviceTypeLabels[activity.service_type] || activity.service_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={activity.status} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(activity.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {activity.approved_by ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {activity.approved_by.substring(0, 10)}...
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.approved_at ? formatDate(activity.approved_at) : ''}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.tx_hash ? (
                          <Box>
                            <Typography variant="body2" color="primary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              {activity.tx_hash.substring(0, 10)}...{activity.tx_hash.substring(activity.tx_hash.length - 8)}
                            </Typography>
                            {activity.service_id !== undefined && (
                              <Typography variant="caption" color="success.main">
                                Service ID: {activity.service_id}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
      </Container>
    </UserLayout>
  );
};

export default ActivityHistory;
