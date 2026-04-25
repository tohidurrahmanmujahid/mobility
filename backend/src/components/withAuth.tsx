import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getTokenFromLocalStorage, decodeToken } from '@/utils/Auth';
import Loader from '@/components/Loader';

interface WithAuthOptions {
  allowedRoles?: string[];
  redirectTo?: string;
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { allowedRoles, redirectTo = '/login' } = options;

  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        const token = getTokenFromLocalStorage();

        if (!token) {
          router.push(redirectTo);
          return;
        }

        const decoded = decodeToken(token);

        if (!decoded) {
          router.push(redirectTo);
          return;
        }

        // Check if user has required role
        if (allowedRoles && allowedRoles.length > 0) {
          if (!allowedRoles.includes(decoded.role)) {
            // Redirect to appropriate page based on role
            if (decoded.role === 'ADMIN') {
              router.push('/admin');
            } else if (decoded.role === 'DEALER' || decoded.role === 'DEALER_STAFF' || decoded.role === 'STAFF') {
              router.push('/warranties');
            } else {
              router.push(redirectTo);
            }
            return;
          }
        }

        setIsAuthenticated(true);
        setIsLoading(false);
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="large" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
