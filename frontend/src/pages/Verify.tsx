import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { requestOTP, verifyOTP } from '../services/api';

const steps = ['Nhập thông tin CCCD', 'Xác thực OTP'];

const Verify = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    // Step management
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form data
    const [cccdNumber, setCccdNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');

    // Error & Info
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    // Step 1: Request OTP
    const handleRequestOTP = async () => {
        setError('');
        setInfo('');

        // Validation
        if (!cccdNumber || !phoneNumber) {
            setError('Vui lòng nhập đầy đủ số CCCD và số điện thoại');
            return;
        }

        if (cccdNumber.length !== 12) {
            setError('Số CCCD phải có 12 chữ số');
            return;
        }

        if (!/^0[0-9]{9,10}$/.test(phoneNumber)) {
            setError('Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10-11 chữ số)');
            return;
        }

        setLoading(true);

        try {
            const response = await requestOTP({
                cccdNumber: cccdNumber.trim(),
                phoneNumber: phoneNumber.trim(),
            });

            if (response.data.success) {
                enqueueSnackbar('Mã OTP đã được gửi đến số điện thoại của bạn', {
                    variant: 'success',
                });
                setInfo(`Mã OTP đã được gửi đến số ${phoneNumber}`);
                setActiveStep(1);
            }
        } catch (err: any) {
            const errorMsg =
                err.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng kiểm tra lại thông tin.';
            setError(errorMsg);
            enqueueSnackbar(errorMsg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async () => {
        setError('');

        if (!otpCode) {
            setError('Vui lòng nhập mã OTP');
            return;
        }

        if (otpCode.length !== 6) {
            setError('Mã OTP phải có 6 chữ số');
            return;
        }

        setLoading(true);

        try {
            const response = await verifyOTP({
                cccdNumber: cccdNumber.trim(),
                otp: otpCode.trim(),
            });

            if (response.data.success) {
                const verificationToken = response.data.verificationToken;
                const citizenInfo = response.data.citizenInfo; // 🆕 Get auto-filled citizen info from gov DB

                enqueueSnackbar('Xác thực thành công! Chuyển đến trang đăng ký...', {
                    variant: 'success',
                });

                // Navigate to Register page with verification token + auto-filled citizen info
                setTimeout(() => {
                    navigate('/register', {
                        state: {
                            verificationToken,
                            cccdNumber,
                            phoneNumber,
                            citizenInfo, // 🆕 Pass citizen info from government database
                        },
                    });
                }, 1500);
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn';
            setError(errorMsg);
            enqueueSnackbar(errorMsg, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Back button handler
    const handleBack = () => {
        setActiveStep(0);
        setOtpCode('');
        setError('');
        setInfo('');
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Xác thực CCCD
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Để đăng ký DID, bạn cần xác thực số CCCD và số điện thoại
                </Typography>

                {/* Stepper */}
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Info Alert */}
                {info && (
                    <Alert severity="info" sx={{ mb: 2 }} onClose={() => setInfo('')}>
                        {info}
                    </Alert>
                )}

                {/* Step 1: CCCD & Phone Input */}
                {activeStep === 0 && (
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleRequestOTP(); }}>
                        <TextField
                            fullWidth
                            label="Số CCCD"
                            variant="outlined"
                            margin="normal"
                            value={cccdNumber}
                            onChange={(e) => setCccdNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="036202001111"
                            inputProps={{ maxLength: 12 }}
                            required
                            helperText="Nhập 12 chữ số CCCD"
                        />

                        <TextField
                            fullWidth
                            label="Số điện thoại"
                            variant="outlined"
                            margin="normal"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="0971234567"
                            inputProps={{ maxLength: 11 }}
                            required
                            helperText="Số điện thoại đã đăng ký với CCCD"
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{ mt: 3 }}
                            onClick={handleRequestOTP}
                            disabled={loading}
                            type="submit"
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Gửi mã OTP'}
                        </Button>

                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/')}
                        >
                            Quay lại
                        </Button>
                    </Box>
                )}

                {/* Step 2: OTP Input */}
                {activeStep === 1 && (
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleVerifyOTP(); }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Mã OTP đã được gửi đến số điện thoại <strong>{phoneNumber}</strong>
                        </Typography>

                        <TextField
                            fullWidth
                            label="Mã OTP"
                            variant="outlined"
                            margin="normal"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            inputProps={{ maxLength: 6 }}
                            required
                            helperText="Nhập mã OTP gồm 6 chữ số"
                            autoFocus
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{ mt: 3 }}
                            onClick={handleVerifyOTP}
                            disabled={loading}
                            type="submit"
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Xác thực OTP'}
                        </Button>

                        <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            sx={{ mt: 2 }}
                            onClick={handleBack}
                            disabled={loading}
                        >
                            Quay lại
                        </Button>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Button
                                variant="text"
                                size="small"
                                onClick={handleRequestOTP}
                                disabled={loading}
                            >
                                Gửi lại mã OTP
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default Verify;
