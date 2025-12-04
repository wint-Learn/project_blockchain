import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Search,
  AccountBalanceWallet,
  Link as LinkIcon,
  AccessTime,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import AdminLayout from '../../components/layout/AdminLayout';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';

interface BlockInfo {
  number: number;
  hash: string;
  timestamp: number;
  transactions: number;
  miner: string;
  gasUsed: string;
}

interface TransactionInfo {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: number;
  status: 'success' | 'failed';
}

const BlockchainExplorer = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [blocks, setBlocks] = useState<BlockInfo[]>([]);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockchainData();
  }, [activeTab]);

  const fetchBlockchainData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual blockchain API calls
      // For now, show placeholder data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      if (activeTab === 0) {
        setBlocks([
          {
            number: 12345,
            hash: '0x1234567890abcdef...',
            timestamp: Date.now() - 60000,
            transactions: 5,
            miner: '0xabcd...1234',
            gasUsed: '21000',
          },
        ]);
      } else {
        setTransactions([
          {
            hash: '0xabcdef1234567890...',
            from: '0x1234...5678',
            to: '0x9abc...def0',
            value: '1.5 ETH',
            blockNumber: 12345,
            timestamp: Date.now() - 120000,
            status: 'success',
          },
        ]);
      }
    } catch (err: any) {
      enqueueSnackbar(err.message || 'Không thể tải dữ liệu blockchain', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <LoadingSpinner message="Đang tải dữ liệu blockchain..." />
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Blockchain Explorer
        </Typography>

        {/* Info Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Đang kết nối với Ganache local blockchain</strong> - 
            Xem tất cả blocks và transactions của hệ thống DID.
          </Typography>
        </Alert>

        {/* Network Stats */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWallet color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Network
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    Ganache
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinkIcon color="success" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Latest Block
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    #12345
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: '1 1 200px' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="info" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Avg Block Time
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    ~15s
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Tìm block, transaction hash, hoặc address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Blocks" />
            <Tab label="Transactions" />
          </Tabs>
        </Box>

        {/* Blocks Table */}
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Block</TableCell>
                  <TableCell>Hash</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Txns</TableCell>
                  <TableCell>Miner</TableCell>
                  <TableCell>Gas Used</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState message="Chưa có blocks" type="info" />
                    </TableCell>
                  </TableRow>
                ) : (
                  blocks.map((block) => (
                    <TableRow key={block.number} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          #{block.number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                          {formatAddress(block.hash)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(block.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={block.transactions} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                          {formatAddress(block.miner)}
                        </Typography>
                      </TableCell>
                      <TableCell>{block.gasUsed}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Transactions Table */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tx Hash</TableCell>
                  <TableCell>Block</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState message="Chưa có transactions" type="info" />
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.hash} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem" color="primary">
                          {formatAddress(tx.hash)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">#{tx.blockNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                          {formatAddress(tx.from)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                          {formatAddress(tx.to)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {tx.value}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.status}
                          color={tx.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(tx.timestamp)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

      </Container>
    </AdminLayout>
  );
};

export default BlockchainExplorer;
