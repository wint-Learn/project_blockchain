import { useState, useEffect } from 'react';
import {
  Container,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import { Search, Refresh, Visibility } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';

interface User {
  id: number;
  wallet_address: string;
  cccd_hash: string;
  cccd_number_hash: string;
  created_at: string;
  full_name?: string;
  phone_number?: string;
  cccd_number?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
}

const RegisteredUsers = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.message || 'Không thể tải danh sách người dùng');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Không thể tải danh sách người dùng';
      setError(errorMsg);
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedUser(null);
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

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.wallet_address.toLowerCase().includes(searchLower) ||
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.phone_number?.includes(searchLower) ||
      user.cccd_number?.includes(searchLower)
    );
  });

  return (
    <AdminLayout title="Người dùng đã đăng ký">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Header & Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Danh sách người dùng đã đăng ký DID
          </Typography>
          <Button startIcon={<Refresh />} onClick={fetchUsers} disabled={loading} variant="outlined">
            Làm mới
          </Button>
        </Box>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo địa chỉ ví, tên, số điện thoại, CCCD..."
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
        </Box>

        {/* Table */}
        <Paper>
          {loading ? (
            <LoadingSpinner message="Đang tải danh sách người dùng..." />
          ) : error ? (
            <EmptyState
              message={error}
              type="error"
              action={{ label: 'Thử lại', onClick: fetchUsers }}
            />
          ) : filteredUsers.length === 0 ? (
            <EmptyState message="Không tìm thấy người dùng nào" type="info" />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>Địa chỉ ví</TableCell>
                    <TableCell>Số CCCD</TableCell>
                    <TableCell>SĐT</TableCell>
                    <TableCell>Ngày đăng ký</TableCell>
                    <TableCell align="center">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {user.full_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {user.wallet_address.substring(0, 10)}...{user.wallet_address.substring(38)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {user.cccd_number || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.phone_number || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(user.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => handleViewDetail(user)}>
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* Total count */}
        {!loading && !error && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {filteredUsers.length} / {users.length} người dùng
            </Typography>
          </Box>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
          <DialogTitle>
            Chi tiết người dùng {selectedUser?.id}
          </DialogTitle>
          <DialogContent dividers>
            {selectedUser && (
              <Stack spacing={3}>
                {/* Personal Info Section */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Thông tin cá nhân
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Họ và tên</Typography>
                      <Typography variant="body1" fontWeight="bold">{selectedUser.full_name || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Số CCCD</Typography>
                      <Typography variant="body1" fontWeight="bold">{selectedUser.cccd_number || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Ngày sinh</Typography>
                        <Typography variant="body2">{selectedUser.date_of_birth || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Giới tính</Typography>
                        <Typography variant="body2">{selectedUser.gender || 'N/A'}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Số điện thoại</Typography>
                        <Typography variant="body2">{selectedUser.phone_number || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">Ngày đăng ký</Typography>
                        <Typography variant="body2">{formatDate(selectedUser.created_at)}</Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Địa chỉ</Typography>
                      <Typography variant="body2">{selectedUser.address || 'N/A'}</Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Blockchain Info Section */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Thông tin Blockchain
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Wallet Address</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                        {selectedUser.wallet_address}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">CCCD Hash</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                        {selectedUser.cccd_hash}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetail}>Đóng</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
};

export default RegisteredUsers;
