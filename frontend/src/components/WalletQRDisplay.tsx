import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy,
  Download,
  CheckCircle,
} from '@mui/icons-material';

interface WalletQRDisplayProps {
  open: boolean;
  onClose: () => void;
  qrCode: string; // Base64 QR code image
  walletAddress: string;
  mnemonic: string;
  privateKey?: string; // 🆕 Private key for development
}

/**
 * Component hiển thị QR code và mnemonic sau khi đăng ký thành công
 * User scan QR để import ví vào MetaMask
 */
const WalletQRDisplay = ({ open, onClose, qrCode, walletAddress, mnemonic, privateKey }: WalletQRDisplayProps) => {
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopiedMnemonic(true);
    setTimeout(() => setCopiedMnemonic(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyPrivateKey = () => {
    if (privateKey) {
      navigator.clipboard.writeText(privateKey);
      setCopiedPrivateKey(true);
      setTimeout(() => setCopiedPrivateKey(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `wallet-qr-${walletAddress.slice(0, 8)}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        🎉 Đăng Ký DID Thành Công!
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="success" sx={{ mb: 3 }}>
          <strong>Địa chỉ ví của bạn:</strong>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>
              {walletAddress}
            </Typography>
            <Tooltip title={copiedAddress ? 'Đã copy!' : 'Copy địa chỉ'}>
              <IconButton size="small" onClick={handleCopyAddress}>
                {copiedAddress ? <CheckCircle color="success" /> : <ContentCopy />}
              </IconButton>
            </Tooltip>
          </Box>
        </Alert>

        {/* 🆕 Development: Private Key Import (easier than QR for desktop MetaMask) */}
        {privateKey && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              💻 Cách 1: Import bằng Private Key (Desktop MetaMask)
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Hướng dẫn import vào MetaMask:</strong>
              </Typography>
              <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Mở MetaMask extension trên browser</li>
                <li>Click vào icon tài khoản → "Import Account"</li>
                <li>Chọn "Private Key"</li>
                <li>Paste private key bên dưới</li>
                <li>Click "Import"</li>
              </ol>
            </Alert>

            <Box 
              sx={{ 
                p: 2, 
                bgcolor: '#fff3e0', 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '13px',
                position: 'relative',
                wordBreak: 'break-all',
                border: '2px solid #ff9800',
              }}
            >
              <Typography variant="caption" color="error" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                ⚠️ PRIVATE KEY (Chỉ dùng cho development/testing):
              </Typography>
              {privateKey}
              <Tooltip title={copiedPrivateKey ? 'Đã copy!' : 'Copy private key'}>
                <IconButton 
                  size="small" 
                  onClick={handleCopyPrivateKey}
                  sx={{ position: 'absolute', top: 8, right: 8 }}
                >
                  {copiedPrivateKey ? <CheckCircle color="success" /> : <ContentCopy />}
                </IconButton>
              </Tooltip>
            </Box>
          </>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          📱 Cách 2: Quét QR Code (Mobile MetaMask)
        </Typography>
        
        <Box sx={{ textAlign: 'center', my: 3 }}>
          <img 
            src={qrCode} 
            alt="Wallet QR Code" 
            style={{ 
              maxWidth: '300px', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              padding: '10px',
            }} 
          />
          <Box sx={{ mt: 2 }}>
            <Button 
              startIcon={<Download />} 
              onClick={handleDownloadQR}
              variant="outlined"
              size="small"
            >
              Tải QR Code
            </Button>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Chỉ dành cho MetaMask Mobile. Desktop MetaMask không hỗ trợ quét QR.
          </Typography>
        </Alert>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          💾 Cách 3: Lưu Seed Phrase (12 từ khôi phục)
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>⚠️ Quan trọng:</strong> Ghi lại 12 từ này và giữ an toàn. 
          Đây là cách duy nhất để khôi phục ví nếu bạn mất điện thoại!
        </Alert>

        <Box 
          sx={{ 
            p: 2, 
            bgcolor: '#f5f5f5', 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '14px',
            position: 'relative',
          }}
        >
          {mnemonic}
          <Tooltip title={copiedMnemonic ? 'Đã copy!' : 'Copy seed phrase'}>
            <IconButton 
              size="small" 
              onClick={handleCopyMnemonic}
              sx={{ position: 'absolute', top: 8, right: 8 }}
            >
              {copiedMnemonic ? <CheckCircle color="success" /> : <ContentCopy />}
            </IconButton>
          </Tooltip>
        </Box>

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Sau khi import ví vào MetaMask, bạn có thể đăng nhập vào hệ thống 
            bằng cách kết nối ví và ký tin nhắn xác thực.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" fullWidth>
          Đã lưu xong, tiếp tục đăng nhập
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WalletQRDisplay;
