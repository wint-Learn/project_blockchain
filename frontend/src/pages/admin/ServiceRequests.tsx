import { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import { Refresh, CheckCircle, Cancel } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../../store/useAuthStore';

interface ServiceRequest {
  id: number;
  wallet_address: string;
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
      id={`service-tabpanel-${index}`}
      aria-labelledby={`service-tab-${index}`}
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

const ServiceRequests = () => {
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((state) => state.user);

  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [tabValue]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = tabValue === 0 
        ? '/api/services/admin/pending'
        : '/api/services/admin/all';
      
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      } else {
        setError(data.message || 'Không thể tải danh sách yêu cầu');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải danh sách yêu cầu';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: ServiceRequest) => {
    if (!user?.address) {
      enqueueSnackbar('Vui lòng đăng nhập', { variant: 'warning' });
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`http://localhost:3000/api/services/admin/approve/${request.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminAddress: user.address,
        }),
      });

      const data = await response.json();

      if (data.success) {
        enqueueSnackbar('Đã duyệt yêu cầu thành công!', { variant: 'success' });
        fetchRequests();
      } else {
        enqueueSnackbar(data.message || 'Không thể duyệt yêu cầu', { variant: 'error' });
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Không thể duyệt yêu cầu', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest || !user?.address) return;

    if (!rejectionReason.trim()) {
      enqueueSnackbar('Vui lòng nhập lý do từ chối', { variant: 'warning' });
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`http://localhost:3000/api/services/admin/reject/${selectedRequest.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminAddress: user.address,
          rejectionReason: rejectionReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        enqueueSnackbar('Đã từ chối yêu cầu', { variant: 'success' });
        setRejectDialogOpen(false);
        fetchRequests();
      } else {
        enqueueSnackbar(data.message || 'Không thể từ chối yêu cầu', { variant: 'error' });
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Không thể từ chối yêu cầu', { variant: 'error' });
    } finally {
      setProcessing(false);
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

  const filteredRequests = tabValue === 0 
    ? requests.filter(r => r.status === 'pending')
    : requests;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Quản lý dịch vụ</Typography>
        <Button startIcon={<Refresh />} onClick={fetchRequests} disabled={loading}>
          Làm mới
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Chờ duyệt" />
          <Tab label="Tất cả" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : filteredRequests.length === 0 ? (
            <Alert severity="info">Không có yêu cầu nào đang chờ duyệt</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Người nộp</TableCell>
                    <TableCell>Dịch vụ</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày nộp</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>#{request.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {request.full_name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {request.wallet_address.substring(0, 10)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {serviceTypeLabels[request.service_type] || request.service_type}
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
                          {formatDate(request.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleApprove(request)}
                              disabled={processing}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => handleRejectClick(request)}
                              disabled={processing}
                            >
                              Từ chối
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : filteredRequests.length === 0 ? (
            <Alert severity="info">Chưa có yêu cầu nào</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Người nộp</TableCell>
                    <TableCell>Dịch vụ</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày nộp</TableCell>
                    <TableCell>Blockchain TX</TableCell>
                    <TableCell>Ghi chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>#{request.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {request.full_name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {request.wallet_address.substring(0, 10)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {serviceTypeLabels[request.service_type] || request.service_type}
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
                        {request.status === 'approved' && (
                          <Typography variant="body2" color="success.main">
                            Service ID: {request.service_id}
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Từ chối yêu cầu #{selectedRequest?.id}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Lý do từ chối"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Nhập lý do từ chối yêu cầu này..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={processing}>
            Hủy
          </Button>
          <Button onClick={handleRejectConfirm} variant="contained" color="error" disabled={processing}>
            {processing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ServiceRequests;
