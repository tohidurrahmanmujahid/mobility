import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { setTokenToLocalStorage, getTokenFromLocalStorage, decodeToken } from '@/utils/Auth';
import { apiPost } from '@/utils/api';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [subdomain, setSubdomain] = useState<string>('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [inactivityMessage, setInactivityMessage] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  // Check if user was logged out due to inactivity
  useEffect(() => {
    if (router.query.reason === 'inactivity') {
      setInactivityMessage(true);
      // Remove the query parameter from URL without refreshing
      router.replace('/login', undefined, { shallow: true });
    }
  }, [router.query.reason, router]);

  // Handle impersonation token from admin
  useEffect(() => {
    const impersonateToken = router.query.impersonate;
    if (impersonateToken && typeof impersonateToken === 'string') {
      // Verify and use the impersonation token
      handleImpersonation(impersonateToken);
    }
  }, [router.query.impersonate]);

  const handleImpersonation = async (impersonateToken: string) => {
    setLoading(true);
    setError('');

    try {
      // Call API to validate impersonation token and get session
      const response = await apiPost('/api/dealer/auth/impersonate', { token: impersonateToken }, { includeAuth: false });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        if (data.token) {
          setTokenToLocalStorage(data.token);
        }

        // Store user info in sessionStorage for the layout
        if (data.user) {
          sessionStorage.setItem('dealerUser', JSON.stringify(data.user));
        }

        // Redirect to dealer dashboard
        router.push('/dealer');
      } else {
        setError(data.message || 'Impersonation failed');
        // Remove the impersonate parameter from URL
        router.replace('/login', undefined, { shallow: true });
      }
    } catch (error) {
      setError('Impersonation failed. Please try again.');
      router.replace('/login', undefined, { shallow: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Detect subdomain on client side
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');

      // If hostname has more than 2 parts (e.g., dealer.example.com)
      // and first part is not 'www', treat it as subdomain
      if (parts.length > 2 && parts[0] !== 'www') {
        setSubdomain(parts[0]);
      } else if (parts.length === 2 && parts[0] !== 'www' && hostname !== 'localhost') {
        // Handle cases like dealer.localhost or when using IP
        setSubdomain(parts[0]);
      }
    }
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const token = getTokenFromLocalStorage();
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.role) {
        // User is authenticated, redirect to appropriate page
        if (decoded.role === 'ADMIN') {
          router.push('/admin');
        } else if (decoded.role === 'DEALER' || decoded.role === 'DEALER_STAFF' || decoded.role === 'STAFF') {
          router.push('/warranties');
        }
        return;
      }
    }
    setCheckingAuth(false);
  }, [router]);

  const getPortalTitle = () => {
    if (subdomain === 'admin') return 'Admin Portal';
    if (subdomain === 'dealer') return 'Partner Portal';
    return 'Login Portal';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Determine which API endpoint to use based on subdomain
      let loginEndpoint = '/api/auth/login';
      let redirectPath = '/admin';

      if (subdomain === 'dealer') {
        // Use dealer login endpoint
        loginEndpoint = '/api/dealer/auth/login';
        redirectPath = '/dealer';
      }

      const response = await apiPost(loginEndpoint, { email, password }, { includeAuth: false });

      const data = await response.json();

      if (response.ok) {
        const userRole = data.user.role;

        // Subdomain-based access control
        if (subdomain === 'dealer') {
          // Dealer subdomain: only allow DEALER and DEALER_STAFF
          if (userRole !== 'DEALER' && userRole !== 'DEALER_STAFF' && userRole !== 'STAFF') {
            setError(t('auth.dealerAccessOnly'));
            setLoading(false);
            return;
          }
        } else if (subdomain === 'admin') {
          // Admin subdomain: only allow ADMIN
          if (userRole !== 'ADMIN') {
            setError(t('auth.adminAccessOnly'));
            setLoading(false);
            return;
          }
        }

        // Store token in localStorage as fallback
        if (data.token) {
          setTokenToLocalStorage(data.token);
        }

        // Redirect based on user role
        if (userRole === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dealer');
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError(t('error.generalError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url(/picture.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(1px)'
        }}
      />
      <Head>
        <title>Login - Mobility Partner</title>
      </Head>

      <div className="card max-w-sm w-full relative z-10">
        <div className="card-body space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/Mobilitypartnerlogo_mini.PNG"
                alt="Mobility Partner Logo"
                width={120}
                height={120}
                className="h-auto"
                priority
              />
            </div>
            <h2 className="heading-primary text-center">
              {t('auth.signInTitle')}
            </h2>
            <p className="mt-2 text-center subheading-small text-primary-forest">
              {getPortalTitle()}
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {inactivityMessage && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('auth.inactivityLogout')}</span>
                </div>
              </div>
            )}
            {error && (
              <div className="alert-error">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  {t('auth.emailAddress')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  placeholder={t('auth.emailAddress')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="form-input"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href="/forgot-password" className="font-underrubriker font-medium text-accent-teal hover:text-accent-teal/80 transition-colors duration-200">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}