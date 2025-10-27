import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { registerWithMetaMask } from '../services/api';
import WalletQRDisplay from '../components/WalletQRDisplay';
import { useMetaMask } from '../hooks/useMetaMask';

export default function RegisterMetaMask() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const { account, connect, isConnected, signMessage } = useMetaMask();

  // Get verification token + auto-filled citizen info from Verify page
  const verificationToken = location.state?.verificationToken;
  const verifiedCCCD = location.state?.cccdNumber;
  const verifiedPhone = location.state?.phoneNumber;
  const citizenInfo = location.state?.citizenInfo; // 🆕 Auto-filled from gov database

  // Form state - initialize with auto-filled data if available
  const [formData, setFormData] = useState({
    cccdNumber: verifiedCCCD || '',
    fullName: citizenInfo?.fullName || '',
    dateOfBirth: citizenInfo?.dateOfBirth || '',
    gender: citizenInfo?.gender || '',
    address: citizenInfo?.address || '',
    issueDate: citizenInfo?.issueDate || '',
    phoneNumber: verifiedPhone || citizenInfo?.phoneNumber || '',
    placeOfOrigin: citizenInfo?.placeOfOrigin || '',
    placeOfResidence: citizenInfo?.placeOfResidence || '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [useExistingWallet, setUseExistingWallet] = useState(false); // 🆕 Option to use existing wallet
  const [walletInfo, setWalletInfo] = useState<{
    qrCode: string;
    address: string;
    mnemonic: string;
    privateKey: string;
  } | null>(null);

  // Check verification token
  useEffect(() => {
    if (!verificationToken) {
      enqueueSnackbar(
        'Bạn cần xác thực CCCD trước. Chuyển hướng...',
        { variant: 'warning' }
      );
      setTimeout(() => navigate('/verify'), 2000);
    } else {
      enqueueSnackbar(
        `✅ CCCD ${verifiedCCCD} đã xác thực`,
        { variant: 'success' }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationToken, verifiedCCCD, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Validation
    if (!formData.cccdNumber || !formData.fullName || !formData.dateOfBirth || 
        !formData.gender || !formData.address || !formData.issueDate || !formData.phoneNumber) {
      enqueueSnackbar('Vui lòng điền đầy đủ thông tin', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      let walletAddress = null;
      let signature = null;
      
      // If user wants to use existing wallet, connect MetaMask and sign message
      if (useExistingWallet) {
        if (!isConnected) {
          enqueueSnackbar('Đang kết nối MetaMask...', { variant: 'info' });
          walletAddress = await connect();
          
          if (!walletAddress) {
            enqueueSnackbar('Không thể kết nối MetaMask', { variant: 'error' });
            setLoading(false);
            return;
          }
        } else {
          walletAddress = account;
        }
        
        // Sign message to prove wallet ownership and recover public key
        try {
          enqueueSnackbar('Vui lòng ký xác nhận trong MetaMask...', { variant: 'info' });
          signature = await signMessage('Register DID for e-Government');
          
          if (!signature) {
            enqueueSnackbar('Cần ký xác nhận để đăng ký DID', { variant: 'warning' });
            setLoading(false);
            return;
          }
        } catch (signError: any) {
          enqueueSnackbar('Không thể ký xác nhận. Vui lòng thử lại.', { variant: 'error' });
          setLoading(false);
          return;
        }
      }
      
      const requestData = {
        ...formData,
        verificationToken,
        walletAddress, // 🆕 Send existing wallet address if user chose this option
        signature, // 🆕 Send signature to recover public key
      };
      
      const response = await registerWithMetaMask(requestData);

      if (response.data.success) {
        enqueueSnackbar(response.data.message, { variant: 'success' });
        
        if (useExistingWallet) {
          // User used existing wallet - go directly to login
          setTimeout(() => navigate('/login'), 2000);
        } else {
          // Backend created new wallet - show QR/private key dialog
          setWalletInfo({
            qrCode: response.data.qrCode,
            address: response.data.wallet.address,
            mnemonic: response.data.wallet.mnemonic,
            privateKey: response.data.wallet.privateKey,
          });
          setShowQR(true);
        }
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error.response?.data);
      enqueueSnackbar(
        error.response?.data?.error || error.response?.data?.message || 'Đăng ký thất bại',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQR = () => {
    setShowQR(false);
    navigate('/login');
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Đăng Ký DID với MetaMask
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          {citizenInfo ? (
            <>
              <strong>✅ Thông tin công dân đã được tự động điền từ cơ sở dữ liệu Chính phủ</strong>
              <br />
              Vui lòng kiểm tra thông tin và xác nhận để tạo DID.
              <br />
              <em>Lưu ý: Bạn không thể chỉnh sửa thông tin vì dữ liệu này được lấy từ CCCD đã xác thực.</em>
            </>
          ) : (
            <>
              Hệ thống sẽ tạo ví blockchain cho bạn. Sau khi đăng ký, bạn sẽ nhận được:
              <ul>
                <li><strong>QR Code</strong> để import ví vào MetaMask</li>
                <li><strong>Seed Phrase</strong> (12 từ) để khôi phục ví</li>
              </ul>
            </>
          )}
        </Alert>

        {verificationToken && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ CCCD <strong>{verifiedCCCD}</strong> đã được xác thực | 
            SĐT: <strong>{verifiedPhone}</strong>
          </Alert>
        )}

        <Box component="form" sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
              <TextField
                label="Số CCCD"
                fullWidth
                required
                value={formData.cccdNumber}
                onChange={(e) => handleInputChange('cccdNumber', e.target.value)}
                disabled={!!verifiedCCCD || !!citizenInfo}
                helperText={verifiedCCCD ? 'Đã xác thực' : '12 số'}
              />
            </Box>

            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
              <TextField
                label="Số điện thoại"
                fullWidth
                required
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                disabled={!!verifiedPhone || !!citizenInfo}
                helperText={citizenInfo ? 'Từ cơ sở dữ liệu Chính phủ' : 'Dùng để mã hóa QR code'}
              />
            </Box>

            <Box sx={{ flex: '1 1 100%' }}>
              <TextField
                label="Họ và tên"
                fullWidth
                required
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                disabled={!!citizenInfo}
                helperText={citizenInfo ? 'Từ cơ sở dữ liệu Chính phủ' : ''}
              />
            </Box>

            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
              <TextField
                label="Ngày sinh"
                type="date"
                fullWidth
                required
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!!citizenInfo}
                helperText={citizenInfo ? 'Từ cơ sở dữ liệu Chính phủ' : ''}
              />
            </Box>

            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
              <TextField
                label="Giới tính"
                fullWidth
                required
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                placeholder="Nam / Nữ"
                disabled={!!citizenInfo}
                helperText={citizenInfo ? 'Từ cơ sở dữ liệu Chính phủ' : ''}
              />
            </Box>

            <Box sx={{ flex: '1 1 100%' }}>
              <TextField
                label="Địa chỉ"
                fullWidth
                required
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!!citizenInfo}
                helperText={citizenInfo ? 'Từ cơ sở dữ liệu Chính phủ' : ''}
              />
            </Box>

            <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
              <TextField
                label="Ngày cấp"
                type="date"
                fullWidth
                required
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!!citizenInfo}
                helperText={citizenInfo ? 'Từ cơ sở dữ liệu Chính phủ' : ''}
              />
            </Box>

            {/* 🆕 Optional: Display additional fields from gov DB */}
            {citizenInfo?.placeOfOrigin && (
              <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                <TextField
                  label="Quê quán"
                  fullWidth
                  value={formData.placeOfOrigin}
                  disabled
                  helperText="Từ cơ sở dữ liệu Chính phủ"
                />
              </Box>
            )}

            {citizenInfo?.placeOfResidence && (
              <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 200 }}>
                <TextField
                  label="Nơi thường trú"
                  fullWidth
                  value={formData.placeOfResidence}
                  disabled
                  helperText="Từ cơ sở dữ liệu Chính phủ"
                />
              </Box>
            )}
          </Box>

          {/* 🆕 Option: Use existing MetaMask wallet */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useExistingWallet}
                  onChange={(e) => setUseExistingWallet(e.target.checked)}
                  disabled={loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Sử dụng ví MetaMask hiện tại (Ganache account)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {useExistingWallet
                      ? '✅ Sẽ dùng ví đang kết nối. Không cần import ví mới.'
                      : 'Backend sẽ tạo ví mới và bạn cần import vào MetaMask.'}
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleRegister}
            disabled={loading || !verificationToken}
            sx={{ mt: 4 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Đăng Ký DID'}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => navigate('/verify')}
            sx={{ mt: 2 }}
          >
            Quay lại xác thực
          </Button>
        </Box>
      </Paper>

      {/* QR Code Dialog */}
      {walletInfo && (
        <WalletQRDisplay
          open={showQR}
          onClose={handleCloseQR}
          qrCode={walletInfo.qrCode}
          walletAddress={walletInfo.address}
          mnemonic={walletInfo.mnemonic}
          privateKey={walletInfo.privateKey}
        />
      )}
    </Container>
  );
}
