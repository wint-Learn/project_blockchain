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
  Button,
  Box,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Search, Refresh, Visibility, Block } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import StatusChip from '../../components/shared/StatusChip';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import api from '../../services/api';

interface CCCDRecord {
  id: number;
  cccd_number: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  address: string;
  issue_date: string;
  phone_number: string;
  is_blacklisted: boolean;
  created_at: string;
}

const PreVerifiedCCCD = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [records, setRecords] = useState<CCCDRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<CCCDRecord | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/api/admin/cccd');
      if (response.data.success) {
        setRecords(response.data.data);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Không thể tải danh sách CCCD';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record: CCCDRecord) => {
    setSelectedRecord(record);
    setDetailDialogOpen(true);
  };

  const handleBlacklist = (record: CCCDRecord) => {
    setSelectedRecord(record);
    setBlacklistDialogOpen(true);
  };

  const handleBlacklistConfirm = async () => {
    if (!selectedRecord) return;

    setProcessing(true);
    try {
      await api.put(`/api/admin/cccd/${selectedRecord.id}/blacklist`, {
        reason: 'Admin blacklist from UI'
      });
      enqueueSnackbar('Đã chặn CCCD thành công', { variant: 'success' });
      setBlacklistDialogOpen(false);
      fetchRecords();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Lỗi khi chặn CCCD', { variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const filteredRecords = records.filter(
    (record) =>
      record.cccd_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <LoadingSpinner message="Đang tải danh sách CCCD..." />
        </Container>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <EmptyState 
            message={error} 
            type="error" 
            action={{ label: 'Thử lại', onClick: fetchRecords }} 
          />
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">CCCD Pre-verified</Typography>
          <Button startIcon={<Refresh />} onClick={fetchRecords}>
            Làm mới
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Tìm theo số CCCD, họ tên, hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {filteredRecords.length === 0 ? (
          <EmptyState 
            message={searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có CCCD pre-verified nào'} 
            type="info" 
          />
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Số CCCD</TableCell>
                  <TableCell>Họ tên</TableCell>
                  <TableCell>Ngày sinh</TableCell>
                  <TableCell>Giới tính</TableCell>
                  <TableCell>Số điện thoại</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {record.cccd_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {record.full_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(record.date_of_birth)}</TableCell>
                    <TableCell>{record.gender === 'Nam' ? '👨' : '👩'} {record.gender}</TableCell>
                    <TableCell>{record.phone_number}</TableCell>
                    <TableCell>
                      <StatusChip status={record.is_blacklisted ? 'blacklisted' : 'active'} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleViewDetail(record)}
                        >
                          Chi tiết
                        </Button>
                        {!record.is_blacklisted && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Block />}
                            onClick={() => handleBlacklist(record)}
                          >
                            Chặn
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Detail Dialog */}
        <Dialog 
          open={detailDialogOpen} 
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Chi tiết CCCD</DialogTitle>
          <DialogContent>
            {selectedRecord && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Số CCCD</Typography>
                  <Typography variant="body1" fontFamily="monospace" fontWeight="bold">
                    {selectedRecord.cccd_number}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Họ tên</Typography>
                  <Typography variant="body1">{selectedRecord.full_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Ngày sinh</Typography>
                  <Typography variant="body1">{formatDate(selectedRecord.date_of_birth)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Giới tính</Typography>
                  <Typography variant="body1">{selectedRecord.gender}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Địa chỉ</Typography>
                  <Typography variant="body1">{selectedRecord.address}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Số điện thoại</Typography>
                  <Typography variant="body1">{selectedRecord.phone_number}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Ngày cấp</Typography>
                  <Typography variant="body1">{formatDate(selectedRecord.issue_date)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Trạng thái</Typography>
                  <Box sx={{ mt: 1 }}>
                    <StatusChip status={selectedRecord.is_blacklisted ? 'blacklisted' : 'active'} />
                  </Box>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Blacklist Confirm Dialog */}
        <ConfirmDialog
          open={blacklistDialogOpen}
          title="Xác nhận chặn CCCD"
          message={`Bạn có chắc chắn muốn chặn CCCD ${selectedRecord?.cccd_number} (${selectedRecord?.full_name})? Người dùng này sẽ không thể đăng ký DID.`}
          confirmText="Xác nhận chặn"
          cancelText="Hủy"
          severity="error"
          loading={processing}
          onConfirm={handleBlacklistConfirm}
          onCancel={() => setBlacklistDialogOpen(false)}
        />
      </Container>
    </AdminLayout>
  );
};

export default PreVerifiedCCCD;
