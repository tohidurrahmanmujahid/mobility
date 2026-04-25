import React, { useEffect, useState } from 'react';
import { Users, Plus, UserCheck, UserX, Mail, Phone, Calendar, Edit2, Key } from 'lucide-react';
import AdminLayout from '@/components/admin/Layout';
import ConfirmModal from '@/components/ConfirmModal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { withAuth } from '@/components/withAuth';

interface Admin {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
  permissions: { permission: string }[];
}

interface AdminRegistrationData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  permissions: string[];
}

interface AdminUpdateData {
  name: string;
  email: string;
  phone?: string;
  permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'DEALERS', label: 'Återförsäljare' },
  { value: 'NEW_DEALER', label: 'Ny återförsäljare' },
  { value: 'PRODUCTS', label: 'Produkter' },
  { value: 'REGISTERED_PRODUCTS', label: 'Registrerade Produkter' },
  { value: 'CLAIMS', label: 'Skadereglering' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'SETTINGS', label: 'Inställningar' },
];

const AdminSettings: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<number | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    isSuperAdmin: boolean;
    permissions: { permission: string }[];
  } | null>(null);
  const { t } = useLanguage();
  const [registrationData, setRegistrationData] = useState<AdminRegistrationData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    permissions: []
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateData, setUpdateData] = useState<AdminUpdateData>({
    name: '',
    email: '',
    phone: '',
    permissions: []
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminToChangePassword, setAdminToChangePassword] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Filter available permissions based on current user's permissions
  const availablePermissions = React.useMemo(() => {
    if (!currentUser) return [];

    // Super admin can assign all permissions
    if (currentUser.isSuperAdmin) {
      return AVAILABLE_PERMISSIONS;
    }

    // Regular admin can only assign permissions they have
    const userPermissionValues = currentUser.permissions.map(p => p.permission);
    return AVAILABLE_PERMISSIONS.filter(perm => userPermissionValues.includes(perm.value));
  }, [currentUser]);

  useEffect(() => {
    fetchCurrentUser();
    fetchAdmins();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiGet('/api/auth/me');
      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }
      const data = await response.json();
      setCurrentUser({
        id: data.id,
        isSuperAdmin: data.isSuperAdmin,
        permissions: data.permissions || []
      });
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await apiGet('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch admin users');
      }
      const data = await response.json();
      setAdmins(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate permissions
    if (registrationData.permissions.length === 0) {
      setError('Välj minst en behörighet för administratören');
      return;
    }

    setRegistrationLoading(true);

    try {
      const response = await apiPost('/api/admin/register', registrationData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register admin');
      }

      // Reset form and close modal
      setRegistrationData({ name: '', email: '', password: '', phone: '', permissions: [] });
      setShowModal(false);

      // Refresh admin list
      await fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
  };

  const handleDeleteClick = (admin: Admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;

    setDeletingAdminId(adminToDelete.id);
    setDeleteError(null);

    try {
      const response = await apiDelete(`/api/admin/users/${adminToDelete.id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete admin');
      }

      // Refresh admins list
      await fetchAdmins();

      // Close modal
      setShowDeleteModal(false);
      setAdminToDelete(null);
    } catch (err) {
      console.error('Error deleting admin:', err);
      setDeleteError(err instanceof Error ? err.message : 'Kunde inte ta bort administratör');
    } finally {
      setDeletingAdminId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAdminToDelete(null);
    setDeleteError(null);
  };

  const handleInputChange = (field: keyof AdminRegistrationData, value: string) => {
    setRegistrationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePermission = (permission: string) => {
    setRegistrationData(prev => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
  };

  const toggleAllPermissions = () => {
    setRegistrationData(prev => {
      const allSelected = prev.permissions.length === availablePermissions.length;
      return {
        ...prev,
        permissions: allSelected ? [] : availablePermissions.map(p => p.value)
      };
    });
  };

  const handleEditClick = (admin: Admin) => {
    setEditingAdmin(admin);
    setUpdateData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone || '',
      permissions: admin.permissions.map(p => p.permission)
    });
    setShowEditModal(true);
    setError(null);
  };

  const handleUpdateInputChange = (field: keyof AdminUpdateData, value: string) => {
    setUpdateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleUpdatePermission = (permission: string) => {
    setUpdateData(prev => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
  };

  const toggleAllUpdatePermissions = () => {
    setUpdateData(prev => {
      const allSelected = prev.permissions.length === availablePermissions.length;
      return {
        ...prev,
        permissions: allSelected ? [] : availablePermissions.map(p => p.value)
      };
    });
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAdmin) return;

    // Validate permissions
    if (updateData.permissions.length === 0) {
      setError('Välj minst en behörighet för administratören');
      return;
    }

    setUpdateLoading(true);

    try {
      const response = await apiPut(`/api/admin/users/${editingAdmin.id}`, updateData);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update admin');
      }

      // Reset form and close modal
      setUpdateData({ name: '', email: '', phone: '', permissions: [] });
      setShowEditModal(false);
      setEditingAdmin(null);

      // Refresh admin list
      await fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordChangeClick = (admin: Admin) => {
    setAdminToChangePassword(admin);
    setNewPassword('');
    setShowPasswordModal(true);
    setError(null);
  };

  const handleChangePassword = async () => {
    if (!adminToChangePassword) return;

    if (newPassword.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken långt');
      return;
    }

    setChangingPassword(true);
    setError(null);

    try {
      const response = await apiPut(`/api/admin/users/${adminToChangePassword.id}/change-password`, {
        newPassword
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }

      setShowPasswordModal(false);
      setAdminToChangePassword(null);
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary-dark">{t('common.loading')}</div>
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
            <h1 className="heading-primary">{t('settings.title')}</h1>
            <p className="body-text mt-2">{t('settings.subtitle')}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!currentUser || (!currentUser.isSuperAdmin && currentUser.permissions.length === 0)}
            title={!currentUser || (!currentUser.isSuperAdmin && currentUser.permissions.length === 0)
              ? 'Du har inga behörigheter att skapa administratörer'
              : 'Registrera ny administratör'}
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('settings.registerAdmin')}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert-error">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Permission Info for non-super admins */}
        {currentUser && !currentUser.isSuperAdmin && currentUser.permissions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Dina delegerbara behörigheter
            </h3>
            <p className="text-xs text-blue-700 mb-2">
              Du kan endast tilldela behörigheter som du själv har:
            </p>
            <div className="flex flex-wrap gap-2">
              {currentUser.permissions.map((perm, idx) => {
                const permLabel = AVAILABLE_PERMISSIONS.find(p => p.value === perm.permission)?.label || perm.permission;
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                  >
                    {permLabel}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin List */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-secondary flex items-center">
              <Users className="w-5 h-5 mr-2" />
              {t('settings.administrators')} ({admins.length})
            </h2>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-beige">
                <thead className="bg-neutral-light">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                      {t('common.name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                      {t('common.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                      Behörigheter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                      Registrerad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                      Skapad av
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-beige">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-neutral-light">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary-dark">{admin.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-primary-forest">
                          <Mail className="w-4 h-4 mr-2" />
                          {admin.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-primary-forest">
                          {admin.phone ? (
                            <>
                              <Phone className="w-4 h-4 mr-2" />
                              {admin.phone}
                            </>
                          ) : (
                            <span className="text-neutral-gray">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.isActive
                          ? 'bg-accent-teal/20 text-accent-teal'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {admin.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              Aktiv
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 mr-1" />
                              Inaktiv
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {admin.isSuperAdmin ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Super Admin (Alla behörigheter)
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {admin.permissions.length > 0 ? (
                              admin.permissions.map((perm, idx) => {
                                const permLabel = AVAILABLE_PERMISSIONS.find(p => p.value === perm.permission)?.label || perm.permission;
                                return (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                                  >
                                    {permLabel}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-neutral-gray">Inga behörigheter</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-primary-forest">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(admin.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary-forest">
                          {admin.createdBy ? (
                            <div>
                              <div className="font-medium">{admin.createdBy.name}</div>
                              <div className="text-xs text-neutral-gray">{admin.createdBy.email}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-gray">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePasswordChangeClick(admin)}
                            disabled={
                              // Can't change password for super admins (unless you are super admin)
                              (admin.isSuperAdmin && !currentUser?.isSuperAdmin) ||
                              // Non-super admins can only change password for admins they created
                              (!currentUser?.isSuperAdmin && admin.createdBy?.id !== currentUser?.id)
                            }
                            className={`text-sm px-3 py-1 rounded flex items-center ${
                              (admin.isSuperAdmin && !currentUser?.isSuperAdmin) ||
                              (!currentUser?.isSuperAdmin && admin.createdBy?.id !== currentUser?.id)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                              }`}
                            title={
                              admin.isSuperAdmin && !currentUser?.isSuperAdmin
                                ? 'Endast Super Admin kan ändra lösenord för andra Super Admins'
                                : !currentUser?.isSuperAdmin && admin.createdBy?.id !== currentUser?.id
                                    ? 'Du kan bara ändra lösenord för administratörer som du skapat'
                                    : 'Ändra lösenord'
                            }
                          >
                            <Key className="w-3 h-3 mr-1" />
                            Lösenord
                          </button>
                          <button
                            onClick={() => handleEditClick(admin)}
                            disabled={
                              // Can't edit yourself
                              (currentUser?.id === admin.id) ||
                              // Can't edit super admins
                              admin.isSuperAdmin ||
                              // Non-super admins can only edit admins they created
                              (!currentUser?.isSuperAdmin && admin.createdBy?.id !== currentUser?.id)
                            }
                            className={`text-sm px-3 py-1 rounded flex items-center ${(currentUser?.id === admin.id) ||
                              admin.isSuperAdmin ||
                              (!currentUser?.isSuperAdmin && admin.createdBy?.id !== currentUser?.id)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            title={
                              admin.isSuperAdmin
                                ? 'Super Admin kan inte redigeras'
                                : currentUser?.id === admin.id
                                  ? 'Du kan inte redigera ditt eget konto'
                                  : !currentUser?.isSuperAdmin && admin.createdBy?.id !== currentUser?.id
                                    ? 'Du kan bara redigera administratörer som du skapat'
                                    : 'Redigera administratör'
                            }
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Redigera
                          </button>
                          <button
                            onClick={() => handleDeleteClick(admin)}
                            disabled={
                              // Can't delete yourself
                              (currentUser?.id === admin.id) ||
                              // Can't delete super admins
                              admin.isSuperAdmin ||
                              // Non-super admins can only delete admins they created
                              (!currentUser?.isSuperAdmin && admin.createdBy?.id !== currentUser?.id)
                            }
                            className={`text-sm px-3 py-1 rounded ${(currentUser?.id === admin.id) ||
                              admin.isSuperAdmin ||
                              (!currentUser?.isSuperAdmin && admin.createdBy?.id !== currentUser?.id)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            title={
                              admin.isSuperAdmin
                                ? 'Super Admin kan inte tas bort'
                                : currentUser?.id === admin.id
                                  ? 'Du kan inte ta bort ditt eget konto'
                                  : !currentUser?.isSuperAdmin && admin.createdBy?.id !== currentUser?.id
                                    ? 'Du kan bara ta bort administratörer som du skapat'
                                    : 'Ta bort administratör'
                            }
                          >
                            Ta bort
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {admins.length === 0 && (
                <div className="text-center py-8 text-primary-forest">
                  Inga administratörer hittades
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Registration Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-secondary">Registrera ny administratör</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-primary-forest hover:text-primary-dark"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleRegisterAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Namn *
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="form-input"
                    placeholder="Ange fullständigt namn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    E-postadress *
                  </label>
                  <input
                    type="email"
                    required
                    value={registrationData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="form-input"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Lösenord *
                  </label>
                  <input
                    type="password"
                    required
                    value={registrationData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="form-input"
                    placeholder="Minst 8 tecken"
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    value={registrationData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="form-input"
                    placeholder="070-123 45 67"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-primary-dark">
                      Behörigheter *
                    </label>
                    <button
                      type="button"
                      onClick={toggleAllPermissions}
                      className="text-xs text-accent-teal hover:text-accent-teal/80"
                      disabled={availablePermissions.length === 0}
                    >
                      {registrationData.permissions.length === availablePermissions.length
                        ? 'Avmarkera alla'
                        : 'Välj alla'}
                    </button>
                  </div>
                  {currentUser?.isSuperAdmin && (
                    <p className="text-xs text-blue-600 mb-2">
                      Som Super Admin kan du tilldela alla behörigheter
                    </p>
                  )}
                  {availablePermissions.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-light rounded-lg max-h-48 overflow-y-auto">
                        {availablePermissions.map((perm) => (
                          <label
                            key={perm.value}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-white/50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={registrationData.permissions.includes(perm.value)}
                              onChange={() => togglePermission(perm.value)}
                              className="form-checkbox h-4 w-4 text-accent-teal rounded border-neutral-gray focus:ring-accent-teal"
                            />
                            <span className="text-sm text-primary-dark">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                      {registrationData.permissions.length === 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          Välj minst en behörighet
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Du har inga behörigheter att delegera. Endast Super Admin kan skapa administratörer.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                    disabled={registrationLoading}
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={registrationLoading || availablePermissions.length === 0}
                  >
                    {registrationLoading ? 'Registrerar...' : 'Registrera'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingAdmin && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => {
              setShowEditModal(false);
              setEditingAdmin(null);
              setError(null);
            }}
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-secondary">Redigera administratör</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAdmin(null);
                    setError(null);
                  }}
                  className="text-primary-forest hover:text-primary-dark"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Namn *
                  </label>
                  <input
                    type="text"
                    required
                    value={updateData.name}
                    onChange={(e) => handleUpdateInputChange('name', e.target.value)}
                    className="form-input"
                    placeholder="Ange fullständigt namn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    E-postadress *
                  </label>
                  <input
                    type="email"
                    required
                    value={updateData.email}
                    onChange={(e) => handleUpdateInputChange('email', e.target.value)}
                    className="form-input"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    value={updateData.phone}
                    onChange={(e) => handleUpdateInputChange('phone', e.target.value)}
                    className="form-input"
                    placeholder="070-123 45 67"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-primary-dark">
                      Behörigheter *
                    </label>
                    <button
                      type="button"
                      onClick={toggleAllUpdatePermissions}
                      className="text-xs text-accent-teal hover:text-accent-teal/80"
                      disabled={availablePermissions.length === 0}
                    >
                      {updateData.permissions.length === availablePermissions.length
                        ? 'Avmarkera alla'
                        : 'Välj alla'}
                    </button>
                  </div>
                  {currentUser?.isSuperAdmin && (
                    <p className="text-xs text-blue-600 mb-2">
                      Som Super Admin kan du tilldela alla behörigheter
                    </p>
                  )}
                  {availablePermissions.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-light rounded-lg max-h-48 overflow-y-auto">
                        {availablePermissions.map((perm) => (
                          <label
                            key={perm.value}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-white/50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={updateData.permissions.includes(perm.value)}
                              onChange={() => toggleUpdatePermission(perm.value)}
                              className="form-checkbox h-4 w-4 text-accent-teal rounded border-neutral-gray focus:ring-accent-teal"
                            />
                            <span className="text-sm text-primary-dark">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                      {updateData.permissions.length === 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          Välj minst en behörighet
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Du har inga behörigheter att delegera.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingAdmin(null);
                      setError(null);
                    }}
                    className="btn-secondary flex-1"
                    disabled={updateLoading}
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={updateLoading || availablePermissions.length === 0}
                  >
                    {updateLoading ? 'Uppdaterar...' : 'Uppdatera'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && adminToChangePassword && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => {
              setShowPasswordModal(false);
              setAdminToChangePassword(null);
              setNewPassword('');
            }}
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 rounded-full mb-4">
                <Key className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-center text-primary-dark mb-2">
                Ändra lösenord
              </h3>
              <p className="text-center text-primary-forest mb-4">
                Ändra lösenord för <strong>{adminToChangePassword.name}</strong>
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
                    setAdminToChangePassword(null);
                    setNewPassword('');
                  }}
                  disabled={changingPassword}
                  className="btn-secondary flex-1"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || newPassword.length < 6}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changingPassword ? 'Ändrar...' : 'Ändra lösenord'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Ta bort administratör"
          message={`Är du säker på att du vill ta bort administratören "${adminToDelete?.name}"?\n\nDetta går inte att ångra.${deleteError ? `\n\nFel: ${deleteError}` : ''}`}
          confirmText="Ta bort"
          cancelText="Avbryt"
          isLoading={deletingAdminId === adminToDelete?.id}
          variant="danger"
        />
      </div>
    </AdminLayout>
  );
};

export default withAuth(AdminSettings, { allowedRoles: ['ADMIN'] });