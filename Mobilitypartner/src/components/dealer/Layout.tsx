import React, { ReactNode, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '@/contexts/LanguageContext';
import { removeTokenFromLocalStorage } from '@/utils/Auth';
import { apiGet, apiPost } from '@/utils/api';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

// Inactivity timeout duration: 30 minutes in milliseconds
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

interface LayoutProps {
  children: ReactNode;
}

interface User {
  id: number;
  email: string;
  name: string;
  companyName?: string;
  role: string;
  dealer?: any;
}

const DealerLayout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { language, toggleLanguage, t } = useLanguage();

  // Handle logout - wrapped in useCallback for use with inactivity hook
  const handleLogout = useCallback(async (isInactivityLogout = false) => {
    try {
      await apiPost('/api/auth/logout');
      removeTokenFromLocalStorage();
      sessionStorage.removeItem('dealerUser');

      // If it's an inactivity logout, add a query parameter to show message
      if (isInactivityLogout) {
        router.push('/login?reason=inactivity');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      removeTokenFromLocalStorage();
      sessionStorage.removeItem('dealerUser');
      if (isInactivityLogout) {
        router.push('/login?reason=inactivity');
      } else {
        router.push('/login');
      }
    }
  }, [router]);

  // Inactivity timeout - auto logout after 30 minutes of inactivity
  useInactivityTimeout({
    timeoutMs: INACTIVITY_TIMEOUT_MS,
    onTimeout: () => handleLogout(true),
    enabled: true
  });

  useEffect(() => {
    const fetchUser = async () => {
      // Check if user data is already in sessionStorage
      const cachedUser = sessionStorage.getItem('dealerUser');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          return;
        } catch (e) {
          // If cache is corrupted, fetch fresh data
          sessionStorage.removeItem('dealerUser');
        }
      }

      try {
        const response = await apiGet('/api/dealer/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Cache user data in sessionStorage
          sessionStorage.setItem('dealerUser', JSON.stringify(userData));

          // No need to redirect - dealers use this endpoint
        }
        else {
          // Auto-logout: clear token and redirect to login
          if (response.status === 401) {
            handleLogout()
          }
        }
      } catch (error) {
        console.error('Error fetching dealer user:', error);
      }
    };

    fetchUser();
  }, []);

  const isActive = (path: string) => router.pathname === path;

  const navItems = [
    {
      nameKey: 'dealer.nav.dashboard',
      name: 'Startsida',
      path: '/dealer',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      nameKey: 'dealer.nav.registerWarranty',
      name: 'Registrera garanti',
      path: '/warranties/register',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      nameKey: 'dealer.nav.warranties',
      name: 'Registrerade Garantier',
      path: '/warranties',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      nameKey: 'dealer.nav.settings',
      name: 'Inställningar',
      path: '/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-forest transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex items-center justify-center h-16 px-6 bg-primary-darker">
          <h1 className="heading-company text-white">{t('header.companyName')}</h1>
        </div>

        <nav className="mt-8">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center px-6 py-3 transition-colors duration-200 ${isActive(item.path) ? 'bg-white border-r-4 border-accent-teal hover:bg-neutral-light' : 'bg-primary-forest  hover:bg-neutral-darker  text-white'
                }`}>
                <span className="mr-3">{item.icon}</span>
                <span className="font-underrubriker font-medium">
                  {item.name || t(item.nameKey)}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6">
          <div className="mb-4 p-3 bg-primary-darker rounded-lg">
            {user && (
              <>
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-accent-teal flex items-center justify-center mr-3">
                    <span className="text-white font-medium text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white font-text-primary">{user.name}</p>
                    <p className="text-xs text-neutral-beige font-text-secondary">{user.companyName || user.dealer?.companyName}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full btn-secondary text-white bg-primary-forest hover:bg-primary-darker"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-neutral-beige">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-primary-dark hover:bg-neutral-beige transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-primary-forest">
                <span className="font-underrubriker">Återförsäljare Dashboard</span>
              </div>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center px-3 py-1 text-sm font-medium text-primary-dark bg-neutral-beige hover:bg-neutral-beige/80 rounded-md transition-colors duration-200"
                title="Toggle Language / Växla språk"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="uppercase font-bold">
                  {language === 'sv' ? 'EN' : 'SV'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DealerLayout;