import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme'; // Import custom theme
import Home from './pages/Home';
import RegisterMetaMask from './pages/RegisterMetaMask';
import LoginMetaMask from './pages/LoginMetaMask';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Verify from './pages/Verify';
import Services from './pages/Services';
import ServiceRequest from './pages/ServiceRequest';
import MyServices from './pages/MyServices';
import ActivityHistory from './pages/ActivityHistory';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ServiceRequests from './pages/admin/ServiceRequests';
import RegisteredUsers from './pages/admin/RegisteredUsers';
import PreVerifiedCCCD from './pages/admin/PreVerifiedCCCD';
import PrivateRoute from './components/PrivateRoute';

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
            
            {/* 🆕 Profile Page */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
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
            <Route
              path="/activity"
              element={
                <PrivateRoute>
                  <ActivityHistory />
                </PrivateRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<RegisteredUsers />} />
            <Route path="/admin/cccd" element={<PreVerifiedCCCD />} />
            <Route path="/admin/services" element={<ServiceRequests />} />
          </Routes>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
