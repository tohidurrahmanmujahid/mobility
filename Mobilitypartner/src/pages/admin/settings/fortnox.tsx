import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import AdminLayout from '@/components/admin/Layout';
import { apiGet, apiPost } from '@/utils/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/router';
import { withAuth } from '@/components/withAuth';

interface FortnoxSettings {
  id: number;
  clientId: string;
  redirectUri: string;
  scopes: string;
  isActive: boolean;
  isAuthenticated: boolean;
  tokenExpiry?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ConnectionStatus {
  isConfigured: boolean;
  isAuthenticated: boolean;
  lastSync?: string;
}

const FortnoxSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<FortnoxSettings | null>(null);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();

  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: typeof window !== 'undefined'
      ? `${window.location.origin}/api/fortnox/callback`
      : '',
    scopes: 'invoice customer order bookkeeping',
  });

  useEffect(() => {
    fetchSettings();
    fetchStatus();

    // Check for OAuth callback success/error
    if (router.query.success === 'true') {
      setSuccess('Successfully connected to Fortnox!');
      // Refresh status
      setTimeout(() => {
        fetchStatus();
      }, 1000);
    } else if (router.query.error) {
      setError(`OAuth error: ${router.query.error}`);
    }
  }, [router.query]);

  const fetchSettings = async () => {
    try {
      const response = await apiGet('/api/fortnox/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch Fortnox settings');
      }
      const data = await response.json();

      if (data.settings) {
        setSettings(data.settings);
        setFormData({
          clientId: data.settings.clientId,
          clientSecret: '', // Never show client secret
          redirectUri: data.settings.redirectUri,
          scopes: data.settings.scopes,
        });
      } else {
        setShowForm(true); // Show form if no settings exist
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await apiGet('/api/fortnox/status');
      if (!response.ok) {
        throw new Error('Failed to fetch Fortnox status');
      }
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiPost('/api/fortnox/settings', formData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }

      const data = await response.json();
      setSettings(data.settings);
      setSuccess('Settings saved successfully!');
      setShowForm(false);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await apiGet('/api/fortnox/authorize');
      if (!response.ok) {
        throw new Error('Failed to get authorization URL');
      }
      const data = await response.json();

      // Redirect to Fortnox authorization page
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth flow');
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary-dark">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-primary">Fortnox Integration</h1>
            <p className="body-text mt-2">
              Configure and manage your Fortnox API integration for automated invoicing
            </p>
          </div>
          {settings && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-secondary flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Settings
            </button>
          )}
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

        {/* Connection Status Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-secondary">Connection Status</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                {status?.isConfigured ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <div className="text-sm font-medium text-primary-dark">Configuration</div>
                  <div className="text-xs text-primary-forest">
                    {status?.isConfigured ? 'Configured' : 'Not configured'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {status?.isAuthenticated ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <div className="text-sm font-medium text-primary-dark">Authentication</div>
                  <div className="text-xs text-primary-forest">
                    {status?.isAuthenticated ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <RefreshCw className="w-6 h-6 text-accent-teal" />
                <div>
                  <div className="text-sm font-medium text-primary-dark">Last Sync</div>
                  <div className="text-xs text-primary-forest">
                    {status?.lastSync
                      ? new Date(status.lastSync).toLocaleString('sv-SE')
                      : 'Never'
                    }
                  </div>
                </div>
              </div>
            </div>

            {status?.isConfigured && !status?.isAuthenticated && (
              <div className="mt-6 pt-6 border-t border-neutral-beige">
                <button
                  onClick={handleConnect}
                  className="btn-primary flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect to Fortnox
                </button>
                <p className="text-sm text-primary-forest mt-2">
                  Click to authorize this application to access your Fortnox account
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Settings Form */}
        {showForm && (
          <div className="card">
            <div className="card-header">
              <h2 className="heading-secondary">API Configuration</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Client ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    className="form-input"
                    placeholder="Your Fortnox Client ID"
                  />
                  <p className="text-xs text-primary-forest mt-1">
                    Get this from the Fortnox Developer Portal
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Client Secret *
                  </label>
                  <input
                    type="password"
                    required={!settings}
                    value={formData.clientSecret}
                    onChange={(e) => handleInputChange('clientSecret', e.target.value)}
                    className="form-input"
                    placeholder={settings ? 'Leave blank to keep current secret' : 'Your Fortnox Client Secret'}
                  />
                  <p className="text-xs text-primary-forest mt-1">
                    Keep this secret secure
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Redirect URI *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.redirectUri}
                    onChange={(e) => handleInputChange('redirectUri', e.target.value)}
                    className="form-input"
                    placeholder="https://yourapp.com/api/fortnox/callback"
                  />
                  <p className="text-xs text-primary-forest mt-1">
                    This must match exactly with the URI configured in Fortnox Developer Portal
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Scopes *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.scopes}
                    onChange={(e) => handleInputChange('scopes', e.target.value)}
                    className="form-input"
                    placeholder="invoice customer order article"
                  />
                  <p className="text-xs text-primary-forest mt-1">
                    Space-separated list of API scopes
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  {settings && (
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="btn-secondary"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Current Settings Display */}
        {settings && !showForm && (
          <div className="card">
            <div className="card-header">
              <h2 className="heading-secondary">Current Configuration</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-primary-dark">Client ID</div>
                  <div className="text-sm text-primary-forest font-mono">{settings.clientId}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-primary-dark">Redirect URI</div>
                  <div className="text-sm text-primary-forest font-mono">{settings.redirectUri}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-primary-dark">Scopes</div>
                  <div className="text-sm text-primary-forest font-mono">{settings.scopes}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-primary-dark">Token Expiry</div>
                  <div className="text-sm text-primary-forest">
                    {settings.tokenExpiry
                      ? new Date(settings.tokenExpiry).toLocaleString('sv-SE')
                      : 'Not authenticated'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documentation */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-primary-dark mb-2">Setup Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-primary-forest">
              <li>Create an integration at <a href="https://developer.fortnox.se/developer-portal" target="_blank" rel="noopener noreferrer" className="text-accent-teal hover:underline">Fortnox Developer Portal</a></li>
              <li>Copy your Client ID and Client Secret</li>
              <li>Set the Redirect URI to: <code className="bg-white px-2 py-1 rounded text-xs">{formData.redirectUri}</code></li>
              <li>Configure the API scopes: <code className="bg-white px-2 py-1 rounded text-xs">invoice customer order article</code></li>
              <li>Save the settings above</li>
              <li>Click "Connect to Fortnox" to authorize the integration</li>
            </ol>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAuth(FortnoxSettingsPage, { allowedRoles: ['ADMIN'] });
