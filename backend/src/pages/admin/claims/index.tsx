import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '@/components/admin/Layout';
import ConfirmModal from '@/components/ConfirmModal';
import { apiGet, apiDelete, apiPatch, apiPost, toast } from '@/utils/api';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/Loader';
import { withAuth } from '@/components/withAuth';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface ClaimComment {
  id: number;
  comment: string;
  createdAt: string;
  admin: {
    id: number;
    name: string;
    email: string;
  };
}

interface Claim {
  id: number;
  customerDescription: string | null;
  internalNotes: string | null;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ONGOING' | 'APPROVED' | 'REJECTED' | 'PAID';
  workshopInvoiceUrl: string | null;
  costAmount: number | null;
  // Customer contact information at time of claim
  customerFirstname: string;
  customerLastname: string;
  customerPhone: string;
  customerEmail: string;
  customerPersonnummer: string;
  customerAddress: string | null;
  customerPostnummer: string;
  customerOrt: string;
  // Vehicle info at time of claim
  mileage: string | null;
  skadedatum: string;
  // File attachments
  meterReadingImage: string | null;
  descriptionFiles: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
  // Relations
  warranty: {
    id: number;
    warrantyNumber: string;
    vehicleRegistrationNumber: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    vehicleData: {
      make: string;
      model: string;
      year: number;
      mileage: number;
      vin: string;
    };
    dealer: {
      companyName: string;
    };
    product: {
      name: string;
    };
  };
  processedBy: {
    name: string;
    email: string;
  } | null;
}

const ClaimsPage: React.FC = () => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [deletingClaimId, setDeletingClaimId] = useState<number | null>(null);
  const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showNewClaimModal, setShowNewClaimModal] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimFormError, setClaimFormError] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [comments, setComments] = useState<ClaimComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { t } = useLanguage();

  const [newClaimData, setNewClaimData] = useState({
    registrationNumber: '',
    mileage: '',
    firstname: '',
    lastname: '',
    phone: '',
    email: '',
    personnummer: '',
    address: '',
    postnummer: '',
    ort: '',
    skadedatum: '',
    damageDescription: ''
  });
  const [meterReadingImage, setMeterReadingImage] = useState<File | null>(null);
  const [descriptionFiles, setDescriptionFiles] = useState<File[]>([]);

  const [filters, setFilters] = useState({
    warrantyNumber: '',
    registrationNumber: '',
    status: ''
  });

  // Debounce text inputs (500ms delay)
  const debouncedWarrantyNumber = useDebounce(filters.warrantyNumber, 500);
  const debouncedRegistrationNumber = useDebounce(filters.registrationNumber, 500);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchClaims();
  }, [debouncedWarrantyNumber, debouncedRegistrationNumber, filters.status, pagination.page, pagination.limit]);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(debouncedWarrantyNumber && { warrantyNumber: debouncedWarrantyNumber }),
        ...(debouncedRegistrationNumber && { registrationNumber: debouncedRegistrationNumber }),
        ...(filters.status && { status: filters.status })
      });

      const response = await apiGet(`/api/admin/claims?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch claims');

      const data = await response.json();
      setClaims(data.claims);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [debouncedWarrantyNumber, debouncedRegistrationNumber, filters.status, pagination.page, pagination.limit]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    // Only reset pagination immediately for status changes (dropdown)
    // Text fields will reset pagination when debounced value changes
    if (name === 'status') {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };

  // Reset pagination when debounced text values change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedWarrantyNumber, debouncedRegistrationNumber]);

  // Fetch comments when selectedClaim changes
  useEffect(() => {
    if (selectedClaim) {
      fetchComments(selectedClaim.id);
    } else {
      setComments([]);
    }
  }, [selectedClaim]);

  const handleDeleteClick = (claim: Claim) => {
    setClaimToDelete(claim);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!claimToDelete) return;

    setDeletingClaimId(claimToDelete.id);
    setDeleteError(null);

    try {
      const response = await apiDelete(`/api/admin/claims/${claimToDelete.id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete claim');
      }

      // Close details modal if deleted claim was selected
      if (selectedClaim?.id === claimToDelete.id) {
        setSelectedClaim(null);
      }

      // Refresh claims list
      await fetchClaims();

      // Close delete modal
      setShowDeleteModal(false);
      setClaimToDelete(null);
    } catch (err) {
      console.error('Error deleting claim:', err);
      setDeleteError(err instanceof Error ? err.message : 'Kunde inte ta bort ärende');
    } finally {
      setDeletingClaimId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setClaimToDelete(null);
    setDeleteError(null);
  };

  const handleNewClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimFormError(null);
    setSubmittingClaim(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('registrationNumber', newClaimData.registrationNumber);
      formData.append('mileage', newClaimData.mileage);
      formData.append('firstname', newClaimData.firstname);
      formData.append('lastname', newClaimData.lastname);
      formData.append('phone', newClaimData.phone);
      formData.append('email', newClaimData.email);
      formData.append('personnummer', newClaimData.personnummer);
      formData.append('address', newClaimData.address);
      formData.append('postnummer', newClaimData.postnummer);
      formData.append('ort', newClaimData.ort);
      formData.append('skadedatum', newClaimData.skadedatum);
      formData.append('damageDescription', newClaimData.damageDescription);

      if (meterReadingImage) {
        formData.append('meterReadingImage', meterReadingImage);
      }

      descriptionFiles.forEach((file) => {
        formData.append('descriptionFiles', file);
      });

      const response = await fetch('/api/warranties/submit-claim', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Kunde inte skapa ärende');
      }

      // Reset form and close modal
      setNewClaimData({
        registrationNumber: '',
        mileage: '',
        firstname: '',
        lastname: '',
        phone: '',
        email: '',
        personnummer: '',
        address: '',
        postnummer: '',
        ort: '',
        skadedatum: '',
        damageDescription: ''
      });
      setMeterReadingImage(null);
      setDescriptionFiles([]);
      setShowNewClaimModal(false);

      // Refresh claims list
      await fetchClaims();

    } catch (err) {
      console.error('Error creating claim:', err);
      setClaimFormError(err instanceof Error ? err.message : 'Kunde inte skapa ärende');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleNewClaimClose = () => {
    setShowNewClaimModal(false);
    setClaimFormError(null);
    setNewClaimData({
      registrationNumber: '',
      mileage: '',
      firstname: '',
      lastname: '',
      phone: '',
      email: '',
      personnummer: '',
      address: '',
      postnummer: '',
      ort: '',
      skadedatum: '',
      damageDescription: ''
    });
    setMeterReadingImage(null);
    setDescriptionFiles([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ONGOING': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PAID': return 'bg-accent-teal/10 text-accent-teal border-accent-teal/20';
      default: return 'bg-neutral-beige text-primary-forest border-neutral-beige';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'Inkommen';
      case 'UNDER_REVIEW': return 'Under granskning';
      case 'ONGOING': return 'Pågående';
      case 'APPROVED': return 'Godkänd';
      case 'REJECTED': return 'Avvisat';
      case 'PAID': return 'Betalt';
      default: return status;
    }
  };

  const handleStatusChange = async (claimId: number, newStatus: string) => {
    if (updatingStatusId) return;

    setUpdatingStatusId(claimId);

    try {
      const response = await apiPatch(`/api/admin/claims/${claimId}`, { status: newStatus });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }

      // Update the claim in the local state
      setClaims(prevClaims =>
        prevClaims.map(claim =>
          claim.id === claimId ? { ...claim, status: newStatus as Claim['status'] } : claim
        )
      );

      // Also update selectedClaim if it's the same claim
      if (selectedClaim?.id === claimId) {
        setSelectedClaim(prev => prev ? { ...prev, status: newStatus as Claim['status'] } : null);
      }
    } catch (err) {
      console.error('Error updating claim status:', err);
      toast.error(err instanceof Error ? err.message : 'Kunde inte uppdatera status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const fetchComments = async (claimId: number) => {
    try {
      const response = await apiGet(`/api/admin/claims/${claimId}/comments`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    }
  };

  const handleAddComment = async () => {
    if (!selectedClaim || !newComment.trim()) return;

    try {
      const response = await apiPost(`/api/admin/claims/${selectedClaim.id}/comments`, {
        comment: newComment
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add comment');
      }

      const data = await response.json();
      setComments([data.comment, ...comments]);
      setNewComment('');
      toast.success('Kommentar tillagd');
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error(err instanceof Error ? err.message : 'Kunde inte lägga till kommentar');
    }
  };

  if (loading && claims.length === 0) {
    return (
      <AdminLayout>
        <Loader className="h-64" size="large" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="heading-primary">Garantiärenden</h1>
            <p className="body-text mt-2">Översikt och hantering av alla garantiärenden</p>
          </div>
          <button
            onClick={() => setShowNewClaimModal(true)}
            className="btn-primary"
          >
            + Ny skadeanmälan
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="form-label">Garantinummer</label>
                <input
                  type="text"
                  value={filters.warrantyNumber}
                  onChange={(e) => handleFilterChange('warrantyNumber', e.target.value)}
                  className="form-input"
                  placeholder="WRN-202601-0001"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registreringsnummer</label>
                <input
                  type="text"
                  value={filters.registrationNumber}
                  onChange={(e) => handleFilterChange('registrationNumber', e.target.value.toUpperCase())}
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
                  <option value="">Alla statusar</option>
                  <option value="SUBMITTED">Inkommen</option>
                  <option value="UNDER_REVIEW">Under granskning</option>
                  <option value="ONGOING">Pågående</option>
                  <option value="APPROVED">Godkänd</option>
                  <option value="REJECTED">Avvisat</option>
                  <option value="PAID">Betalt</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <button
                  onClick={fetchClaims}
                  className="btn-primary w-full"
                >
                  Sök
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {/* Results Summary */}
        <div className="flex justify-between items-center">
          <div className="text-primary-forest">
            Visar {claims.length} av {pagination.total} ärenden
          </div>
          <div className="text-primary-forest">
            Sida {pagination.page} av {pagination.pages}
          </div>
        </div>

        {/* Claims Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-beige">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Ärende ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Fordon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Ägare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Återförsäljare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Produkt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Belopp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Skapad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="bg-neutral-light divide-y divide-neutral-beige">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-neutral-beige/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-underrubriker font-medium text-primary-dark">
                        #{claim.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">
                        {claim.warranty.vehicleRegistrationNumber}
                      </div>
                      <div className="text-xs text-primary-forest">
                        {claim.warranty.warrantyNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">
                        {claim.warranty.ownerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">
                        {claim.warranty.dealer.companyName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">
                        {claim.warranty.product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={claim.status}
                        onChange={(e) => handleStatusChange(claim.id, e.target.value)}
                        disabled={updatingStatusId === claim.id}
                        className={`px-2 py-1 text-xs rounded border cursor-pointer ${getStatusColor(claim.status)} ${updatingStatusId === claim.id ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        <option value="SUBMITTED">Inkommen</option>
                        <option value="UNDER_REVIEW">Under granskning</option>
                        <option value="ONGOING">Pågående</option>
                        <option value="APPROVED">Godkänd</option>
                        <option value="REJECTED">Avvisat</option>
                        <option value="PAID">Betalt</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">
                        {claim.costAmount
                          ? `${Number(claim.costAmount).toLocaleString('sv-SE')} SEK`
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-forest">
                      {formatDate(claim.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                          }}
                          className="text-accent-teal hover:text-accent-teal/80 font-medium"
                        >
                          Visa detaljer
                        </button>
                        <button
                          onClick={() => handleDeleteClick(claim)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                        >
                          Ta bort
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {claims.length === 0 && !loading && (
            <div className="text-center py-12 text-primary-forest">
              Inga garantiärenden hittades med de valda filtren
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="card">
            <div className="card-body">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-primary-forest">
                  <span>Visar</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                    className="form-input py-1 px-2"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>av {pagination.total} ärenden</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded border border-neutral-beige text-primary-dark hover:bg-neutral-beige disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Föregående
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        page === 1 ||
                        page === pagination.pages ||
                        (page >= pagination.page - 1 && page <= pagination.page + 1);

                      // Show ellipsis
                      const showEllipsisBefore = page === pagination.page - 2 && pagination.page > 3;
                      const showEllipsisAfter = page === pagination.page + 2 && pagination.page < pagination.pages - 2;

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
                          onClick={() => {
                            setPagination(prev => ({ ...prev, page }));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-3 py-1 rounded border transition-colors ${pagination.page === page
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
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 rounded border border-neutral-beige text-primary-dark hover:bg-neutral-beige disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Nästa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Claim Details Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setSelectedClaim(null); }}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-neutral-beige px-6 py-4 flex justify-between items-center">
              <h2 className="heading-secondary">Ärende #{selectedClaim.id}</h2>
              <button
                onClick={() => {
                  setSelectedClaim(null);
                }}
                className="text-primary-forest hover:text-primary-dark"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="form-label">Status</label>
                <div>
                  <select
                    value={selectedClaim.status}
                    onChange={(e) => handleStatusChange(selectedClaim.id, e.target.value)}
                    disabled={updatingStatusId === selectedClaim.id}
                    className={`px-3 py-1.5 text-sm rounded border cursor-pointer ${getStatusColor(selectedClaim.status)} ${updatingStatusId === selectedClaim.id ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <option value="SUBMITTED">Inkommen</option>
                    <option value="UNDER_REVIEW">Under granskning</option>
                    <option value="ONGOING">Pågående</option>
                    <option value="APPROVED">Godkänd</option>
                    <option value="REJECTED">Avvisat</option>
                    <option value="PAID">Betalt</option>
                  </select>
                </div>
              </div>

              {/* Customer Information */}
              <div className="border-t border-neutral-beige pt-4">
                <h3 className="font-underrubriker font-medium text-primary-dark mb-3">Kundinformation (vid skadetillfället)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Namn</label>
                    <p className="body-text">{selectedClaim.customerFirstname} {selectedClaim.customerLastname}</p>
                  </div>
                  <div>
                    <label className="form-label">Personnummer</label>
                    <p className="body-text">{selectedClaim.customerPersonnummer}</p>
                  </div>
                  <div>
                    <label className="form-label">Telefon</label>
                    <p className="body-text">{selectedClaim.customerPhone}</p>
                  </div>
                  <div>
                    <label className="form-label">E-post</label>
                    <p className="body-text">{selectedClaim.customerEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Adress</label>
                    <p className="body-text">
                      {selectedClaim.customerAddress && `${selectedClaim.customerAddress}, `}
                      {selectedClaim.customerPostnummer} {selectedClaim.customerOrt}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle & Warranty Information */}
              <div className="border-t border-neutral-beige pt-4">
                <h3 className="font-underrubriker font-medium text-primary-dark mb-3">Fordon & Garanti</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Registreringsnummer</label>
                    <p className="body-text">{selectedClaim.warranty.vehicleRegistrationNumber}</p>
                  </div>
                  <div>
                    <label className="form-label">Fordon</label>
                    <p className="body-text">
                      {selectedClaim.warranty.vehicleData?.make} {selectedClaim.warranty.vehicleData?.model} ({selectedClaim.warranty.vehicleData?.year})
                    </p>
                  </div>
                  <div>
                    <label className="form-label">VIN</label>
                    <p className="body-text">{selectedClaim.warranty.vehicleData?.vin || '-'}</p>
                  </div>
                  <div>
                    <label className="form-label">Mätarställning vid skada</label>
                    <p className="body-text">{selectedClaim.mileage ? `${selectedClaim.mileage} km` : '-'}</p>
                  </div>
                  <div>
                    <label className="form-label">Skadedatum</label>
                    <p className="body-text">{new Date(selectedClaim.skadedatum).toLocaleDateString('sv-SE')}</p>
                  </div>
                  <div>
                    <label className="form-label">Garantinummer</label>
                    <p className="body-text">{selectedClaim.warranty.warrantyNumber}</p>
                  </div>
                  <div>
                    <label className="form-label">Produkt</label>
                    <p className="body-text">{selectedClaim.warranty.product.name}</p>
                  </div>
                  <div>
                    <label className="form-label">Återförsäljare</label>
                    <p className="body-text">{selectedClaim.warranty.dealer.companyName}</p>
                  </div>
                </div>
              </div>

              {/* Claim Details */}
              <div className="border-t border-neutral-beige pt-4">
                <h3 className="font-underrubriker font-medium text-primary-dark mb-3">Ärendedetaljer</h3>

                <div className="space-y-4">
                  {selectedClaim.customerDescription && (
                    <div>
                      <label className="form-label">Skadebeskrivning</label>
                      <p className="body-text whitespace-pre-wrap bg-neutral-beige/30 p-3 rounded">
                        {selectedClaim.customerDescription}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="form-label">Interna kommentarer</label>
                    <div className="space-y-3">
                      {/* Comment input */}
                      <div className="flex gap-2">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="form-input flex-1"
                          rows={2}
                          placeholder="Lägg till en kommentar..."
                        />
                        <button
                          type="button"
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="btn-primary self-start px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Lägg till
                        </button>
                      </div>

                      {/* Comments history */}
                      {comments.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto bg-neutral-beige/30 p-3 rounded">
                          {comments.map((comment) => (
                            <div key={comment.id} className="border-b border-neutral-beige pb-2 last:border-b-0">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-medium text-primary-dark">
                                  {comment.admin.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleString('sv-SE', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Kostnad</label>
                      <p className="body-text font-medium text-primary-dark">
                        {selectedClaim.costAmount ? `${Number(selectedClaim.costAmount).toLocaleString('sv-SE')} SEK` : '-'}
                      </p>
                    </div>
                    {selectedClaim.workshopInvoiceUrl && (
                      <div>
                        <label className="form-label">Verkstadsfaktura</label>
                        <a
                          href={selectedClaim.workshopInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-teal hover:underline"
                        >
                          Visa faktura →
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedClaim.processedBy && (
                    <div>
                      <label className="form-label">Handlagd av</label>
                      <p className="body-text">
                        {selectedClaim.processedBy.name} ({selectedClaim.processedBy.email})
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Skapad</label>
                      <p className="body-text">{formatDate(selectedClaim.createdAt)}</p>
                    </div>
                    <div>
                      <label className="form-label">Senast uppdaterad</label>
                      <p className="body-text">{formatDate(selectedClaim.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Attachments */}
              <div className="border-t border-neutral-beige pt-4">
                <h3 className="font-underrubriker font-medium text-primary-dark mb-3">Bifogade filer</h3>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Mätarställningsbild</label>
                    <div className="mt-2">
                      <a
                        href={selectedClaim.meterReadingImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-accent-teal hover:underline"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Visa mätarställningsbild
                      </a>
                    </div>
                  </div>

                  {selectedClaim.descriptionFiles && (() => {
                    try {
                      const files = JSON.parse(selectedClaim.descriptionFiles);
                      if (Array.isArray(files) && files.length > 0) {
                        return (
                          <div>
                            <label className="form-label">Beskrivningsbilder</label>
                            <div className="mt-2 space-y-2">
                              {files.map((file: string, index: number) => (
                                <div key={index}>
                                  <a
                                    href={file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-accent-teal hover:underline"
                                  >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Bild {index + 1}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {
                      console.error('Error parsing descriptionFiles:', e);
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-neutral-beige pt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedClaim(null);
                  }}
                  className="btn-secondary"
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Ta bort ärende"
        message={`Är du säker på att du vill ta bort ärendet #${claimToDelete?.id}?\n\nFordon: ${claimToDelete?.warranty.vehicleRegistrationNumber}\nDetta går inte att ångra.${deleteError ? `\n\nFel: ${deleteError}` : ''}`}
        confirmText="Ta bort"
        cancelText="Avbryt"
        isLoading={deletingClaimId === claimToDelete?.id}
        variant="danger"
      />

      {/* New Claim Modal */}
      {showNewClaimModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleNewClaimClose}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-neutral-beige px-6 py-4 flex justify-between items-center">
              <h2 className="heading-secondary">Ny skadeanmälan</h2>
              <button
                onClick={handleNewClaimClose}
                className="text-primary-forest hover:text-primary-dark text-2xl"
                disabled={submittingClaim}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleNewClaimSubmit} className="p-6 space-y-6">
              {claimFormError && (
                <div className="alert-error">
                  {claimFormError}
                </div>
              )}

              {/* Vehicle Information */}
              <div className="card">
                <div className="card-header">
                  <h3 className="subheading">Fordonsinformation</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Registreringsnummer *</label>
                      <input
                        type="text"
                        value={newClaimData.registrationNumber}
                        onChange={(e) => setNewClaimData({ ...newClaimData, registrationNumber: e.target.value.toUpperCase() })}
                        className="form-input"
                        placeholder="ABC123"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mätarställning</label>
                      <input
                        type="text"
                        value={newClaimData.mileage}
                        onChange={(e) => setNewClaimData({ ...newClaimData, mileage: e.target.value })}
                        className="form-input"
                        placeholder="12345"
                      />
                    </div>
                    <div className="form-group md:col-span-2">
                      <label className="form-label">Skadedatum *</label>
                      <input
                        type="date"
                        value={newClaimData.skadedatum}
                        onChange={(e) => setNewClaimData({ ...newClaimData, skadedatum: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="card">
                <div className="card-header">
                  <h3 className="subheading">Kundinformation</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Förnamn *</label>
                      <input
                        type="text"
                        value={newClaimData.firstname}
                        onChange={(e) => setNewClaimData({ ...newClaimData, firstname: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Efternamn *</label>
                      <input
                        type="text"
                        value={newClaimData.lastname}
                        onChange={(e) => setNewClaimData({ ...newClaimData, lastname: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Personnummer *</label>
                      <input
                        type="text"
                        value={newClaimData.personnummer}
                        onChange={(e) => setNewClaimData({ ...newClaimData, personnummer: e.target.value })}
                        className="form-input"
                        placeholder="YYYYMMDD-XXXX"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telefon *</label>
                      <input
                        type="tel"
                        value={newClaimData.phone}
                        onChange={(e) => setNewClaimData({ ...newClaimData, phone: e.target.value })}
                        className="form-input"
                        placeholder="+46701234567"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">E-post *</label>
                      <input
                        type="email"
                        value={newClaimData.email}
                        onChange={(e) => setNewClaimData({ ...newClaimData, email: e.target.value })}
                        className="form-input"
                        placeholder="namn@example.com"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Adress</label>
                      <input
                        type="text"
                        value={newClaimData.address}
                        onChange={(e) => setNewClaimData({ ...newClaimData, address: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Postnummer *</label>
                      <input
                        type="text"
                        value={newClaimData.postnummer}
                        onChange={(e) => setNewClaimData({ ...newClaimData, postnummer: e.target.value })}
                        className="form-input"
                        placeholder="12345"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ort *</label>
                      <input
                        type="text"
                        value={newClaimData.ort}
                        onChange={(e) => setNewClaimData({ ...newClaimData, ort: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Damage Description */}
              <div className="card">
                <div className="card-header">
                  <h3 className="subheading">Skadebeskrivning</h3>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Beskrivning av skadan</label>
                    <textarea
                      value={newClaimData.damageDescription}
                      onChange={(e) => setNewClaimData({ ...newClaimData, damageDescription: e.target.value })}
                      className="form-input"
                      rows={4}
                      placeholder="Beskriv skadan i detalj..."
                    />
                  </div>
                </div>
              </div>

              {/* File Uploads */}
              <div className="card">
                <div className="card-header">
                  <h3 className="subheading">Bilagor</h3>
                </div>
                <div className="card-body space-y-4">
                  <div className="form-group">
                    <label className="form-label">Mätarställningsbild</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setMeterReadingImage(e.target.files?.[0] || null)}
                      className="form-input"
                    />
                    {meterReadingImage && (
                      <p className="text-sm text-primary-forest mt-2">
                        Vald fil: {meterReadingImage.name}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Övriga bilder/dokument</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => setDescriptionFiles(Array.from(e.target.files || []))}
                      className="form-input"
                    />
                    {descriptionFiles.length > 0 && (
                      <p className="text-sm text-primary-forest mt-2">
                        {descriptionFiles.length} fil(er) valda
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-neutral-beige pt-4">
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleNewClaimClose}
                    className="btn-secondary"
                    disabled={submittingClaim}
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submittingClaim}
                  >
                    {submittingClaim ? 'Skickar...' : 'Skapa skadeanmälan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default withAuth(ClaimsPage, { allowedRoles: ['ADMIN'] });
