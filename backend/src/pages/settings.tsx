import React, { useEffect, useState } from 'react';
import DealerLayout from '@/components/dealer/Layout';
import { apiGet, apiPost, apiDelete } from '@/utils/api';
import { withAuth } from '@/components/withAuth';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  dealer: {
    id: number;
    companyName: string;
    orgNumber: string;
    address?: string;
    contactPerson?: string;
  };
}

interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {

    fetchStaffUsers();
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await apiGet('/api/dealer/auth/me');
      if (!response.ok) throw new Error('Failed to fetch user data');

      const data = await response.json();
      setUser(data);
      setFormData({
        name: data.name,
        email: data.email
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffUsers = async () => {
    try {
      console.log({ user })
      if (user?.role !== 'DEALER') return; // Only dealers can manage staff
      const response = await apiGet('/api/dealer/staff');
      if (!response.ok) throw new Error('Failed to fetch staff users');

      const data = await response.json();
      setStaffUsers(data.staff);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await apiPost('/api/auth/update-profile', formData);
      if (!response.ok) throw new Error('Failed to update profile');

      setSuccess('Profil uppdaterad!');
      await fetchUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken långt');
      return;
    }

    try {
      const response = await apiPost('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update password');
      }

      setSuccess('Lösenord uppdaterat!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newStaffData.password.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken långt');
      return;
    }

    try {
      const response = await apiPost('/api/dealer/staff', newStaffData);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create staff user');
      }

      setSuccess('Ny användare skapad!');
      setShowAddStaffModal(false);
      setNewStaffData({
        name: '',
        email: '',
        phone: '',
        password: ''
      });
      await fetchStaffUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await apiDelete(`/api/dealer/staff/${staffId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete staff user');
      }

      setSuccess('Användare borttagen!');
      setDeleteConfirmId(null);
      await fetchStaffUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <DealerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-primary-dark">Laddar...</div>
        </div>
      </DealerLayout>
    );
  }

  return (
    <DealerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="heading-primary">Inställningar</h1>
          <p className="body-text mt-2">Hantera dina kontoinställningar och återförsäljare information</p>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Dealer Information */}
        {user?.dealer && (
          <div className="card">
            <div className="card-header">
              <h2 className="heading-secondary">Återförsäljare Information</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Företagsnamn</label>
                  <div className="form-input bg-gray-50">{user.dealer.companyName}</div>
                </div>
                <div>
                  <label className="form-label">Organisationsnummer</label>
                  <div className="form-input bg-gray-50">{user.dealer.orgNumber}</div>
                </div>
                {user.dealer.address && (
                  <div>
                    <label className="form-label">Adress</label>
                    <div className="form-input bg-gray-50">{user.dealer.address}</div>
                  </div>
                )}
                {user.dealer.contactPerson && (
                  <div>
                    <label className="form-label">Kontaktperson</label>
                    <div className="form-input bg-gray-50">{user.dealer.contactPerson}</div>
                  </div>
                )}
              </div>
              <div className="mt-4 text-sm text-primary-forest">
                Kontakta administratören för att uppdatera återförsäljare information
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-secondary">Min Profil</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Namn</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-post</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                  Spara ändringar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Staff Management - Only show for DEALER role */}
        {user?.role === 'DEALER' && (
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h2 className="heading-secondary">Användare</h2>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="btn-primary text-sm"
              >
                + Lägg till användare
              </button>
            </div>
            <div className="card-body">
              {staffUsers.length === 0 ? (
                <p className="text-primary-forest">Inga användare än. Lägg till din första användare för att komma igång.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-beige">
                    <thead className="bg-neutral-light">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                          Namn
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                          E-post
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                          Telefon
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                          Skapad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-primary-forest uppercase tracking-wider">
                          Åtgärder
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-beige">
                      {staffUsers.map((staff) => (
                        <tr key={staff.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-primary-dark">{staff.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-primary-forest">{staff.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-primary-forest">{staff.phone || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-primary-forest">
                              {new Date(staff.createdAt).toLocaleDateString('sv-SE')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {deleteConfirmId === staff.id ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-red-600 mr-2">Radera?</span>
                                <button
                                  onClick={() => handleDeleteStaff(staff.id)}
                                  className="text-red-600 hover:text-red-800 font-medium"
                                >
                                  Ja
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-primary-forest hover:text-primary-dark font-medium"
                                >
                                  Nej
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(staff.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Radera
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Change Password */}
        <div className="card">
          <div className="card-header">
            <h2 className="heading-secondary">Ändra Lösenord</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nuvarande Lösenord</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Nytt Lösenord</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="form-input"
                    required
                    minLength={8}
                  />
                  <p className="text-sm text-primary-forest mt-1">Minst 8 tecken</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Bekräfta Nytt Lösenord</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="form-input"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="btn-primary">
                  Uppdatera Lösenord
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Add Staff Modal */}
        {showAddStaffModal && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddStaffModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="heading-secondary">Lägg till användare</h3>
                <button
                  onClick={() => {
                    setShowAddStaffModal(false);
                    setNewStaffData({ name: '', email: '', phone: '', password: '' });
                  }}
                  className="text-primary-forest hover:text-primary-dark"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Namn *</label>
                  <input
                    type="text"
                    value={newStaffData.name}
                    onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">E-post *</label>
                  <input
                    type="email"
                    value={newStaffData.email}
                    onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    value={newStaffData.phone}
                    onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lösenord *</label>
                  <input
                    type="password"
                    value={newStaffData.password}
                    onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                    className="form-input"
                    required
                    minLength={8}
                  />
                  <p className="text-sm text-primary-forest mt-1">Minst 8 tecken</p>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStaffModal(false);
                      setNewStaffData({ name: '', email: '', phone: '', password: '' });
                    }}
                    className="btn-secondary"
                  >
                    Avbryt
                  </button>
                  <button type="submit" className="btn-primary">
                    Skapa användare
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DealerLayout>
  );
};

export default withAuth(SettingsPage, { allowedRoles: ['DEALER', 'DEALER_STAFF'] });
