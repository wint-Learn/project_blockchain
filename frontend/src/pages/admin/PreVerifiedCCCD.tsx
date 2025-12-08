import { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Search, Refresh, Visibility } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import StatusChip from '../../components/shared/StatusChip';
import api from '../../services/api';

interface CCCDRecord {
  id: number;
  cccd_number_hash: string;
  cccd_number?: string;  // Optional - may not be available
  full_name?: string;     // Optional - may not be available
  date_of_birth?: string; // Optional
  gender?: string;        // Optional
  address?: string;       // Optional
  issue_date?: string;    // Optional
  phone_number: string;
  status: 'pending' | 'verified' | 'claimed' | 'blacklisted';
  notes?: string;
  verified_at?: string;
  claimed_at?: string;
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

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/admin/cccd');
      if (response.data.success) {
        setRecords(response.data.records || []); // Changed from .data to .records
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

  const filteredRecords = records.filter(
    (record) =>
      (record.cccd_number_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.cccd_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <Typography variant="h5">Xác minh người dùng</Typography>
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
                  <TableCell>ID</TableCell>
                  <TableCell>CCCD Hash</TableCell>
                  <TableCell>Số điện thoại</TableCell>
                  <TableCell>Ghi chú</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        #{record.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                        {record.cccd_number || `${record.cccd_number_hash?.substring(0, 16)}...`}
                      </Typography>
                    </TableCell>
                    <TableCell>{record.phone_number}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                        {record.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={record.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDetail(record)}
                      >
                        Chi tiết
                      </Button>
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
                  <Typography variant="caption" color="text.secondary">CCCD Hash</Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedRecord.cccd_number_hash}
                  </Typography>
                </Box>
                {selectedRecord.cccd_number && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Số CCCD</Typography>
                    <Typography variant="body1" fontFamily="monospace" fontWeight="bold">
                      {selectedRecord.cccd_number}
                    </Typography>
                  </Box>
                )}
                {selectedRecord.full_name && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Họ tên</Typography>
                    <Typography variant="body1">{selectedRecord.full_name}</Typography>
                  </Box>
                )}
                {selectedRecord.date_of_birth && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Ngày sinh</Typography>
                    <Typography variant="body1">{formatDate(selectedRecord.date_of_birth)}</Typography>
                  </Box>
                )}
                {selectedRecord.gender && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Giới tính</Typography>
                    <Typography variant="body1">{selectedRecord.gender}</Typography>
                  </Box>
                )}
                {selectedRecord.address && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Địa chỉ</Typography>
                    <Typography variant="body1">{selectedRecord.address}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Số điện thoại</Typography>
                  <Typography variant="body1">{selectedRecord.phone_number}</Typography>
                </Box>
                {selectedRecord.notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Ghi chú</Typography>
                    <Typography variant="body1">{selectedRecord.notes}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="caption" color="text.secondary">Trạng thái</Typography>
                  <Box sx={{ mt: 1 }}>
                    <StatusChip status={selectedRecord.status} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Ngày tạo</Typography>
                  <Typography variant="body2">{formatDate(selectedRecord.created_at)}</Typography>
                </Box>
                {selectedRecord.verified_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Ngày xác minh</Typography>
                    <Typography variant="body2">{formatDate(selectedRecord.verified_at)}</Typography>
                  </Box>
                )}
                {selectedRecord.claimed_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Ngày liên kết</Typography>
                    <Typography variant="body2">{formatDate(selectedRecord.claimed_at)}</Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
};

export default PreVerifiedCCCD;
