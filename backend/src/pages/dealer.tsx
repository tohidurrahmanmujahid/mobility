import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import DealerLayout from '@/components/dealer/Layout';
import AdminLayout from '@/components/admin/Layout';
import WarrantyRegistrationModal from '@/components/dealer/WarrantyRegistrationModal';
import { apiGet } from '@/utils/api';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/Loader';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  dealer: any;
}

export default function DealerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [dealerData, setDealerData] = useState<any>(null);
  const router = useRouter();
  const { dealerId, adminView } = router.query;
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (adminView && dealerId) {
          // Admin viewing specific dealer
          const dealerResponse = await apiGet(`/api/admin/dealers`);
          if (dealerResponse.ok) {
            const dealersData = await dealerResponse.json();
            const specificDealer = dealersData.dealers.find((d: any) => d.id === parseInt(dealerId as string));
            if (specificDealer) {
              setDealerData(specificDealer);
              // Fetch warranties for this dealer
              const warrantiesResponse = await apiGet(`/api/admin/warranties?dealerId=${dealerId}`);
              if (warrantiesResponse.ok) {
                const warrantiesData = await warrantiesResponse.json();
                setWarranties(warrantiesData.warranties || []);
              }
            }
          }
        } else {
          // Regular dealer login
          const userResponse = await apiGet('/api/dealer/auth/me');
          if (!userResponse.ok) {
            router.push('/login');
            return;
          }
          const userData = await userResponse.json();
          setUser(userData);

          // Fetch warranties (fetch all for dashboard stats)
          const warrantiesResponse = await apiGet('/api/warranties?limit=1000');
          if (warrantiesResponse.ok) {
            const warrantiesData = await warrantiesResponse.json();
            setWarranties(warrantiesData.warranties || []);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (!adminView) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchData();
  }, [router, dealerId, adminView]);


  const displayUser = adminView && dealerData ? {
    name: dealerData.contactPerson || dealerData.companyName,
    dealer: dealerData
  } : user;

  const LayoutComponent = adminView ? AdminLayout : DealerLayout;

  return (
    <LayoutComponent>
      <Head>
        <title>Dealer Dashboard</title>
      </Head>
      {initialLoad ? (
        <Loader className="h-64" size="large" />
      ) : (
        <div className="space-y-6">
          {adminView && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-blue-800 font-medium">
                  {t('dealers.adminView').replace('{companyName}', dealerData?.companyName || '')}
                </span>
                <button
                  onClick={() => router.push('/admin/dealers')}
                  className="ml-auto text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  {t('dealers.backToAdmin')}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <h1 className="heading-primary">
                {t('dealer.welcome').replace('{name}', displayUser?.name || '')}
              </h1>
              <p className="body-text mt-2">
                {displayUser?.dealer?.companyName || 'Your dealership'}
              </p>
            </div>
            <button
              onClick={() => setShowWarrantyModal(true)}
              className="btn-primary bg-accent-teal hover:bg-accent-teal/90 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{t('dealer.registerWarranty')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-accent-teal mb-2">
                  {warranties.length}
                </div>
                <div className="text-sm text-primary-forest">{t('dashboard.totalWarranties')}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-accent-teal mb-2">
                  {warranties.filter((w: any) => w.status === 'ACTIVE').length}
                </div>
                <div className="text-sm text-primary-forest">{t('dashboard.activeWarranties')}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <div className="text-3xl font-bold text-accent-gold mb-2">
                  {warranties.filter((w: any) => w.status === 'EXPIRED').length}
                </div>
                <div className="text-sm text-primary-forest">{t('dashboard.expiredWarranties')}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="heading-secondary">{t('dealer.recentWarranties')}</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {warranties.slice(0, 5).map((warranty: any) => (
                  <div key={warranty.id} className="p-4 bg-white rounded-lg border border-neutral-beige">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-accent-teal">
                        {warranty.vehicleRegistrationNumber}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded ${warranty.status === 'ACTIVE'
                        ? 'bg-accent-teal/20 text-accent-teal'
                        : 'bg-accent-gold/20 text-accent-gold'
                        }`}>
                        {warranty.status === 'ACTIVE' ? 'Aktiv' : warranty.status === 'EXPIRED' ? 'Utgången' : warranty.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-primary-forest">
                      <div className="flex space-x-4">
                        <span>{warranty.ownerName}</span>
                        <span>{warranty.product?.name}</span>
                      </div>
                      <span>
                        {t('dealer.validUntil')} {new Date(warranty.endDate).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  </div>
                ))}
                {warranties.length === 0 && (
                  <p className="text-center text-primary-forest py-8">{t('dealer.noWarranties')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Warranty Registration Modal */}
      <WarrantyRegistrationModal
        isOpen={showWarrantyModal}
        onClose={() => {
          setShowWarrantyModal(false);
          // Refresh warranties list after successful registration
          if (user || adminView) {
            fetchWarranties();
          }
        }}
        dealerId={adminView ? (dealerData?.id || parseInt(dealerId as string)) : user?.dealer?.id}
      />
    </LayoutComponent>
  );

  // Helper function to fetch warranties
  async function fetchWarranties() {
    try {
      const warrantiesResponse = await apiGet('/api/warranties?limit=1000');
      if (warrantiesResponse.ok) {
        const warrantiesData = await warrantiesResponse.json();
        setWarranties(warrantiesData.warranties || []);
      }
    } catch (error) {
      console.error('Error fetching warranties:', error);
    }
  }
}