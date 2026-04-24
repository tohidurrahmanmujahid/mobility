import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/Layout';
import ConfirmModal from '@/components/ConfirmModal';
import { apiGet, apiDelete, apiPut, apiPost } from '@/utils/api';
import Loader from '@/components/Loader';
import { withAuth } from '@/components/withAuth';

interface WarrantyComment {
  id: number;
  comment: string;
  createdAt: string;
  admin: {
    id: number;
    name: string;
    email: string;
  };
}

interface Warranty {
  id: number;
  warrantyNumber: string;
  vehicleRegistrationNumber: string;
  vehicleData: {
    make: string;
    model: string;
    year: number;
    mileage: number;
    vin: string;
    powerHp?: number;
  };
  ownerName: string;
  ownerFirstname?: string;
  ownerLastname?: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPersonnummer: string;
  ownerAddress?: string;
  ownerPostnummer?: string;
  ownerOrt?: string;
  comment?: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  dealer: {
    companyName: string;
    orgNumber: string;
  };
  product: {
    name: string;
  };
  registeredBy: {
    name: string;
    email: string;
  };
  _count: {
    claims: number;
  };
}

interface Dealer {
  id: number;
  companyName: string;
  staff: {
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  }[];
}

const WarrantiesPage: React.FC = () => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingWarrantyId, setDeletingWarrantyId] = useState<number | null>(null);
  const [warrantyToDelete, setWarrantyToDelete] = useState<Warranty | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedComment, setEditedComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [comments, setComments] = useState<WarrantyComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    dealer: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [dealerSearchTerm, setDealerSearchTerm] = useState('');
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [selectedDealerName, setSelectedDealerName] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchDealers();
  }, []);

  useEffect(() => {
    fetchWarranties();
    // Scroll to top when page or limit changes
    if (pagination.page > 1 || pagination.limit !== 20) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dealer-search-container')) {
        setShowDealerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDealers = async () => {
    try {
      const response = await apiGet('/api/admin/dealers');
      if (response.ok) {
        const data = await response.json();
        setDealers(data.dealers);
      }
    } catch (err) {
      console.error('Error fetching dealers:', err);
    }
  };

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.dealer && { dealer: filters.dealer }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await apiGet(`/api/admin/warranties?${searchParams}`);
      if (!response.ok) throw new Error('Failed to fetch warranties');

      const data = await response.json();
      setWarranties(data.warranties);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWarranties();
  };

  const fetchComments = async (warrantyId: number) => {
    try {
      const response = await apiGet(`/api/admin/warranties/${warrantyId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!selectedWarranty || !newComment.trim()) return;

    setIsAddingComment(true);
    setCommentError(null);

    try {
      const response = await apiPost(`/api/admin/warranties/${selectedWarranty.id}/comments`, {
        comment: newComment
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add comment');
      }

      const data = await response.json();
      setComments([data.comment, ...comments]);
      setNewComment('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Kunde inte lägga till kommentar');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleViewClick = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
    setEditedEmail(warranty.ownerEmail);
    setEditedPhone(warranty.ownerPhone);
    setSaveError(null);
    setSaveSuccess(false);
    setNewComment('');
    setCommentError(null);
    setComments([]);
    setShowViewModal(true);
    fetchComments(warranty.id);
  };

  const handleSaveWarranty = async () => {
    if (!selectedWarranty) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await apiPut(`/api/admin/warranties/${selectedWarranty.id}`, {
        ownerEmail: editedEmail,
        ownerPhone: editedPhone
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save changes');
      }

      // Update local state
      setSelectedWarranty({
        ...selectedWarranty,
        ownerEmail: editedEmail,
        ownerPhone: editedPhone
      });

      // Update warranties list
      setWarranties(warranties.map(w =>
        w.id === selectedWarranty.id
          ? { ...w, ownerEmail: editedEmail, ownerPhone: editedPhone }
          : w
      ));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Kunde inte spara ändringar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (warranty: Warranty) => {
    setWarrantyToDelete(warranty);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!warrantyToDelete) return;

    setDeletingWarrantyId(warrantyToDelete.id);
    setDeleteError(null);

    try {
      const response = await apiDelete(`/api/admin/warranties/${warrantyToDelete.id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete warranty');
      }

      // Refresh warranties list
      await fetchWarranties();

      // Close modal
      setShowDeleteModal(false);
      setWarrantyToDelete(null);
    } catch (err) {
      console.error('Error deleting warranty:', err);
      setDeleteError(err instanceof Error ? err.message : 'Kunde inte ta bort garanti');
    } finally {
      setDeletingWarrantyId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setWarrantyToDelete(null);
    setDeleteError(null);
  };

  const handleDealerSelect = (dealer: Dealer) => {
    setFilters(prev => ({ ...prev, dealer: dealer.id.toString() }));
    setSelectedDealerName(dealer.companyName);
    setDealerSearchTerm('');
    setShowDealerDropdown(false);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDealerSearchChange = (value: string) => {
    setDealerSearchTerm(value);
    setShowDealerDropdown(true);
    if (value === '') {
      setFilters(prev => ({ ...prev, dealer: '' }));
      setSelectedDealerName('');
    }
  };

  const getFilteredDealers = () => {
    if (!dealerSearchTerm) return dealers;

    const searchLower = dealerSearchTerm.toLowerCase();

    return dealers.filter(dealer => {
      // Check if company name matches
      if (dealer.companyName.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Check if any staff member's first or last name starts with the search term
      return dealer.staff.some(staff => {
        const nameParts = staff.name.toLowerCase().split(' ');
        return nameParts.some(part => part.startsWith(searchLower));
      });
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(warranties.map(w => w.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const getStatusTextForExport = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Aktiv';
      case 'EXPIRED': return 'Utgången';
      case 'CANCELLED': return 'Avbruten';
      default: return status;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let dataToExport: Warranty[] = [];

      if (selectedIds.size > 0) {
        // Export only selected warranties
        dataToExport = warranties.filter(w => selectedIds.has(w.id));
      } else {
        // Export all with current filters (fetch all pages)
        const searchParams = new URLSearchParams({
          page: '1',
          limit: '10000',
          ...(filters.search && { search: filters.search }),
          ...(filters.dealer && { dealer: filters.dealer }),
          ...(filters.status && { status: filters.status }),
          ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
          ...(filters.dateTo && { dateTo: filters.dateTo })
        });

        const response = await apiGet(`/api/admin/warranties?${searchParams}`);
        if (!response.ok) throw new Error('Failed to fetch warranties for export');
        const data = await response.json();
        dataToExport = data.warranties;
      }

      if (dataToExport.length === 0) {
        alert('Inga garantier att exportera');
        return;
      }

      // Build CSV with BOM for Excel Swedish character support
      const headers = ['Garantinummer', 'Registreringsnummer', 'Fordon', 'Ägare', 'Återförsäljare', 'Produkt', 'Status', 'Giltig till', 'Ärenden', 'Datum'];
      const rows = dataToExport.map(w => [
        w.warrantyNumber,
        w.vehicleRegistrationNumber,
        `${w.vehicleData.make} ${w.vehicleData.model}`,
        w.ownerName,
        w.dealer.companyName,
        w.product.name,
        getStatusTextForExport(w.status),
        formatDate(w.endDate),
        w._count.claims.toString(),
        formatDate(w.createdAt)
      ]);

      const escapeCsv = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const csvContent = '\uFEFF' + [
        headers.map(escapeCsv).join(','),
        ...rows.map(row => row.map(escapeCsv).join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `garantier_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Kunde inte exportera garantier');
    } finally {
      setIsExporting(false);
    }
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

  if (loading && warranties.length === 0) {
    return (
      <AdminLayout>
        <Loader className="h-64" size="large" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="heading-primary">Registrerade garantier</h1>
          <p className="body-text mt-2">Översikt och hantering av alla registrerade garantier</p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="card-body py-3 px-4">
            <form onSubmit={handleSearch}>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px]">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="form-input py-1.5 text-sm w-full"
                    placeholder="Reg.nr / garantinummer..."
                  />
                </div>

                <div className="relative dealer-search-container min-w-[160px] flex-1">
                  <input
                    type="text"
                    value={selectedDealerName || dealerSearchTerm}
                    onChange={(e) => handleDealerSearchChange(e.target.value)}
                    onFocus={() => setShowDealerDropdown(true)}
                    className="form-input py-1.5 text-sm w-full"
                    placeholder="Återförsäljare..."
                  />
                  {selectedDealerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, dealer: '' }));
                        setSelectedDealerName('');
                        setDealerSearchTerm('');
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-forest hover:text-primary-dark text-sm"
                    >
                      ✕
                    </button>
                  )}
                  {showDealerDropdown && dealerSearchTerm && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-beige rounded-md shadow-lg max-h-60 overflow-auto">
                      {getFilteredDealers().length > 0 ? (
                        getFilteredDealers().map((dealer) => (
                          <div
                            key={dealer.id}
                            onClick={() => handleDealerSelect(dealer)}
                            className="px-3 py-2 hover:bg-neutral-beige cursor-pointer"
                          >
                            <div className="font-medium text-primary-dark text-sm">
                              {dealer.companyName}
                            </div>
                            {dealer.staff.length > 0 && (
                              <div className="text-xs text-primary-forest">
                                {dealer.staff.map(s => s.name).join(', ')}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-primary-forest text-sm">
                          Inga återförsäljare hittades
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-[120px]">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="form-input py-1.5 text-sm w-full"
                  >
                    <option value="">Alla status</option>
                    <option value="ACTIVE">Aktiv</option>
                    <option value="EXPIRED">Utgången</option>
                    <option value="CANCELLED">Avbruten</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="form-input py-1.5 text-sm w-[140px]"
                    title="Datum från"
                  />
                  <span className="text-primary-forest text-sm">–</span>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="form-input py-1.5 text-sm w-[140px]"
                    title="Datum till"
                  />
                </div>

                <button type="submit" className="btn-primary py-1.5 px-4 text-sm">
                  Sök
                </button>

                {(filters.search || filters.dealer || filters.status || filters.dateFrom || filters.dateTo) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({ search: '', dealer: '', status: '', dateFrom: '', dateTo: '' });
                      setSelectedDealerName('');
                      setDealerSearchTerm('');
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="text-sm text-primary-forest hover:text-primary-dark underline py-1.5"
                  >
                    Rensa
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Export bar */}
        {(selectedIds.size > 0 || warranties.length > 0) && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-primary-forest">
              {selectedIds.size > 0 && (
                <span>{selectedIds.size} av {warranties.length} valda på sidan</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="btn-accent py-1.5 px-4 text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {isExporting ? 'Exporterar...' : selectedIds.size > 0 ? `Exportera valda (${selectedIds.size})` : `Exportera alla (${pagination.total})`}
            </button>
          </div>
        )}

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {/* Warranties Table */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-beige">
                <tr>
                  <th className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={warranties.length > 0 && selectedIds.size === warranties.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-beige"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Garantinummer
                  </th>
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
                    Återförsäljare
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
                    Ärenden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="bg-neutral-light divide-y divide-neutral-beige">
                {warranties.map((warranty) => (
                  <tr key={warranty.id} className={`hover:bg-neutral-beige/30 ${selectedIds.has(warranty.id) ? 'bg-accent-teal/5' : ''}`}>
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(warranty.id)}
                        onChange={(e) => handleSelectOne(warranty.id, e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-beige"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-underrubriker font-medium text-primary-dark">
                        {warranty.warrantyNumber}
                      </div>
                    </td>
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
                        {warranty.vehicleData.year} • {warranty.vehicleData.mileage.toLocaleString()} km{warranty.vehicleData.powerHp ? ` • ${warranty.vehicleData.powerHp} hk` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">{warranty.ownerName}</div>
                      <div className="text-sm text-primary-forest">{warranty.ownerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary-dark">{warranty.dealer.companyName}</div>
                      <div className="text-sm text-primary-forest">{warranty.dealer.orgNumber}</div>
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
                      <span className="text-sm text-primary-dark">
                        {warranty._count.claims}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-forest">
                      {formatDate(warranty.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewClick(warranty)}
                          className="btn-accent text-sm px-3 py-1"
                        >
                          Visa
                        </button>
                        {warranty.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleDeleteClick(warranty)}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                          >
                            Ta bort
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {warranties.length === 0 && !loading && (
            <div className="text-center py-12 text-primary-forest">
              Inga garantier hittades med de valda filtren
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
                  <span>av {pagination.total} garantier</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
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
                          onClick={() => setPagination(prev => ({ ...prev, page }))}
                          className={`px-3 py-1 rounded border transition-colors ${
                            pagination.page === page
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
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
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

        {/* View Warranty Details Modal */}
        {showViewModal && selectedWarranty && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-neutral-beige px-6 py-4 flex justify-between items-center">
                <h2 className="heading-secondary">Garantiinformation</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-primary-forest hover:text-primary-dark text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status Badge & Warranty Number */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm rounded border ${getStatusColor(selectedWarranty.status)}`}>
                      {getStatusText(selectedWarranty.status)}
                    </span>
                    <span className="text-sm text-primary-forest">
                      Registrerad: {formatDate(selectedWarranty.createdAt)}
                    </span>
                  </div>
                  <div className="font-medium text-primary-dark">
                    {selectedWarranty.warrantyNumber}
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="subheading">Fordonsinformation</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-primary-forest">Registreringsnummer</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.vehicleRegistrationNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">VIN</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.vehicleData.vin}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Märke & Modell</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.vehicleData.make} {selectedWarranty.vehicleData.model}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Årsmodell</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.vehicleData.year}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Mätarställning</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.vehicleData.mileage.toLocaleString()} km</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="subheading">Ägarinformation</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-primary-forest">Personnummer</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.ownerPersonnummer}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Förnamn</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.ownerFirstname || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Efternamn</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.ownerLastname || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Namn (kombinerat)</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.ownerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Adress</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.ownerAddress || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Postnummer</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.ownerPostnummer || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Ort</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.ownerOrt || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-primary-forest block mb-1">E-post</label>
                        <input
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          className="form-input w-full"
                          placeholder="E-postadress"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-primary-forest block mb-1">Telefon</label>
                        <input
                          type="tel"
                          value={editedPhone}
                          onChange={(e) => setEditedPhone(e.target.value)}
                          className="form-input w-full"
                          placeholder="Telefonnummer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="subheading">Kommentarer</h3>
                  </div>
                  <div className="card-body space-y-4">
                    {/* Add new comment */}
                    <div className="flex gap-2">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="form-input flex-1 h-20 resize-none"
                        placeholder="Skriv en kommentar..."
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={isAddingComment || !newComment.trim()}
                        className="btn-primary px-4 self-end"
                      >
                        {isAddingComment ? 'Lägger till...' : 'Lägg till'}
                      </button>
                    </div>

                    {commentError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                        {commentError}
                      </div>
                    )}

                    {/* Comments history */}
                    <div className="border-t border-neutral-beige pt-4">
                      <h4 className="text-sm font-medium text-primary-dark mb-3">Kommentarshistorik</h4>
                      {comments.length === 0 ? (
                        <p className="text-sm text-primary-forest text-center py-4">Inga kommentarer ännu</p>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {comments.map((comment) => (
                            <div key={comment.id} className="bg-neutral-beige/30 rounded p-3 border border-neutral-beige">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-sm font-medium text-primary-dark">{comment.admin.name}</p>
                                  <p className="text-xs text-primary-forest">{comment.admin.email}</p>
                                </div>
                                <p className="text-xs text-primary-forest">
                                  {new Date(comment.createdAt).toLocaleString('sv-SE', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <p className="text-sm text-primary-dark whitespace-pre-wrap">{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dealer Information */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="subheading">Återförsäljare</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-primary-forest">Företagsnamn</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.dealer.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Organisationsnummer</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.dealer.orgNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product & Coverage */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="subheading">Produkt & Täckning</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-primary-forest">Produkt</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.product.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Registrerad av</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.registeredBy.name}</p>
                        <p className="text-sm text-primary-forest">{selectedWarranty.registeredBy.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Startdatum</p>
                        <p className="font-medium text-primary-dark">{formatDate(selectedWarranty.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Slutdatum</p>
                        <p className="font-medium text-primary-dark">{formatDate(selectedWarranty.endDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claims Summary */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="subheading">Ärenden</h3>
                  </div>
                  <div className="card-body">
                    <div className="text-center p-4 bg-accent-teal/10 rounded">
                      <div className="text-3xl font-bold text-accent-teal">
                        {selectedWarranty._count.claims}
                      </div>
                      <div className="text-sm text-primary-forest">Totalt antal ärenden</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-neutral-beige px-6 py-4">
                {saveSuccess && (
                  <div className="mb-3 p-3 bg-accent-teal/10 border border-accent-teal/20 text-accent-teal rounded text-sm">
                    Ändringar sparade
                  </div>
                )}
                {saveError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                    {saveError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Stäng
                  </button>
                  <button
                    onClick={handleSaveWarranty}
                    disabled={isSaving}
                    className="btn-primary flex-1"
                  >
                    {isSaving ? 'Sparar...' : 'Spara ändringar'}
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
          title="Ta bort garanti"
          message={`Är du säker på att du vill ta bort garantin för ${warrantyToDelete?.vehicleRegistrationNumber}?\n\nÄgare: ${warrantyToDelete?.ownerName}\nDetta går inte att ångra.${deleteError ? `\n\nFel: ${deleteError}` : ''}`}
          confirmText="Ta bort"
          cancelText="Avbryt"
          isLoading={deletingWarrantyId === warrantyToDelete?.id}
          variant="danger"
        />
      </div>
    </AdminLayout>
  );
};

export default withAuth(WarrantiesPage, { allowedRoles: ['ADMIN'] });