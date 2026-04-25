import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/Layout';
import WarrantyRegistrationModal from '@/components/dealer/WarrantyRegistrationModal';
import { apiGet, apiDelete, apiPut, apiPost } from '@/utils/api';
import { withAuth } from '@/components/withAuth';

interface Dealer {
  id: number;
  companyName: string;
  orgNumber: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  createdAt: string;
  staff: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  _count: {
    warranties: number;
    invoices: number;
  };
}

interface Warranty {
  id: number;
  vehicleRegistrationNumber: string;
  vehicleData: {
    make: string;
    model: string;
    year: number;
    mileage: number;
    vin: string;
  };
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  product: {
    name: string;
  };
  registeredBy: {
    name: string;
    email: string;
  };
  _count?: {
    claims: number;
  };
}

interface DealerComment {
  id: number;
  comment: string;
  createdAt: string;
  admin: {
    name: string;
    email: string;
  };
}

const ViewDealerPage: React.FC = () => {
  const router = useRouter();
  const { dealerId } = router.query;
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [showRemoveStaffModal, setShowRemoveStaffModal] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState<{ id: number; name: string } | null>(null);
  const [removingStaff, setRemovingStaff] = useState(false);
  const [togglingStaff, setTogglingStaff] = useState<number | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [staffToChangePassword, setStaffToChangePassword] = useState<{ id: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [comments, setComments] = useState<DealerComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    if (dealerId) {
      fetchDealerData();
      fetchDealerWarranties();
      fetchComments();
    }
  }, [dealerId]);

  useEffect(() => {
    if (dealerId) {
      fetchDealerWarranties();
    }
  }, [filters]);

  const fetchDealerData = async () => {
    try {
      const response = await apiGet(`/api/admin/dealers/${dealerId}`);
      if (!response.ok) throw new Error('Failed to fetch dealer');

      const data = await response.json();
      setDealer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchDealerWarranties = async () => {
    try {
      const searchParams = new URLSearchParams({
        dealer: dealerId as string,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status })
      });

      const response = await apiGet(`/api/admin/warranties?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch warranties');

      const data = await response.json();
      setWarranties(data.warranties);
    } catch (err) {
      console.error('Error fetching warranties:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await apiGet(`/api/admin/dealers/${dealerId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');

      const data = await response.json();
      setComments(data.comments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !dealerId) return;

    setAddingComment(true);
    try {
      const response = await apiPost(`/api/admin/dealers/${dealerId}/comments`, {
        comment: newComment.trim()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment');
      }

      const data = await response.json();
      setComments([data.comment, ...comments]);
      setNewComment('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ett fel uppstod vid tillägg av kommentar');
    } finally {
      setAddingComment(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRemoveStaffClick = (staff: { id: number; name: string }) => {
    setStaffToRemove(staff);
    setShowRemoveStaffModal(true);
  };

  const handleRemoveStaff = async () => {
    if (!staffToRemove || !dealerId) return;

    setRemovingStaff(true);
    try {
      const response = await apiDelete(`/api/admin/dealers/${dealerId}/staff/${staffToRemove.id}`);

      if (!response.ok) {
        throw new Error('Failed to remove staff');
      }

      // Refresh dealer data to update staff list
      await fetchDealerData();

      // Close modal and reset state
      setShowRemoveStaffModal(false);
      setStaffToRemove(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ett fel uppstod vid borttagning av personal');
    } finally {
      setRemovingStaff(false);
    }
  };

  const handleToggleStaffStatus = async (staffId: number, currentStatus: boolean) => {
    if (!dealerId) return;

    setTogglingStaff(staffId);
    try {
      const response = await apiPut(`/api/admin/dealers/${dealerId}/staff/${staffId}/toggle-status`, {
        isActive: !currentStatus
      });

      if (!response.ok) {
        throw new Error('Failed to update staff status');
      }

      // Refresh dealer data to update staff list
      await fetchDealerData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ett fel uppstod vid uppdatering av personalstatus');
    } finally {
      setTogglingStaff(null);
    }
  };

  const handlePasswordChangeClick = (staff: { id: number; name: string }) => {
    setStaffToChangePassword(staff);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (!staffToChangePassword || !dealerId || !newPassword) return;

    if (newPassword.length < 6) {
      alert('Lösenordet måste vara minst 6 tecken långt');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await apiPut(
        `/api/admin/dealers/${dealerId}/staff/${staffToChangePassword.id}/change-password`,
        { newPassword }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      // Close modal and reset state
      setShowPasswordModal(false);
      setStaffToChangePassword(null);
      setNewPassword('');
      alert('Lösenordet har ändrats framgångsrikt');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ett fel uppstod vid ändring av lösenord');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleViewDashboard = async () => {
    if (!dealer) return;

    setImpersonating(true);
    try {
      const response = await apiPost(`/api/admin/dealers/${dealer?.id}/impersonate`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to impersonate dealer');
      }

      const data = await response.json();

      // Open dealer dashboard in new tab with impersonation token
      const dealerDomain = process.env.NEXT_PUBLIC_DEALER_DOMAIN || window.location.origin;
      window.open(`${dealerDomain}/login?impersonate=${data.token}`, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ett fel uppstod vid inloggning till återförsäljarpanelen');
    } finally {
      setImpersonating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-accent-teal bg-accent-teal/10 border-accent-teal/20';
      case 'EXPIRED': return 'text-accent-gold bg-accent-gold/10 border-accent-gold/20';
      case 'CANCELLED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-primary-forest bg-neutral-beige border-neutral-beige';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Aktiv';
      case 'EXPIRED': return 'Utgången';
      case 'CANCELLED': return 'Avbruten';
      default: return status;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary-dark">Laddar...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !dealer) {
    return (
      <AdminLayout>
        <div className="alert-error">
          {error || 'Återförsäljare hittades inte'}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push('/admin/dealers')}
              className="text-primary-forest hover:text-primary-dark mb-2 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Tillbaka till återförsäljare
            </button>
            <h1 className="heading-primary">{dealer.companyName}</h1>
            <p className="body-text mt-2">Visa återförsäljare information och garantier</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleViewDashboard}
              disabled={impersonating}
              className="btn-secondary flex items-center gap-2"
            >
              {impersonating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Öppnar...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Dashboard
                </>
              )}
            </button>
            <button
              onClick={() => setShowWarrantyModal(true)}
              className="btn-accent"
            >
              + Registrera garanti
            </button>
          </div>
        </div>

        {/* Dealer Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-forest">Totalt garantier</p>
                  <p className="text-3xl font-bold text-primary-dark mt-2">
                    {dealer._count.warranties}
                  </p>
                </div>
                <div className="p-3 bg-accent-teal/10 rounded-lg">
                  <svg className="w-8 h-8 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-forest">Personal</p>
                  <p className="text-3xl font-bold text-primary-dark mt-2">
                    {dealer.staff.length}
                  </p>
                </div>
                <div className="p-3 bg-primary-forest/10 rounded-lg">
                  <svg className="w-8 h-8 text-primary-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-forest">Fakturor</p>
                  <p className="text-3xl font-bold text-primary-dark mt-2">
                    {dealer._count.invoices}
                  </p>
                </div>
                <div className="p-3 bg-accent-gold/10 rounded-lg">
                  <svg className="w-8 h-8 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div>
                <p className="text-sm font-medium text-primary-forest">Org.nr</p>
                <p className="text-lg font-bold text-primary-dark mt-2">
                  {dealer.orgNumber}
                </p>
                {dealer.address && (
                  <p className="text-sm text-primary-forest mt-2">{dealer.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dealer Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-secondary">Återförsäljare Information</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="subheading mb-3">Företagsinformation</h3>
                <div className="space-y-2">
                  <p><strong>Företagsnamn:</strong> {dealer.companyName}</p>
                  <p><strong>Organisationsnummer:</strong> {dealer.orgNumber}</p>
                  <p><strong>E-post:</strong> {dealer.email}</p>
                  {dealer.phone && <p><strong>Telefon:</strong> {dealer.phone}</p>}
                  {dealer.address && <p><strong>Adress:</strong> {dealer.address}</p>}
                  {dealer.contactPerson && <p><strong>Kontaktperson:</strong> {dealer.contactPerson}</p>}
                  <p><strong>Registrerad:</strong> {formatDate(dealer.createdAt)}</p>
                </div>
              </div>

              <div>
                <h3 className="subheading mb-3">Personal ({dealer.staff.length})</h3>
                <div className="space-y-2">
                  {dealer.staff.map((staff) => (
                    <div key={staff.id} className="flex justify-between items-center p-2 bg-white rounded border border-neutral-beige">
                      <div>
                        <span className="font-medium">{staff.name}</span>
                        <span className="text-sm text-primary-forest ml-2">({staff.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${staff.isActive ? 'bg-accent-teal/20 text-accent-teal' : 'bg-red-100 text-red-600'
                          }`}>
                          {staff.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>

                        {staff.role == 'STAFF' && (
                          <>
                            <button
                              onClick={() => handleToggleStaffStatus(staff.id, staff.isActive)}
                              disabled={togglingStaff === staff.id}
                              className={`p-1 rounded transition-colors ${
                                staff.isActive
                                  ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={staff.isActive ? 'Deaktivera personal' : 'Aktivera personal'}
                            >
                              {togglingStaff === staff.id ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : staff.isActive ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>

                            <button
                              onClick={() => handlePasswordChangeClick({ id: staff.id, name: staff.name })}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Ändra lösenord"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>

                            {/* <button
                              onClick={() => handleRemoveStaffClick({ id: staff.id, name: staff.name })}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Ta bort personal"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button> */}
                          </>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-secondary">Kommentarer ({comments.length})</h2>
          </div>
          <div className="card-body">
            {/* Add new comment */}
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="form-input w-full h-24 resize-none"
                placeholder="Lägg till en kommentar..."
                disabled={addingComment}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleAddComment}
                  disabled={addingComment || !newComment.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingComment ? 'Lägger till...' : 'Lägg till kommentar'}
                </button>
              </div>
            </div>

            {/* Comments list */}
            {comments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-neutral-beige/30 rounded-lg border border-neutral-beige">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium text-primary-dark">{comment.admin.name}</span>
                        <span className="text-sm text-primary-forest ml-2">({comment.admin.email})</span>
                      </div>
                      <span className="text-sm text-primary-forest">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-primary-dark whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-primary-forest py-4">
                Inga kommentarer ännu
              </p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Sök efter registreringsnummer</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input"
                  placeholder="ABC123"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-input"
                >
                  <option value="">Alla status</option>
                  <option value="ACTIVE">Aktiv</option>
                  <option value="EXPIRED">Utgången</option>
                  <option value="CANCELLED">Avbruten</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Warranties Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-secondary">Registrerade Garantier ({warranties.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-beige">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Registreringsnummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Fordon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Ägare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Produkt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Giltig till
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Registrerad av
                  </th>
                </tr>
              </thead>
              <tbody className="bg-neutral-light divide-y divide-neutral-beige">
                {warranties.map((warranty) => (
                  <tr key={warranty.id} className="hover:bg-neutral-beige/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-underrubriker font-medium text-primary-dark">
                        {warranty.vehicleRegistrationNumber}
                      </div>
                      <div className="text-sm text-primary-forest">
                        VIN: {warranty.vehicleData.vin.slice(-6)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">
                        {warranty.vehicleData.make} {warranty.vehicleData.model}
                      </div>
                      <div className="text-sm text-primary-forest">
                        {warranty.vehicleData.year} • {warranty.vehicleData.mileage.toLocaleString()} km
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">{warranty.ownerName}</div>
                      <div className="text-sm text-primary-forest">{warranty.ownerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">{warranty.product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(warranty.status)}`}>
                        {getStatusText(warranty.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-forest">
                      {formatDate(warranty.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">{warranty.registeredBy.name}</div>
                      <div className="text-sm text-primary-forest">{warranty.registeredBy.email}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {warranties.length === 0 && (
            <div className="text-center py-12 text-primary-forest">
              Inga garantier hittades för denna återförsäljare
            </div>
          )}
        </div>

        {/* Warranty Registration Modal */}
        <WarrantyRegistrationModal
          isOpen={showWarrantyModal}
          onClose={() => {
            setShowWarrantyModal(false);
            fetchDealerWarranties();
          }}
          dealerId={dealer.id}
        />

        {/* Remove Staff Confirmation Modal */}
        {showRemoveStaffModal && staffToRemove && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center text-primary-dark mb-2">
                Ta bort personal
              </h3>
              <p className="text-center text-primary-forest mb-6">
                Är du säker på att du vill ta bort <strong>{staffToRemove.name}</strong> från denna återförsäljare?
                Denna åtgärd kan inte ångras.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveStaffModal(false);
                    setStaffToRemove(null);
                  }}
                  disabled={removingStaff}
                  className="flex-1 px-4 py-2 border border-neutral-beige text-primary-dark rounded-lg hover:bg-neutral-beige transition-colors disabled:opacity-50"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleRemoveStaff}
                  disabled={removingStaff}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {removingStaff ? 'Tar bort...' : 'Ta bort'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && staffToChangePassword && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center text-primary-dark mb-2">
                Ändra lösenord
              </h3>
              <p className="text-center text-primary-forest mb-4">
                Ändra lösenord för <strong>{staffToChangePassword.name}</strong>
              </p>
              <div className="mb-6">
                <label className="form-label">Nytt lösenord</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Minst 6 tecken"
                  disabled={changingPassword}
                  autoFocus
                />
                <p className="text-xs text-primary-forest mt-1">
                  Lösenordet måste vara minst 6 tecken långt
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setStaffToChangePassword(null);
                    setNewPassword('');
                  }}
                  disabled={changingPassword}
                  className="flex-1 px-4 py-2 border border-neutral-beige text-primary-dark rounded-lg hover:bg-neutral-beige transition-colors disabled:opacity-50"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || newPassword.length < 6}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? 'Ändrar...' : 'Ändra lösenord'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default withAuth(ViewDealerPage, { allowedRoles: ['ADMIN'] });
