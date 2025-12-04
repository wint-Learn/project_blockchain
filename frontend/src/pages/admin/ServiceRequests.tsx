import { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Tabs, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { Refresh, CheckCircle, Cancel } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { ethers } from 'ethers';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import StatusChip from '../../components/shared/StatusChip';
import api from '../../services/api';
import { useMetaMask } from '../../hooks/useMetaMask';

// Địa chỉ hợp đồng từ .env
const SERVICE_CONTRACT_ADDRESS = import.meta.env.SERVICE_CONTRACT_ADDRESS;

// ABI cho hợp đồng dịch vụ
const SERVICE_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_userAddress",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "_cccdHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "_serviceType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_data",
        "type": "string"
      }
    ],
    "name": "registerService",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

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
  cccd_number?: string;
  requested_at?: string;
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

const ServiceRequests = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { account, isConnected, connect } = useMetaMask();

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
        ? '/services/admin/pending'
        : '/services/admin/all';

      const response = await fetch(`http://localhost:3000/api${endpoint}`, {
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
    // Check MetaMask connection
    if (!isConnected || !account) {
      enqueueSnackbar('Vui lòng kết nối MetaMask trước', { variant: 'warning' });
      try {
        await connect();
        return; // User will need to click approve again after connecting
      } catch (error) {
        enqueueSnackbar('Không thể kết nối MetaMask', { variant: 'error' });
        return;
      }
    }

    setProcessing(true);

    try {
      // 1. Get provider from MetaMask
      if (!window.ethereum) {
        throw new Error('MetaMask không được cài đặt');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 2. Create contract instance with signer
      const contract = new ethers.Contract(
        SERVICE_CONTRACT_ADDRESS,
        SERVICE_CONTRACT_ABI,
        signer
      );

      // 3. Prepare transaction data
      const cccdNumber = request.cccd_number || request.service_data?.cccd_number || '';
      if (!cccdNumber) {
        throw new Error('Không tìm thấy số CCCD trong yêu cầu');
      }

      const cccdHash = ethers.keccak256(ethers.toUtf8Bytes(cccdNumber));
      const serviceData = JSON.stringify({
        cccd_number: cccdNumber,
        full_name: request.full_name || request.service_data?.full_name || '',
        requested_at: request.requested_at || request.created_at
      });

      enqueueSnackbar('Đang chờ xác nhận từ MetaMask...', { variant: 'info' });

      // 4. Call smart contract from frontend (MetaMask will pop up)
      const tx = await contract.registerService(
        request.wallet_address,
        cccdHash,
        request.service_type,
        serviceData
      );

      enqueueSnackbar('Đang xử lý giao dịch trên blockchain...', { variant: 'info' });

      // 5. Wait for transaction confirmation
      const receipt = await tx.wait();

      // 6. Send transaction hash to backend for database update
      const response = await api.post(`/services/admin/save-approval/${request.id}`, {
        tx_hash: receipt.hash,
        block_number: receipt.blockNumber,
        gas_used: receipt.gasUsed.toString(),
        admin_address: account
      });

      if (response.data.success) {
        enqueueSnackbar('Đã duyệt yêu cầu thành công! Gas đã trừ từ ví MetaMask của bạn.', {
          variant: 'success',
          autoHideDuration: 5000
        });
        fetchRequests();
      } else {
        enqueueSnackbar(response.data.message || 'Không thể lưu kết quả', { variant: 'error' });
      }
    } catch (err: any) {
      console.error('Approve error:', err);

      // Handle specific MetaMask errors
      if (err.code === 4001) {
        enqueueSnackbar('Bạn đã từ chối giao dịch trong MetaMask', { variant: 'warning' });
      } else if (err.code === -32002) {
        enqueueSnackbar('Vui lòng mở MetaMask và xác nhận yêu cầu', { variant: 'info' });
      } else if (err.message?.includes('insufficient funds')) {
        enqueueSnackbar('Không đủ ETH để trả gas. Vui lòng nạp thêm vào ví MetaMask.', { variant: 'error' });
      } else {
        enqueueSnackbar(
          err.response?.data?.message || err.message || 'Không thể duyệt yêu cầu',
          { variant: 'error' }
        );
      }
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
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      enqueueSnackbar('Vui lòng nhập lý do từ chối', { variant: 'warning' });
      return;
    }

    setProcessing(true);

    try {
      const response = await api.post(`/services/admin/reject/${selectedRequest.id}`, {
        rejectionReason: rejectionReason,
      });

      if (response.data.success) {
        enqueueSnackbar('Đã từ chối yêu cầu', { variant: 'success' });
        setRejectDialogOpen(false);
        fetchRequests();
      } else {
        enqueueSnackbar(response.data.message || 'Không thể từ chối yêu cầu', { variant: 'error' });
      }
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Không thể từ chối yêu cầu', { variant: 'error' });
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
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Quản lý dịch vụ</Typography>
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
              <LoadingSpinner message="Đang tải yêu cầu..." />
            ) : error ? (
              <EmptyState message={error} type="error" action={{ label: 'Thử lại', onClick: fetchRequests }} />
            ) : filteredRequests.length === 0 ? (
              <EmptyState message="Không có yêu cầu nào đang chờ duyệt" type="info" />
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
                        <TableCell>{request.id}</TableCell>
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
                          <StatusChip status={request.status} />
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
              <LoadingSpinner message="Đang tải yêu cầu..." />
            ) : error ? (
              <EmptyState message={error} type="error" action={{ label: 'Thử lại', onClick: fetchRequests }} />
            ) : requests.length === 0 ? (
              <EmptyState message="Chưa có yêu cầu nào" type="info" />
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
                    {requests.map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>{request.id}</TableCell>
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
          <DialogTitle>Từ chối yêu cầu {selectedRequest?.id}</DialogTitle>
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
    </AdminLayout>
  );
};

export default ServiceRequests;
