import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Home from './pages/Home';
import RegisterMetaMask from './pages/RegisterMetaMask';
import LoginMetaMask from './pages/LoginMetaMask';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import Services from './pages/Services';
import ServiceRequest from './pages/ServiceRequest';
import MyServices from './pages/MyServices';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';

// Tạo theme MUI
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/verify" element={<Verify />} />
            
            {/* MetaMask Authentication (Primary) */}
            <Route path="/register" element={<RegisterMetaMask />} />
            <Route path="/login" element={<LoginMetaMask />} />
            
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            
            {/* Service Routes */}
            <Route path="/services" element={<Services />} />
            <Route path="/services/:serviceId/request" element={<ServiceRequest />} />
            <Route
              path="/my-services"
              element={
                <PrivateRoute>
                  <MyServices />
                </PrivateRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
