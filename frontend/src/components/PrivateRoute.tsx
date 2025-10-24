import { useEffect, useState } from 'react';
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
  const [isHydrated, setIsHydrated] = useState(false);

  // Đợi Zustand persist hydrate xong
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  console.log('[PrivateRoute] Hydrated:', isHydrated, 'User:', user);

  // Đợi hydration xong mới check user
  if (!isHydrated) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('[PrivateRoute] No user, redirecting to /login');
    // Redirect về trang login nếu chưa đăng nhập
    return <Navigate to="/login" replace />;
  }

  console.log('[PrivateRoute] User authenticated, rendering Dashboard');
  return <>{children}</>;
}
