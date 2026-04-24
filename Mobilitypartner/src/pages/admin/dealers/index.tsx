import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/Layout';
import WarrantyRegistrationModal from '@/components/dealer/WarrantyRegistrationModal';
import ConfirmModal from '@/components/ConfirmModal';
import { apiGet, apiPost, apiDelete } from '@/utils/api';
import { withAuth } from '@/components/withAuth';

interface Dealer {
  id: number;
  companyName: string;
  orgNumber: string;
  email: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  county?: string;
  contactPerson?: string;
  status: 'INKOMMEN' | 'ACTIVE' | 'INACTIVE';
  credentialsSentAt?: string | null;
  createdAt: string;
  staff: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  warranties: Array<{
    id: number;
    status: string;
    createdAt: string;
  }>;
  comments: Array<{
    id: number;
    comment: string;
    createdAt: string;
    admin: {
      name: string;
    };
  }>;
  _count: {
    warranties: number;
    invoices: number;
  };
}

const DealersPage: React.FC = () => {
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [togglingDealerId, setTogglingDealerId] = useState<number | null>(null);
  const [dealerToToggle, setDealerToToggle] = useState<Dealer | null>(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showRemoveStaffModal, setShowRemoveStaffModal] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState<{ id: number; name: string } | null>(null);
  const [removingStaff, setRemovingStaff] = useState(false);
  const [searchCompanyName, setSearchCompanyName] = useState('');
  const [searchOrgNumber, setSearchOrgNumber] = useState('');
  const [appliedCompanyName, setAppliedCompanyName] = useState('');
  const [appliedOrgNumber, setAppliedOrgNumber] = useState('');
  const [sendingCredentials, setSendingCredentials] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dealerToEdit, setDealerToEdit] = useState<Dealer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10
  });

  useEffect(() => {
    fetchDealers();
  }, [currentPage, itemsPerPage, appliedCompanyName, appliedOrgNumber]);

  const fetchDealers = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      // Add filter parameters if they exist
      if (appliedCompanyName) {
        params.append('companyName', appliedCompanyName);
      }
      if (appliedOrgNumber) {
        params.append('orgNumber', appliedOrgNumber);
      }

      const response = await apiGet(`/api/admin/dealers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch dealers');

      const data = await response.json();
      setDealers(data.dealers);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDealerClick = (dealer: Dealer) => {
    setSelectedDealer(dealer);
  };

  const handleViewDealer = (dealerId: number) => {
    router.push(`/admin/dealers/view?dealerId=${dealerId}`);
  };

  const handleAddComment = async () => {
    if (!selectedDealer || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await apiPost(`/api/admin/dealers/${selectedDealer.id}/comments`, { comment: newComment.trim() });

      if (!response.ok) throw new Error('Failed to add comment');

      // Refresh dealer data
      await fetchDealers();

      // Update selected dealer
      const updatedDealer = dealers.find(d => d.id === selectedDealer.id);
      if (updatedDealer) {
        setSelectedDealer(updatedDealer);
      }

      setNewComment('');
      setShowCommentModal(false);
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleClick = (dealer: Dealer) => {
    setDealerToToggle(dealer);
    setShowToggleModal(true);
  };

  const handleToggleDealerStatus = async () => {
    if (!dealerToToggle) return;

    const newStatus = dealerToToggle.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    const actionText = newStatus === 'INACTIVE' ? 'deaktivera' : 'aktivera';

    setTogglingDealerId(dealerToToggle.id);

    try {
      const response = await apiPost(`/api/admin/dealers/${dealerToToggle.id}`, {
        ...dealerToToggle,
        status: newStatus
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to ${actionText} dealer`);
      }

      // Refresh dealers list
      await fetchDealers();

      // Update selected dealer if it was the one being toggled
      if (selectedDealer?.id === dealerToToggle.id) {
        const updatedDealer = dealers.find(d => d.id === dealerToToggle.id);
        if (updatedDealer) {
          setSelectedDealer(updatedDealer);
        }
      }

      // Close modal
      setShowToggleModal(false);
      setDealerToToggle(null);
    } catch (err) {
      console.error('Error toggling dealer status:', err);
      alert(err instanceof Error ? err.message : `Kunde inte ${actionText} återförsäljare`);
    } finally {
      setTogglingDealerId(null);
    }
  };

  const handleToggleCancel = () => {
    setShowToggleModal(false);
    setDealerToToggle(null);
  };
  const handleRemoveStaffClick = (staff: { id: number; name: string }) => {
    setStaffToRemove(staff);
    setShowRemoveStaffModal(true);
  };

  const handleRemoveStaff = async () => {
    if (!staffToRemove || !selectedDealer.id) return;

    setRemovingStaff(true);
    try {
      const response = await apiDelete(`/api/admin/dealers/${selectedDealer.id}/staff/${staffToRemove.id}`);

      if (!response.ok) {
        throw new Error('Failed to remove staff');
      }

      // Refresh dealer data to update staff list
      await fetchDealers();

      // Close modal and reset state
      setShowRemoveStaffModal(false);
      setStaffToRemove(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ett fel uppstod vid borttagning av personal');
    } finally {
      setRemovingStaff(false);
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-accent-teal bg-accent-teal/10';
      case 'EXPIRED': return 'text-accent-gold bg-accent-gold/10';
      case 'CANCELLED': return 'text-red-600 bg-red-50';
      default: return 'text-primary-forest bg-neutral-beige';
    }
  };

  const getDealerStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-700 bg-green-100';
      case 'INKOMMEN': return 'text-yellow-700 bg-yellow-100';
      case 'INACTIVE': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getDealerStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Aktiv';
      case 'INKOMMEN': return 'Inkommen';
      case 'INACTIVE': return 'Inaktiv';
      default: return status;
    }
  };

  const handleSendCredentials = async (dealerId: number) => {
    if (!confirm('Är du säker på att du vill skicka inloggningsuppgifter till denna återförsäljare? Ett e-postmeddelande och SMS kommer att skickas.')) {
      return;
    }

    setSendingCredentials(dealerId);
    try {
      const response = await apiPost(`/api/admin/dealers/${dealerId}/send-credentials`, {});

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send credentials');
      }

      const result = await response.json();
      alert(`Inloggningsuppgifter har skickats till ${result.sentTo.email}`);

      // Refresh dealers list to show updated status
      await fetchDealers();
    } catch (err) {
      console.error('Error sending credentials:', err);
      alert(err instanceof Error ? err.message : 'Ett fel uppstod vid skickandet av inloggningsuppgifter');
    } finally {
      setSendingCredentials(null);
    }
  };

  const handleEditClick = (dealer: Dealer) => {
    setDealerToEdit(dealer);
    setShowEditModal(true);
  };

  const handleSearch = () => {
    setAppliedCompanyName(searchCompanyName);
    setAppliedOrgNumber(searchOrgNumber);
    setCurrentPage(1); // Reset to page 1 when searching
  };

  const handleClearFilters = () => {
    setSearchCompanyName('');
    setSearchOrgNumber('');
    setAppliedCompanyName('');
    setAppliedOrgNumber('');
    setCurrentPage(1); // Reset to page 1 when clearing filters
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to page 1 when changing items per page
  };

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-primary-dark">Laddar...</div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="heading-primary">Återförsäljare</h1>
              <p className="body-text mt-2">Hantera och övervaka alla registrerade återförsäljare</p>
            </div>
            <div className="flex space-x-3">
              {/* <button
              onClick={() => setShowWarrantyModal(true)}
              className="btn-accent"
            >
              + Registrera garanti
            </button> */}
              <button
                onClick={() => router.push('/admin/dealers/new')}
                className="btn-primary"
              >
                + Ny återförsäljare
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-error">
              {error}
            </div>
          )}

          {/* Dealers Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="heading-secondary">Alla återförsäljare ({pagination.totalCount})</h2>
            </div>
            <div className="card-body">
              {/* Filters */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="searchCompanyName" className="block text-sm font-medium text-primary-dark mb-2">
                      Företagsnamn
                    </label>
                    <input
                      id="searchCompanyName"
                      type="text"
                      value={searchCompanyName}
                      onChange={(e) => setSearchCompanyName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Skriv företagsnamn..."
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="searchOrgNumber" className="block text-sm font-medium text-primary-dark mb-2">
                      Organisationsnummer
                    </label>
                    <input
                      id="searchOrgNumber"
                      type="text"
                      value={searchOrgNumber}
                      onChange={(e) => setSearchOrgNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Skriv organisationsnummer..."
                      className="form-input w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSearch}
                    className="btn-primary"
                  >
                    Sök
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="btn-secondary"
                  >
                    Rensa filter
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="border-b border-neutral-beige">
                      <th className="text-left py-3 px-4 font-semibold text-primary-dark">Företagsnamn</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary-dark">Org.nr</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary-dark">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary-dark">Kontaktperson</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary-dark">Personal</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary-dark">Garantier</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary-dark">Registrerad</th>
                      <th className="text-left py-3 px-4 font-semibold text-primary-dark">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dealers.map((dealer) => (
                      <tr
                        key={dealer.id}
                        className={`border-b border-neutral-beige/50 hover:bg-neutral-beige/20 transition-colors ${selectedDealer?.id === dealer.id ? 'bg-accent-teal/5' : ''
                          }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-primary-dark">{dealer.companyName}</div>
                          {dealer.address && (
                            <div className="text-sm text-primary-forest">{dealer.address}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-primary-forest">{dealer.orgNumber}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDealerStatusColor(dealer.status)}`}>
                            {getDealerStatusLabel(dealer.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-primary-forest">
                          {dealer.contactPerson || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-primary-dark font-medium">{dealer.staff.length}</span>
                          <span className="text-sm text-primary-forest ml-1">användare</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-accent-teal font-semibold">{dealer._count.warranties}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-primary-forest">
                          {formatDate(dealer.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {dealer.status === 'INKOMMEN' && !dealer.credentialsSentAt && (
                              <button
                                onClick={() => handleSendCredentials(dealer.id)}
                                disabled={sendingCredentials === dealer.id}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Skicka inloggningsuppgifter"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDealer(dealer.id)}
                              className="p-2 text-primary-forest hover:bg-neutral-beige rounded-lg transition-colors"
                              title="Visa återförsäljare"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg> 
                            </button>
                            {/* <button
                              onClick={() => handleDealerClick(dealer)}
                              className="p-2 text-accent-teal hover:bg-accent-teal/10 rounded-lg transition-colors"
                              title="Visa detaljer"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button> */}
                            <button
                              onClick={() => handleEditClick(dealer)}
                              className="p-2 text-gray-600 hover:bg-neutral-beige rounded-lg transition-colors"
                              title="Redigera återförsäljare"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleClick(dealer)}
                              className={`p-2 rounded-lg transition-colors ${dealer.status === 'INACTIVE'
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-red-600 hover:bg-red-50'
                                }`}
                              title={dealer.status === 'INACTIVE' ? 'Aktivera återförsäljare' : 'Deaktivera återförsäljare'}
                            >
                              {dealer.status === 'INACTIVE' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dealers.length === 0 && (
                  <div className="text-center py-8 text-primary-forest">
                    {!appliedCompanyName && !appliedOrgNumber ? 'Inga återförsäljare registrerade ännu' : 'Inga återförsäljare hittades med dessa filter'}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-beige pt-4">
                  <div className="flex items-center gap-2 text-sm text-primary-forest">
                    <span>Visar</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="form-input py-1 px-2"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>av {pagination.totalCount} återförsäljare</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded border border-neutral-beige text-primary-dark hover:bg-neutral-beige disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Föregående
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage =
                          page === 1 ||
                          page === pagination.totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1);

                        // Show ellipsis
                        const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                        const showEllipsisAfter = page === currentPage + 2 && currentPage < pagination.totalPages - 2;

                        if (showEllipsisBefore || showEllipsisAfter) {
                          return (
                            <span key={page} className="px-2 py-1 text-primary-forest">
                              ...
                            </span>
                          );
                        }

                        if (!showPage) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded border transition-colors ${currentPage === page
                              ? 'bg-accent-teal text-white border-accent-teal'
                              : 'border-neutral-beige text-primary-dark hover:bg-neutral-beige'
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                      className="px-3 py-1 rounded border border-neutral-beige text-primary-dark hover:bg-neutral-beige disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Nästa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedDealer && (
            <div className="grid grid-cols-1 gap-8">

              {/* Dealer Details */}
              <div className="card">
                <div className="card-header">
                  <h2 className="heading-secondary">
                    {selectedDealer ? selectedDealer.companyName : 'Välj en återförsäljare'}
                  </h2>
                </div>
                <div className="card-body">
                  {selectedDealer ? (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div>
                        <h3 className="subheading mb-3">Företagsinformation</h3>
                        <div className="space-y-2">
                          <p><strong>Företagsnamn:</strong> {selectedDealer.companyName}</p>
                          <p><strong>Organisationsnummer:</strong> {selectedDealer.orgNumber}</p>
                          <p>
                            <strong>Status:</strong>{' '}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDealerStatusColor(selectedDealer.status)}`}>
                              {getDealerStatusLabel(selectedDealer.status)}
                            </span>
                          </p>
                          {selectedDealer.credentialsSentAt && (
                            <p><strong>Inloggningsuppgifter skickade:</strong> {formatDate(selectedDealer.credentialsSentAt)}</p>
                          )}
                          {selectedDealer.address && <p><strong>Adress:</strong> {selectedDealer.address}</p>}
                          {selectedDealer.contactPerson && <p><strong>Kontaktperson:</strong> {selectedDealer.contactPerson}</p>}
                          <p><strong>Registrerad:</strong> {formatDate(selectedDealer.createdAt)}</p>
                        </div>
                      </div>

                      {/* Staff */}
                      <div>
                        <h3 className="subheading mb-3">Personal ({selectedDealer.staff.length})</h3>
                        <div className="space-y-2">
                          {selectedDealer.staff.map((staff) => (
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

                                {staff.role === 'STAFF' && (
                                  <button
                                    onClick={() => handleRemoveStaffClick({ id: staff.id, name: staff.name })}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    title="Ta bort personal"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}

                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="subheading">Kommentarer ({selectedDealer.comments.length})</h3>
                          <button
                            onClick={() => setShowCommentModal(true)}
                            className="btn-accent text-sm"
                          >
                            + Lägg till kommentar
                          </button>
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {selectedDealer.comments.map((comment) => (
                            <div key={comment.id} className="p-3 bg-white rounded border border-neutral-beige">
                              <p className="body-text-secondary text-sm mb-2">{comment.comment}</p>
                              <div className="flex justify-between text-xs text-primary-forest">
                                <span>Av: {comment.admin.name}</span>
                                <span>{formatDate(comment.createdAt)}</span>
                              </div>
                            </div>
                          ))}
                          {selectedDealer.comments.length === 0 && (
                            <p className="text-primary-forest text-sm italic">Inga kommentarer ännu</p>
                          )}
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-accent-teal/10 rounded">
                          <div className="text-2xl font-bold text-accent-teal">
                            {selectedDealer._count.warranties}
                          </div>
                          <div className="text-sm text-primary-forest">Garantier</div>
                        </div>
                        <div className="text-center p-4 bg-accent-gold/10 rounded">
                          <div className="text-2xl font-bold text-accent-gold">
                            {selectedDealer._count.invoices}
                          </div>
                          <div className="text-sm text-primary-forest">Fakturor</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-primary-forest">
                      Klicka på en återförsäljare för att se detaljer
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warranty Registration Modal */}
          <WarrantyRegistrationModal
            isOpen={showWarrantyModal}
            onClose={() => setShowWarrantyModal(false)}
          />

          {/* Toggle Status Confirmation Modal */}
          <ConfirmModal
            isOpen={showToggleModal}
            onClose={handleToggleCancel}
            onConfirm={handleToggleDealerStatus}
            title={dealerToToggle?.status === 'INACTIVE' ? 'Aktivera återförsäljare' : 'Deaktivera återförsäljare'}
            message={
              dealerToToggle?.status === 'INACTIVE'
                ? `Är du säker på att du vill aktivera "${dealerToToggle?.companyName}"?\n\nDenna återförsäljare kommer att kunna logga in och använda systemet igen.`
                : `Är du säker på att du vill deaktivera "${dealerToToggle?.companyName}"?\n\nDenna återförsäljare kommer inte att kunna logga in förrän du aktiverar dem igen. All data förblir intakt.`
            }
            confirmText={dealerToToggle?.status === 'INACTIVE' ? 'Aktivera' : 'Deaktivera'}
            cancelText="Avbryt"
            isLoading={togglingDealerId === dealerToToggle?.id}
            variant={dealerToToggle?.status === 'INACTIVE' ? 'info' : 'danger'}
          />

          {/* Comment Modal */}
          {showCommentModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-lg max-w-md w-full mx-4">
                <div className="p-6">
                  <h3 className="heading-secondary mb-4">Lägg till kommentar</h3>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="form-input w-full h-32 resize-none"
                    placeholder="Skriv din kommentar här..."
                  />
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() => {
                        setShowCommentModal(false);
                        setNewComment('');
                      }}
                      className="btn-secondary"
                      disabled={submittingComment}
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={handleAddComment}
                      className="btn-primary"
                      disabled={submittingComment || !newComment.trim()}
                    >
                      {submittingComment ? 'Sparar...' : 'Spara kommentar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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

          {/* Edit Dealer Modal */}
          {showEditModal && dealerToEdit && (
            <EditDealerModal
              dealer={dealerToEdit}
              onClose={() => {
                setShowEditModal(false);
                setDealerToEdit(null);
              }}
              onSave={async () => {
                await fetchDealers();
                setShowEditModal(false);
                setDealerToEdit(null);
                if (selectedDealer?.id === dealerToEdit.id) {
                  const updatedDealer = dealers.find(d => d.id === dealerToEdit.id);
                  if (updatedDealer) setSelectedDealer(updatedDealer);
                }
              }}
            />
          )}
        </div>
      )}

    </AdminLayout>
  );
};

// Edit Dealer Modal Component
const EditDealerModal: React.FC<{
  dealer: Dealer;
  onClose: () => void;
  onSave: () => void;
}> = ({ dealer, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    companyName: dealer.companyName,
    email: dealer.email,
    phone: dealer.phone || '',
    address: dealer.address || '',
    postalCode: dealer.postalCode || '',
    city: dealer.city || '',
    county: dealer.county || '',
    contactPerson: dealer.contactPerson || '',
    status: dealer.status
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await apiPost(`/api/admin/dealers/${dealer.id}`, formData);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update dealer');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}

    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-4">Redigera återförsäljare</h3>

        {error && (
          <div className="alert-error mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Företagsnamn *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="form-input"
              >
                <option value="INKOMMEN">Inkommen</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Inaktiv</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">E-postadress *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefonnummer</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kontaktperson</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Adress</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Postnummer</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ort</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Län</label>
              <input
                type="text"
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 btn-secondary"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary"
            >
              {saving ? 'Sparar...' : 'Spara ändringar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default withAuth(DealersPage, { allowedRoles: ['ADMIN'] });