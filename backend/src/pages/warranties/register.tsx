import React, { useState } from 'react';
import { useRouter } from 'next/router';
import DealerLayout from '@/components/dealer/Layout';
import WarrantyRegistrationModal from '@/components/dealer/WarrantyRegistrationModal';
import { withAuth } from '@/components/withAuth';

const WarrantyRegisterPage: React.FC = () => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);

  const handleClose = () => {
    setShowModal(false);
    router.push('/warranties');
  };

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="heading-primary">Registrera ny garanti</h1>
          <p className="body-text mt-2">Registrera en ny garanti för ett fordon</p>
        </div>

        <WarrantyRegistrationModal
          isOpen={showModal}
          onClose={handleClose}
        />
      </div>
    </DealerLayout>
  );
};

export default withAuth(WarrantyRegisterPage, { allowedRoles: ['DEALER', 'DEALER_STAFF'] });
