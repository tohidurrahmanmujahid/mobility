import React, { useEffect, useState } from 'react';
import { FileText, Filter, Search, RefreshCw, Eye, Send, CheckCircle, Clock, XCircle, Ban } from 'lucide-react';
import AdminLayout from '@/components/admin/Layout';
import { apiGet, apiPost } from '@/utils/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/router';
import { withAuth } from '@/components/withAuth';

interface Invoice {
  id: number;
  invoiceNumber: string;
  fortnoxId?: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  fortnoxStatus?: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  dealer: {
    id: number;
    companyName: string;
    orgNumber: string;
  };
  warranty: {
    id: number;
    vehicleRegistrationNumber: string;
    ownerName: string;
    product: {
      id: number;
      name: string;
    };
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    fortnoxSynced: '',
  });

  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', filters.page.toString());
      queryParams.append('limit', filters.limit.toString());
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.fortnoxSynced) queryParams.append('fortnoxSynced', filters.fortnoxSynced);

      const response = await apiGet(`/api/admin/invoices?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncToFortnox = async (invoiceId: number) => {
    setSyncing(invoiceId);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiPost(`/api/admin/invoices/${invoiceId}/sync`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sync invoice');
      }

      setSuccess('Invoice synced to Fortnox successfully!');
      await fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync invoice');
    } finally {
      setSyncing(null);
    }
  };

  const handleSendInvoice = async (invoiceId: number) => {
    if (!confirm('Send this invoice via Fortnox?')) return;

    try {
      const response = await apiPost(`/api/admin/invoices/${invoiceId}/send`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send invoice');
      }

      setSuccess('Invoice sent successfully!');
      await fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invoice');
    }
  };

  const handleViewInvoice = (invoiceId: number) => {
    router.push(`/admin/invoices/${invoiceId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'SENT':
        return <Send className="w-4 h-4" />;
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'OVERDUE':
        return <XCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <Ban className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-primary">Invoices</h1>
            <p className="body-text mt-2">
              Manage and sync invoices with Fortnox
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            <div className="flex items-center justify-between">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
                ×
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-error">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="form-input"
                  placeholder="Invoice number, dealer..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                  className="form-input"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="SENT">Sent</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1">
                  Fortnox Sync
                </label>
                <select
                  value={filters.fortnoxSynced}
                  onChange={(e) => setFilters({ ...filters, fortnoxSynced: e.target.value, page: 1 })}
                  className="form-input"
                >
                  <option value="">All</option>
                  <option value="true">Synced</option>
                  <option value="false">Not Synced</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchInvoices}
                  className="btn-secondary w-full"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-secondary flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Invoices {pagination && `(${pagination.total})`}
            </h2>
          </div>
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-beige">
                <thead className="bg-neutral-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase">
                      Dealer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase">
                      Fortnox
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-primary-forest uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-beige">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-neutral-light">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-dark">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-xs text-primary-forest">
                          {formatDate(invoice.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-primary-dark">{invoice.dealer.companyName}</div>
                        <div className="text-xs text-primary-forest">{invoice.dealer.orgNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-primary-dark">{invoice.warranty.product.name}</div>
                        <div className="text-xs text-primary-forest">
                          {invoice.warranty.vehicleRegistrationNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-dark">
                          {formatCurrency(parseFloat(invoice.totalAmount.toString()))}
                        </div>
                        <div className="text-xs text-primary-forest">
                          (excl. VAT: {formatCurrency(parseFloat(invoice.amount.toString()))})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-dark">{formatDate(invoice.dueDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1">{invoice.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.fortnoxId ? (
                          <div className="flex items-center text-xs text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Synced
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Not synced</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewInvoice(invoice.id)}
                            className="text-accent-teal hover:text-accent-teal/80"
                            title="View invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!invoice.fortnoxId && (
                            <button
                              onClick={() => handleSyncToFortnox(invoice.id)}
                              disabled={syncing === invoice.id}
                              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              title="Sync to Fortnox"
                            >
                              {syncing === invoice.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {invoice.fortnoxId && invoice.status !== 'SENT' && invoice.status !== 'PAID' && (
                            <button
                              onClick={() => handleSendInvoice(invoice.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Send invoice"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && invoices.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-neutral-gray mx-auto mb-4" />
                  <p className="text-primary-forest">No invoices found</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-accent-teal mx-auto mb-4 animate-spin" />
                  <p className="text-primary-forest">Loading invoices...</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="card-footer">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-primary-forest">
                  <span>Visar</span>
                  <select
                    value={filters.limit}
                    onChange={(e) => setFilters({ ...filters, limit: Number(e.target.value), page: 1 })}
                    className="form-input py-1 px-2"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>av {pagination.total} fakturor</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, page: filters.page - 1 });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={filters.page === 1}
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
                        (page >= filters.page - 1 && page <= filters.page + 1);

                      // Show ellipsis
                      const showEllipsisBefore = page === filters.page - 2 && filters.page > 3;
                      const showEllipsisAfter = page === filters.page + 2 && filters.page < pagination.pages - 2;

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
                            setFilters({ ...filters, page });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-3 py-1 rounded border transition-colors ${
                            filters.page === page
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
                      setFilters({ ...filters, page: filters.page + 1 });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={filters.page === pagination.pages}
                    className="px-3 py-1 rounded border border-neutral-beige text-primary-dark hover:bg-neutral-beige disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Nästa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAuth(InvoicesPage, { allowedRoles: ['ADMIN'] });
