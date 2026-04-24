import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/Layout';
import { apiGet } from '@/utils/api';
import Loader from '@/components/Loader';
import { withAuth } from '@/components/withAuth';

interface AuditLogEntry {
  id: number;
  action: string;
  entity: string;
  entityId: string;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
};

const ENTITY_LABELS: Record<string, string> = {
  product: 'Produkt',
  warranty: 'Garanti',
  claim: 'Ärende',
  invoice: 'Faktura',
  dealer: 'Återförsäljare',
  dealer_staff: 'Personal',
  user: 'Användare',
  warranty_comment: 'Garanti kommentar',
  dealer_comment: 'Återförsäljare kommentar',
  claim_comment: 'Ärende kommentar',
  fortnox_settings: 'Fortnox',
};

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    entity: '',
    action: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.entity && { entity: filters.entity }),
        ...(filters.action && { action: filters.action }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await apiGet(`/api/admin/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data = await response.json();
      setLogs(data.logs);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderJsonDiff = (before: Record<string, any> | null, after: Record<string, any> | null, action: string) => {
    if (action === 'CREATE' && after) {
      return (
        <div className="space-y-1">
          {Object.entries(after).map(([key, value]) => (
            <div key={key} className="flex text-xs">
              <span className="text-primary-forest w-32 shrink-0 font-medium">{key}:</span>
              <span className="text-green-700">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      );
    }

    if (action === 'DELETE' && before) {
      return (
        <div className="space-y-1">
          {Object.entries(before).map(([key, value]) => (
            <div key={key} className="flex text-xs">
              <span className="text-primary-forest w-32 shrink-0 font-medium">{key}:</span>
              <span className="text-red-600 line-through">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      );
    }

    if (action === 'UPDATE' && before && after) {
      const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
      return (
        <div className="space-y-1">
          {allKeys.map(key => (
            <div key={key} className="flex text-xs">
              <span className="text-primary-forest w-32 shrink-0 font-medium">{key}:</span>
              <span className="text-red-600 line-through mr-2">{formatValue(before[key])}</span>
              <span className="text-primary-forest mr-2">&rarr;</span>
              <span className="text-green-700">{formatValue(after[key])}</span>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-xs text-primary-forest">Ingen data</span>;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const entities = [...new Set(logs.map(l => l.entity))].sort();

  if (loading && logs.length === 0) {
    return (
      <AdminLayout>
        <Loader className="h-64" size="large" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="heading-primary">Ändringslogg</h1>
          <p className="body-text mt-1">Alla ändringar i systemet loggas här</p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="card-body py-3 px-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[150px]">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="form-input py-1.5 text-sm w-full"
                  placeholder="Sök namn, email, ID..."
                />
              </div>

              <div className="w-[140px]">
                <select
                  value={filters.entity}
                  onChange={(e) => handleFilterChange('entity', e.target.value)}
                  className="form-input py-1.5 text-sm w-full"
                >
                  <option value="">Alla typer</option>
                  {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="w-[120px]">
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="form-input py-1.5 text-sm w-full"
                >
                  <option value="">Alla åtgärder</option>
                  <option value="CREATE">Skapa</option>
                  <option value="UPDATE">Ändra</option>
                  <option value="DELETE">Ta bort</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="form-input py-1.5 text-sm w-[140px]"
                />
                <span className="text-primary-forest text-sm">–</span>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="form-input py-1.5 text-sm w-[140px]"
                />
              </div>

              {(filters.search || filters.entity || filters.action || filters.dateFrom || filters.dateTo) && (
                <button
                  onClick={() => {
                    setFilters({ entity: '', action: '', search: '', dateFrom: '', dateTo: '' });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="text-sm text-primary-forest hover:text-primary-dark underline py-1.5"
                >
                  Rensa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-primary-forest">
          {pagination.total} loggposter
        </div>

        {/* Log entries */}
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-beige">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-primary-dark uppercase">Tidpunkt</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-primary-dark uppercase">Användare</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-primary-dark uppercase">Åtgärd</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-primary-dark uppercase">Typ</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-primary-dark uppercase">ID</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-primary-dark uppercase">IP</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-primary-dark uppercase">Detaljer</th>
                </tr>
              </thead>
              <tbody className="bg-neutral-light divide-y divide-neutral-beige">
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-neutral-beige/30">
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-primary-dark">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {log.userName ? (
                          <div>
                            <div className="text-xs font-medium text-primary-dark">{log.userName}</div>
                            <div className="text-xs text-primary-forest">{log.userEmail}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-primary-forest">System / Publik</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs rounded font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {log.action === 'CREATE' ? 'Skapad' : log.action === 'UPDATE' ? 'Ändrad' : 'Borttagen'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-primary-dark">
                        {ENTITY_LABELS[log.entity] || log.entity}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-primary-forest font-mono">
                        {log.entityId}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-xs text-primary-forest font-mono">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className="text-xs text-accent-teal hover:underline"
                        >
                          {expandedId === log.id ? 'Dölj' : 'Visa'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 bg-neutral-beige/20">
                          {renderJsonDiff(log.before, log.after, log.action)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && !loading && (
            <div className="text-center py-12 text-primary-forest">
              Inga loggposter hittades
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="card">
            <div className="card-body py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-primary-forest">
                  Sida {pagination.page} av {pagination.pages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded border border-neutral-beige text-sm text-primary-dark hover:bg-neutral-beige disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Föregående
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 rounded border border-neutral-beige text-sm text-primary-dark hover:bg-neutral-beige disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Nästa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default withAuth(AuditLogPage, { allowedRoles: ['ADMIN'] });
