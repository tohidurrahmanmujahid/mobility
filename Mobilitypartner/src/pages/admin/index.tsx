import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Building2, ClipboardList, Wrench, DollarSign } from 'lucide-react';
import AdminLayout from '@/components/admin/Layout';
import { apiGet } from '@/utils/api';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/Loader';
import { withAuth } from '@/components/withAuth';

interface DashboardStats {
  totalDealers: number;
  totalWarranties: number;
  activeClaims: number;
  pendingInvoices: number;
  recentWarranties: Array<{
    id: number;
    vehicleRegistrationNumber: string;
    dealer: {
      companyName: string;
    };
    product: {
      name: string;
    };
    createdAt: string;
  }>;
  recentClaims: Array<{
    id: number;
    warranty: {
      vehicleRegistrationNumber: string;
      dealer: {
        companyName: string;
      };
    };
    status: string;
    createdAt: string;
  }>;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dealersRes, warrantiesRes, claimsRes] = await Promise.all([
          apiGet('/api/admin/dealers'),
          apiGet('/api/admin/warranties?limit=5'),
          apiGet('/api/admin/claims?limit=5')
        ]);

        // if (!dealersRes.ok || !warrantiesRes.ok || !claimsRes.ok) {
        //   throw new Error('Failed to fetch dashboard data');
        // }

        const [dealersData, warrantiesData, claimsData] = await Promise.all([
          dealersRes.json(),
          warrantiesRes.json(),
          claimsRes.json()
        ]);

        setStats({
          totalDealers: dealersData?.dealers?.length,
          totalWarranties: warrantiesData?.pagination?.total,
          activeClaims: claimsData?.pagination?.total,
          pendingInvoices: 0, // TODO: Add invoice API
          recentWarranties: warrantiesData.warranties,
          recentClaims: claimsData.claims
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loader className="h-64" size="large" />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="alert-error">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="heading-primary">{t('dashboard.title')}</h1>
          <p className="body-text mt-2">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-accent-teal rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-primary-forest font-underrubriker">{t('dashboard.dealers')}</p>
                  <p className="text-2xl font-bold text-primary-dark">{stats?.totalDealers || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-accent-gold rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-primary-forest font-underrubriker">{t('dashboard.warranties')}</p>
                  <p className="text-2xl font-bold text-primary-dark">{stats?.totalWarranties || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-dark rounded-lg flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-primary-forest font-underrubriker">{t('dashboard.activeClaims')}</p>
                  <p className="text-2xl font-bold text-primary-dark">{stats?.activeClaims || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-primary-forest font-underrubriker">{t('dashboard.pendingInvoices')}</p>
                  <p className="text-2xl font-bold text-primary-dark">{stats?.pendingInvoices || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Warranties */}
          <div className="card">
            <div className="card-header">
              <h2 className="heading-secondary">{t('dashboard.recentWarranties')}</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {stats?.recentWarranties?.map((warranty) => (
                  <div key={warranty.id} className="flex items-center justify-between border-b border-neutral-beige pb-3">
                    <div>
                      <p className="font-underrubriker font-medium text-primary-dark">
                        {warranty.vehicleRegistrationNumber}
                      </p>
                      <p className="text-sm text-primary-forest">
                        {warranty.dealer.companyName} - {warranty.product.name}
                      </p>
                    </div>
                    <div className="text-sm text-primary-forest">
                      {formatDate(warranty.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/admin/warranties')}
                  className="btn-secondary w-full"
                >
                  {t('dashboard.viewAllWarranties')}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Claims */}
          <div className="card">
            <div className="card-header">
              <h2 className="heading-secondary">{t('dashboard.recentClaims')}</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {stats?.recentClaims?.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between border-b border-neutral-beige pb-3">
                    <div>
                      <p className="font-underrubriker font-medium text-primary-dark">
                        {claim.warranty.vehicleRegistrationNumber}
                      </p>
                      <p className="text-sm text-primary-forest">
                        {claim.warranty.dealer.companyName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        claim.status === 'SUBMITTED' ? 'bg-accent-gold/20 text-accent-gold' :
                        claim.status === 'APPROVED' ? 'bg-accent-teal/20 text-accent-teal' :
                        'bg-neutral-beige text-primary-forest'
                      }`}>
                        {claim.status}
                      </span>
                      <p className="text-xs text-primary-forest mt-1">
                        {formatDate(claim.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/admin/claims')}
                  className="btn-secondary w-full"
                >
                  {t('dashboard.viewAllClaims')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAuth(AdminDashboard, { allowedRoles: ['ADMIN'] });