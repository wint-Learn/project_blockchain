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
    const { signMessage } = useMetaMask();

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
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [useExistingWallet, setUseExistingWallet] = useState(false); // 🆕 Option to use existing wallet
    const [selectedAccount, setSelectedAccount] = useState<string>(''); // 🆕 Selected account from MetaMask
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

    // 🆕 Connect MetaMask and let user select account in MetaMask popup
    const handleConnectMetaMask = async () => {
        const { ethereum } = window as any;

        if (!ethereum || !ethereum.isMetaMask) {
            enqueueSnackbar('MetaMask chưa được cài đặt', { variant: 'error' });
            return;
        }

        try {
            setLoading(true);
            
            // Request permissions - this will show MetaMask's account selector popup
            await ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }],
            });

            // After user selects account, get the selected account
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            
            if (accounts.length === 0) {
                enqueueSnackbar('Không có ví nào được chọn', { variant: 'warning' });
                setLoading(false);
                return;
            }

            const selectedAccount = accounts[0]; // User's selected account from MetaMask popup
            setSelectedAccount(selectedAccount);
            setLoading(false);
            
            enqueueSnackbar(`✅ Đã chọn ví: ${selectedAccount.substring(0, 10)}...`, { variant: 'success' });
        } catch (error: any) {
            console.error('Error connecting MetaMask:', error);
            if (error.code === 4001) {
                enqueueSnackbar('Bạn đã từ chối kết nối MetaMask', { variant: 'warning' });
            } else {
                enqueueSnackbar('Lỗi kết nối MetaMask', { variant: 'error' });
            }
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        // Validation
        if (!formData.cccdNumber || !formData.fullName || !formData.dateOfBirth ||
            !formData.gender || !formData.address || !formData.issueDate || !formData.phoneNumber) {
            enqueueSnackbar('Vui lòng điền đầy đủ thông tin', { variant: 'warning' });
            return;
        }

        // If user wants to use existing wallet but hasn't selected one yet
        if (useExistingWallet && !selectedAccount) {
            enqueueSnackbar('Vui lòng chọn ví MetaMask', { variant: 'warning' });
            return;
        }

        setLoading(true);
        try {
            console.log('🔍 DEBUG: useExistingWallet =', useExistingWallet);
            console.log('🔍 DEBUG: selectedAccount =', selectedAccount);
            
            let signature = null;

            // If user wants to use existing wallet, sign message with selected account
            if (useExistingWallet && selectedAccount) {
                console.log('✅ User chose to use existing wallet:', selectedAccount);
                
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

            // Build request data - only include walletAddress/signature if user chose existing wallet
            const requestData: any = {
                ...formData,
                verificationToken,
            };

            console.log('🔍 DEBUG: Before adding wallet fields, useExistingWallet =', useExistingWallet);
            console.log('🔍 DEBUG: selectedAccount =', selectedAccount);
            console.log('🔍 DEBUG: signature =', signature ? 'EXISTS' : 'NULL');

            // Only add walletAddress and signature if user wants to use existing wallet
            if (useExistingWallet && selectedAccount && signature) {
                console.log('✅ Adding walletAddress and signature to request');
                requestData.walletAddress = selectedAccount;
                requestData.signature = signature;
            } else {
                console.log('❌ NOT adding walletAddress - auto-gen wallet will be used');
            }

            console.log('📤 Sending request data:', { ...requestData, signature: requestData.signature ? 'EXISTS' : undefined });

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

            // Handle specific error cases with appropriate messages and actions
            const errorData = error.response?.data;
            const errorMessage = errorData?.error || errorData?.message || 'Đăng ký thất bại';
            const errorCode = errorData?.code;

            if (errorMessage.includes('CCCD already registered') || errorMessage.includes('CCCD đã được đăng ký')) {
                enqueueSnackbar(
                    'Số CCCD này đã được đăng ký trên blockchain. Vui lòng sử dụng chức năng đăng nhập.',
                    { variant: 'warning' }
                );
                // Auto redirect to login after 3 seconds
                setTimeout(() => navigate('/login'), 3000);
            } else if (errorMessage.includes('Address already has DID') || errorMessage.includes('Địa chỉ ví đã có DID')) {
                enqueueSnackbar(
                    'Địa chỉ ví này đã được đăng ký DID rồi. Vui lòng sử dụng ví khác hoặc đăng nhập.',
                    { variant: 'warning' }
                );
                setTimeout(() => navigate('/login'), 3000);
            } else if (errorCode === 'CCCD_NOT_VERIFIED' || errorMessage.includes('chưa được xác thực OTP')) {
                enqueueSnackbar(
                    'Số CCCD chưa được xác thực OTP. Vui lòng xác thực lại.',
                    { variant: 'error' }
                );
                // Redirect to verify page
                setTimeout(() => navigate('/verify'), 2000);
            } else if (errorCode === 'CCCD_ALREADY_EXISTS' || errorMessage.includes('đã được đăng ký với địa chỉ ví khác')) {
                enqueueSnackbar(
                    errorMessage + ' Vui lòng liên hệ hỗ trợ nếu bạn đã quên thông tin ví.',
                    { variant: 'error' }
                );
            } else if (errorCode === 'INVALID_PUBLIC_KEY' || errorMessage.includes('Invalid public key')) {
                enqueueSnackbar(
                    'Lỗi xác thực public key. Vui lòng thử lại hoặc chọn tạo ví mới.',
                    { variant: 'error' }
                );
            } else {
                enqueueSnackbar(errorMessage, { variant: 'error' });
            }
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
                    </Box>

                    {/* 🆕 Option: Use existing MetaMask wallet */}
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={useExistingWallet}
                                    onChange={(e) => {
                                        setUseExistingWallet(e.target.checked);
                                        if (!e.target.checked) {
                                            // Reset account selection when unchecked
                                            setSelectedAccount('');
                                        }
                                    }}
                                    disabled={loading}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        Sử dụng ví MetaMask có sẵn
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {useExistingWallet
                                            ? '✅ Sẽ chọn ví từ MetaMask. Không cần import ví mới.'
                                            : 'Backend sẽ tạo ví mới và bạn cần import vào MetaMask.'}
                                    </Typography>
                                </Box>
                            }
                        />

                        {/* 🆕 Show button to connect MetaMask */}
                        {useExistingWallet && !selectedAccount && (
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleConnectMetaMask}
                                    disabled={loading}
                                    fullWidth
                                >
                                    Chọn ví từ MetaMask
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                                    MetaMask sẽ hiển thị danh sách ví để bạn chọn
                                </Typography>
                            </Box>
                        )}

                        {/* 🆕 Show selected account */}
                        {useExistingWallet && selectedAccount && (
                            <Box sx={{ mt: 2 }}>
                                <Alert severity="success" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body2" fontWeight="bold">
                                            Ví đã chọn
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                            {selectedAccount}
                                        </Typography>
                                    </Box>
                                </Alert>
                                <Button
                                    variant="text"
                                    onClick={handleConnectMetaMask}
                                    disabled={loading}
                                    size="small"
                                    sx={{ mt: 1 }}
                                >
                                    🔄 Chọn ví khác
                                </Button>
                            </Box>
                        )}
                    </Box>

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleRegister}
                        disabled={loading || !verificationToken || (useExistingWallet && !selectedAccount)}
                        sx={{ mt: 4 }}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Đăng Ký DID'}
                    </Button>

                    {/* 🆕 Show helper text if user needs to select wallet */}
                    {useExistingWallet && !selectedAccount && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Vui lòng kết nối MetaMask và chọn ví trước khi đăng ký
                        </Alert>
                    )}

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
