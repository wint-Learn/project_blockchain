import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Component bảo vệ routes - chỉ cho phép truy cập khi đã đăng nhập
 */
export default function PrivateRoute({ children }: PrivateRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    // Redirect về trang login nếu chưa đăng nhập
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
