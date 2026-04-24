import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { removeTokenFromLocalStorage } from '@/utils/Auth';
import { apiGet, apiPost } from '@/utils/api';
import { Permission } from '@prisma/client';
import { canAccessRoute } from '@/utils/permissions';

interface LayoutProps {
  children: ReactNode;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  permissions: { permission: string }[];
}

const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if we should show initial loading screen
  const cachedUserExists = typeof window !== 'undefined' && sessionStorage.getItem('adminUser');
  const [initialLoad, setInitialLoad] = useState(!cachedUserExists);
  const { language, toggleLanguage, t } = useLanguage();

  // Fetch user on mount only once
  useEffect(() => {
    const fetchUser = async () => {
      // Check if user data is already in sessionStorage
      const cachedUser = sessionStorage.getItem('adminUser');
      if (cachedUser) {
        try {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          setLoading(false);
          setInitialLoad(false);
          return;
        } catch (e) {
          // If cache is corrupted, fetch fresh data
          sessionStorage.removeItem('adminUser');
        }
      }

      try {
        const response = await apiGet('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Cache user data in sessionStorage
          sessionStorage.setItem('adminUser', JSON.stringify(userData));

          // Redirect non-admin users to dealer portal
          // Note: Dealers now authenticate separately, so this handles DEALER_STAFF only
          if (userData.role === 'DEALER' || userData.role === 'DEALER_STAFF') {
            router.push('/dealer');
          }
        }
        if (response.status === 401) {
          handleLogout()
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchUser();
  }, []);

  // Check route permissions when route or user changes
  useEffect(() => {
    if (!user || loading) return;

    if (user.role === 'ADMIN') {
      const currentPath = router.pathname;
      const hasAccess = canAccessRoute(user, currentPath);

      if (!hasAccess) {
        // Redirect to first accessible route
        const userPermissions = user.permissions.map(p => p.permission);

        if (user.isSuperAdmin || userPermissions.includes(Permission.DASHBOARD)) {
          router.push('/admin');
        } else {
          // Find first accessible route (defined below)
          const navItems = getNavItems();
          const firstAccessibleItem = navItems.find(item =>
            userPermissions.includes(item.permission)
          );

          if (firstAccessibleItem) {
            router.push(firstAccessibleItem.path);
          } else {
            // No permissions
            console.error('User has no permissions');
            router.push('/login');
          }
        }
      }
    }
  }, [router.pathname, user, loading]);

  const isActive = (path: string) => router.pathname == path;

  const getNavItems = () => [
    {
      nameKey: 'nav.dashboard',
      path: '/admin',
      permission: Permission.DASHBOARD,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      nameKey: 'nav.dealers',
      path: '/admin/dealers',
      permission: Permission.DEALERS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      nameKey: 'nav.newDealer',
      path: '/admin/dealers/new',
      permission: Permission.NEW_DEALER,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      nameKey: 'nav.products',
      path: '/admin/products',
      permission: Permission.PRODUCTS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      nameKey: 'nav.warranties',
      path: '/admin/warranties',
      permission: Permission.REGISTERED_PRODUCTS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      nameKey: 'nav.claims',
      path: '/admin/claims',
      permission: Permission.CLAIMS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      nameKey: 'nav.finance',
      path: '/admin/finance',
      permission: Permission.FINANCE,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      nameKey: 'nav.settings',
      path: '/admin/settings',
      permission: Permission.SETTINGS,
      icon: <Settings className="w-5 h-5" />
    },
    {
      nameKey: 'nav.auditLog',
      path: '/admin/audit-log',
      permission: Permission.SETTINGS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    }
  ];

  const navItems = getNavItems();

  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter(item => {
    if (!user) return false;

    // Super admin can see all items
    if (user.isSuperAdmin) return true;

    // Check if user has the required permission
    return user.permissions.some(p => p.permission === item.permission);
  });

  const handleLogout = async () => {
    try {
      await apiPost('/api/auth/logout');

      // Remove token from localStorage and cached user data
      removeTokenFromLocalStorage();
      sessionStorage.removeItem('adminUser');

      // Redirect based on user role
      // const loginPath = (user?.role === 'DEALER' || user?.role === 'DEALER_STAFF') ? '/dealer/login' : '/admin/login';
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove token even if logout request fails
      removeTokenFromLocalStorage();
      sessionStorage.removeItem('adminUser');
      // const loginPath = (user?.role === 'DEALER' || user?.role === 'DEALER_STAFF') ? '/dealer/login' : '/admin/login';
      router.push('/login');
    }
  };

  // Show loading state only on initial load
  if (initialLoad) {
    return (
      <div className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-primary-dark">Loading...</div>
      </div>
    );
  }

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
          <h1 className="heading-company   text-white">{t('header.companyName')}</h1>
        </div>

        <nav className="mt-8">
          {visibleNavItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center px-6 py-3 transition-colors duration-200 ${isActive(item.path) ? 'bg-white border-r-4 border-accent-teal hover:bg-neutral-light' : 'bg-primary-forest  hover:bg-neutral-darker  text-white'
                }`}>
                <span className="mr-3">{item.icon}</span>
                <span className="font-underrubriker font-medium">{t(item.nameKey)}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6">
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
                <span className="font-underrubriker">{t('header.adminDashboard')}</span>
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

export default AdminLayout;