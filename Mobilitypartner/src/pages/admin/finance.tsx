import React from 'react';
import AdminLayout from '@/components/admin/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { ExternalLink } from 'lucide-react';
import { withAuth } from '@/components/withAuth';

const FinancePage: React.FC = () => {
  const { t } = useLanguage();

  const openFortnox = () => {
    window.open('https://apps.fortnox.se/fs/fs/login.php', '_blank', 'noopener,noreferrer');
  };
  

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="heading-primary">{t('nav.finance')}</h1>
          <p className="body-text mt-2">Fortnox Financial Management</p>
        </div>

        {/* Fortnox Access Card */}
        <div className="card">
          <div className="card-body text-center py-16">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-accent-teal rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title and Description */}
              <div>
                <h2 className="heading-secondary mb-2">Access Fortnox</h2>
                <p className="body-text text-primary-forest">
                  Click the button below to open Fortnox Financial Management system in a new window.
                </p>
              </div>

              {/* Open Button */}
              <button
                onClick={openFortnox}
                className="btn-primary inline-flex items-center space-x-2 px-8 py-4 text-lg"
              >
                <span>Open Fortnox</span>
                <ExternalLink className="w-5 h-5" />
              </button>
{/* 
              <a
                href={'/admin/settings/fortnox'}
                className="btn-primary inline-flex items-center space-x-2 px-8 py-4 text-lg ml-5"
              >
                <span>Integrate Fortnox</span>
              </a> */}

              {/* Info Box */}
              <div className="mt-8 p-4 bg-neutral-beige rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-accent-teal flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm text-primary-dark">
                      <strong>Note:</strong> For security reasons, Fortnox cannot be embedded directly in this page.
                      The system will open in a new browser window where you can log in and manage your finances.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAuth(FinancePage, { allowedRoles: ['ADMIN'] });
