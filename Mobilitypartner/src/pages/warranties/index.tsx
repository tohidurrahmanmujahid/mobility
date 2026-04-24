import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DealerLayout from '@/components/dealer/Layout';
import { apiGet } from '@/utils/api';
import { withAuth } from '@/components/withAuth';
import Loader from '@/components/Loader';

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
  ownerFirstname?: string;
  ownerLastname?: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPersonnummer: string;
  ownerAddress?: string;
  ownerPostnummer?: string;
  ownerOrt?: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  product: {
    name: string;
  };
  registeredBy: {
    type: string;
    name: string;
    email: string;
  };
  _count?: {
    claims: number;
  };
}

const WarrantiesPage: React.FC = () => {
  const router = useRouter();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchWarranties();
  }, [pagination.page, pagination.limit, filters]);

  const fetchWarranties = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status })
      });

      const response = await apiGet(`/api/warranties?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch warranties');

      const data = await response.json();
      setWarranties(data.warranties);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages
      }));
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
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewClick = (warranty: Warranty) => {
    setSelectedWarranty(warranty);
    setShowViewModal(true);
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

  if (loading && warranties.length === 0) {
    return (
      <DealerLayout>
        <Loader className="h-64" size="large" />
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="heading-primary">Registrerade Garantier</h1>
            <p className="body-text mt-2">Översikt av alla dina registrerade garantier</p>
          </div>
          <button
            onClick={() => router.push('/warranties/register')}
            className="btn-primary"
          >
            + Registrera ny garanti
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Sök efter registreringsnummer, ägare eller VIN</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input"
                  placeholder="ABC123, namn eller VIN"
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

              <div className="form-group">
                <label className="form-label">&nbsp;</label>
                <button type="submit" className="btn-primary w-full">
                  Sök
                </button>
              </div>
            </form>
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
            Visar {warranties.length} av {pagination.total} garantier (Sida {pagination.page} av {pagination.pages})
          </div>
        </div>

        {/* Warranties Table */}
        <div className="card">
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
                  <th className="px-6 py-3 text-left text-xs font-underrubriker font-medium text-primary-dark uppercase tracking-wider">
                    Åtgärder
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
                      <div className="text-sm text-primary-dark">{warranty.registeredBy?.name || 'N/A'}</div>
                      <div className="text-sm text-primary-forest">{warranty.registeredBy?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewClick(warranty)}
                        className="btn-accent text-sm px-3 py-1"
                      >
                        Visa
                      </button>
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
                      const showPage =
                        page === 1 ||
                        page === pagination.pages ||
                        (page >= pagination.page - 1 && page <= pagination.page + 1);

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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm rounded border ${getStatusColor(selectedWarranty.status)}`}>
                    {getStatusText(selectedWarranty.status)}
                  </span>
                  <span className="text-sm text-primary-forest">
                    Registrerad: {formatDate(selectedWarranty.createdAt)}
                  </span>
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
                        <p className="text-sm text-primary-forest">E-post</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.ownerEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Telefon</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.ownerPhone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warranty Information */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="subheading">Garantiinformation</h3>
                  </div>
                  <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-primary-forest">Produkt</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.product.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Status</p>
                        <p className="font-medium text-primary-dark">{getStatusText(selectedWarranty.status)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Startdatum</p>
                        <p className="font-medium text-primary-dark">{formatDate(selectedWarranty.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Slutdatum</p>
                        <p className="font-medium text-primary-dark">{formatDate(selectedWarranty.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Registrerad av</p>
                        <p className="font-medium text-primary-dark">{selectedWarranty.registeredBy?.name || 'N/A'}</p>
                        <p className="text-sm text-primary-forest">{selectedWarranty.registeredBy?.email || ''}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-forest">Registreringsdatum</p>
                        <p className="font-medium text-primary-dark">{formatDate(selectedWarranty.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-neutral-beige px-6 py-4">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Stäng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DealerLayout>
  );
};

export default withAuth(WarrantiesPage, { allowedRoles: ['DEALER', 'DEALER_STAFF'] });
