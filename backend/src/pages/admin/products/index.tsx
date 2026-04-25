import React, { useEffect, useState } from 'react';
import { Edit, Power, Trash2, Globe } from 'lucide-react';
import AdminLayout from '@/components/admin/Layout';
import ConfirmModal from '@/components/ConfirmModal';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/utils/api';
import { withAuth } from '@/components/withAuth';

interface Product {
  id: number;
  name: string;
  description?: string;
  premium: number;
  insuranceAmount: number;
  durationMonths: number;
  vehicleType: string;
  maxAge: number;
  maxKm: number;
  maxHk: number;
  pdfUrl?: string;
  priority: number;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  _count?: {
    warranties: number;
  };
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  isSuperAdmin: boolean;
  permissions: { permission: string }[];
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    premium: '',
    insuranceAmount: '',
    durationMonths: '',
    vehicleType: '',
    maxAge: '',
    maxKm: '',
    maxHk: '',
    priority: '1',
    isPublished: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [togglingProductId, setTogglingProductId] = useState<number | null>(null);
  const [togglingPublishId, setTogglingPublishId] = useState<number | null>(null);
  const [updatingPriorityId, setUpdatingPriorityId] = useState<number | null>(null);

  // Priority options based on total number of products (1 to n)
  const priorityOptions = Array.from({ length: products.length }, (_, i) => i + 1);

  const vehicleTypes = [
    'Personbil',
    'Lastbil',
    'Motorcykel',
    'Husbil',
    'Släpvagn'
  ];

  useEffect(() => {
    fetchProducts();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await apiGet('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiGet('/api/admin/products');
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      premium: '',
      insuranceAmount: '',
      durationMonths: '',
      vehicleType: '',
      maxAge: '',
      maxKm: '',
      maxHk: '',
      priority: String(products.length + 1),
      isPublished: false
    });
    setSelectedFile(null);
    setEditingProduct(null);
  };

  const handleNewProduct = () => {
    // Set priority to next available (last position)
    setFormData({
      name: '',
      description: '',
      premium: '',
      insuranceAmount: '',
      durationMonths: '',
      vehicleType: '',
      maxAge: '',
      maxKm: '',
      maxHk: '',
      priority: String(products.length + 1),
      isPublished: false
    });
    setSelectedFile(null);
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      premium: product.premium.toString(),
      insuranceAmount: (product.insuranceAmount || 0).toString(),
      durationMonths: product.durationMonths.toString(),
      vehicleType: product.vehicleType,
      maxAge: product.maxAge.toString(),
      maxKm: product.maxKm.toString(),
      maxHk: product.maxHk.toString(),
      priority: (product.priority || 0).toString(),
      isPublished: product.isPublished
    });
    setSelectedFile(null);
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validation
    if (!formData.name || !formData.premium || !formData.durationMonths || !formData.vehicleType ||
      !formData.maxAge || !formData.maxKm || !formData.maxHk) {
      alert('Vänligen fyll i alla obligatoriska fält');
      setSubmitting(false);
      return;
    }

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      formDataToSend.append('premium', formData.premium);
      formDataToSend.append('insuranceAmount', formData.insuranceAmount || '0');
      formDataToSend.append('durationMonths', formData.durationMonths);
      formDataToSend.append('vehicleType', formData.vehicleType);
      formDataToSend.append('maxAge', formData.maxAge);
      formDataToSend.append('maxKm', formData.maxKm);
      formDataToSend.append('maxHk', formData.maxHk);
      formDataToSend.append('priority', formData.priority || '1');

      if (selectedFile) {
        formDataToSend.append('pdfFile', selectedFile);
      }

      const response = editingProduct
        ? await apiPut(url, formDataToSend)
        : await apiPost(url, formDataToSend);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save product');
      }

      await fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setDeletingProductId(productToDelete.id);
    setDeleteError(null);

    try {
      const response = await apiDelete(`/api/admin/products/${productToDelete.id}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete product');
      }

      // Refresh products list
      await fetchProducts();

      // Close modal
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      setDeleteError(err instanceof Error ? err.message : 'Kunde inte ta bort produkt');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
    setDeleteError(null);
  };

  const handleToggleActive = async (product: Product) => {
    if (togglingProductId) return; // Prevent multiple simultaneous toggles

    setTogglingProductId(product.id);

    try {
      const response = await apiPatch(`/api/admin/products/${product.id}`, { isActive: !product.isActive });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to toggle product status');
      }

      // Refresh products list
      await fetchProducts();
    } catch (err) {
      console.error('Error toggling product status:', err);
      alert(err instanceof Error ? err.message : 'Kunde inte ändra produktstatus');
    } finally {
      setTogglingProductId(null);
    }
  };

  const handleTogglePublish = async (product: Product) => {
    if (togglingPublishId) return; // Prevent multiple simultaneous toggles

    setTogglingPublishId(product.id);

    try {
      const response = await apiPatch(`/api/admin/products/${product.id}`, { isPublished: !product.isPublished });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to toggle publish status');
      }

      // Refresh products list
      await fetchProducts();
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert(err instanceof Error ? err.message : 'Kunde inte ändra publiceringsstatus');
    } finally {
      setTogglingPublishId(null);
    }
  };

  const handlePriorityChange = async (product: Product, newPriority: number) => {
    if (updatingPriorityId) return; // Prevent multiple simultaneous updates

    setUpdatingPriorityId(product.id);

    try {
      const response = await apiPatch(`/api/admin/products/${product.id}`, { priority: newPriority });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update priority');
      }

      // Update local state immediately for better UX
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, priority: newPriority } : p
        ).sort((a, b) => (a.priority || 0) - (b.priority || 0))
      );
    } catch (err) {
      console.error('Error updating priority:', err);
      alert(err instanceof Error ? err.message : 'Kunde inte ändra prioritet');
    } finally {
      setUpdatingPriorityId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE');
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="heading-primary">Produkter</h1>
            <p className="body-text mt-2">Hantera garantiprodukter och deras regler</p>
          </div>
          <button
            onClick={handleNewProduct}
            className="btn-primary"
          >
            + Ny produkt
          </button>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {/* Products Table */}
        <div className="card">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-beige">
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Produktnamn</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Prioritet</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Status</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Publicerad</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Premie</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Löptid</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Fordonstyp</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Maxålder</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Max km</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Max hk</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">PDF</th>
                    <th className="text-left p-4 font-underrubriker font-medium text-primary-forest">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className={`border-b border-neutral-beige hover:bg-neutral-beige/30 ${!product.isActive ? 'opacity-60' : ''}`}>
                      <td className="p-4">
                        <p className="font-underrubriker font-medium text-primary-dark">{product.name}</p>
                      </td>
                      <td className="p-4">
                        <select
                          value={product.priority || 1}
                          onChange={(e) => handlePriorityChange(product, parseInt(e.target.value))}
                          disabled={updatingPriorityId === product.id}
                          className="form-input py-1 px-2 text-sm w-16"
                        >
                          {priorityOptions.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {product.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${product.isPublished
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                          }`}>
                          {product.isPublished ? 'Ja' : 'Nej'}
                        </span>
                      </td>
                      <td className="p-4 text-primary-dark">
                        <div>{product.premium.toLocaleString()} kr</div>
                        {product.insuranceAmount > 0 && (
                          <div className="text-xs text-primary-forest">Försäkring: {product.insuranceAmount.toLocaleString()} kr</div>
                        )}
                      </td>
                      <td className="p-4 text-primary-dark">{product.durationMonths} månader</td>
                      <td className="p-4 text-primary-dark">
                        <span className="inline-block bg-neutral-beige px-2 py-1 rounded text-xs">
                          {product.vehicleType}
                        </span>
                      </td>
                      <td className="p-4 text-primary-dark">{product.maxAge} år</td>
                      <td className="p-4 text-primary-dark">{product.maxKm.toLocaleString()} km</td>
                      <td className="p-4 text-primary-dark">{product.maxHk} hk</td>
                      <td className="p-4">
                        {product.pdfUrl ? (
                          <a
                            href={product.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-teal hover:text-accent-teal/80 text-sm"
                          >
                            📄 Visa PDF
                          </a>
                        ) : (
                          <span className="text-primary-forest text-sm">Ingen PDF</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Redigera produkt"
                            aria-label="Redigera produkt"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(product)}
                            disabled={togglingProductId === product.id}
                            className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${product.isActive
                              ? 'text-orange-600 hover:text-orange-800'
                              : 'text-green-600 hover:text-green-800'
                              }`}
                            title={product.isActive ? 'Inaktivera produkt' : 'Aktivera produkt'}
                            aria-label={product.isActive ? 'Inaktivera produkt' : 'Aktivera produkt'}
                          >
                            <Power className={`w-5 h-5 ${togglingProductId === product.id ? 'animate-pulse' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleTogglePublish(product)}
                            disabled={togglingPublishId === product.id}
                            className={`transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${product.isPublished
                              ? 'text-blue-600 hover:text-blue-800'
                              : 'text-gray-400 hover:text-gray-600'
                              }`}
                            title={product.isPublished ? 'Avpublicera produkt' : 'Publicera produkt'}
                            aria-label={product.isPublished ? 'Avpublicera produkt' : 'Publicera produkt'}
                          >
                            <Globe className={`w-5 h-5 ${togglingPublishId === product.id ? 'animate-pulse' : ''}`} />
                          </button>
                          {user?.isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteClick(product)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Ta bort produkt"
                              aria-label="Ta bort produkt"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-primary-forest mb-4">Inga produkter skapade ännu</div>
            <button
              onClick={handleNewProduct}
              className="btn-primary"
            >
              Skapa första produkten
            </button>
          </div>
        )}

        {/* Product Modal */}
        {showModal && (
          <div className="fixed inset-0  bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => {
            setShowModal(false);
            resetForm();
          }}>
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  <h3 className="heading-secondary mb-6">
                    {editingProduct ? 'Redigera produkt' : 'Ny produkt'}
                  </h3>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="form-group">
                      <label className="form-label">Produktnamn *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-input"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Beskrivning</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="form-input"
                        rows={3}
                        disabled={submitting}
                        placeholder="Valfri beskrivning av produkten..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="form-group">
                        <label className="form-label">Totalpris (kr) *</label>
                        <input
                          type="number"
                          name="premium"
                          value={formData.premium}
                          onChange={handleInputChange}
                          className="form-input"
                          min="0"
                          step="0.01"
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Försäkring (kr)</label>
                        <input
                          type="number"
                          name="insuranceAmount"
                          value={formData.insuranceAmount}
                          onChange={handleInputChange}
                          className="form-input"
                          min="0"
                          step="0.01"
                          disabled={submitting}
                          placeholder="Konto 3004, moms 0%"
                        />
                        {formData.premium && formData.insuranceAmount && (
                          <p className="text-xs text-primary-forest mt-1">
                            Garanti: {(parseFloat(formData.premium) - parseFloat(formData.insuranceAmount || '0')).toLocaleString()} kr (konto 3001, moms 25%)
                          </p>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Löptid (månader) *</label>
                        <input
                          type="number"
                          name="durationMonths"
                          value={formData.durationMonths}
                          onChange={handleInputChange}
                          className="form-input"
                          min="1"
                          max="120"
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fordonstyp *</label>
                        <select
                          name="vehicleType"
                          value={formData.vehicleType}
                          onChange={handleInputChange}
                          className="form-input"
                          required
                          disabled={submitting}
                        >
                          <option value="">Välj fordonstyp</option>
                          {vehicleTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">PDF-dokument</label>
                      <input
                        type="file"
                        accept=".pdf"
                        className="form-input"
                        disabled={submitting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setSelectedFile(file || null);
                        }}
                      />
                      {selectedFile && (
                        <p className="text-sm text-primary-forest mt-1">
                          Vald fil: {selectedFile.name}
                        </p>
                      )}
                      {editingProduct && editingProduct.pdfUrl && !selectedFile && (
                        <p className="text-sm text-accent-teal mt-1">
                          Nuvarande fil: <a href={editingProduct.pdfUrl} target="_blank" rel="noopener noreferrer" className="underline">Visa PDF</a>
                        </p>
                      )}
                    </div>

                    {/* Limits */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="form-group">
                        <label className="form-label">Maxålder (år) *</label>
                        <input
                          type="number"
                          name="maxAge"
                          value={formData.maxAge}
                          onChange={handleInputChange}
                          className="form-input"
                          min="0"
                          max="30"
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Max km *</label>
                        <input
                          type="number"
                          name="maxKm"
                          value={formData.maxKm}
                          onChange={handleInputChange}
                          className="form-input"
                          min="0"
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Max hk *</label>
                        <input
                          type="number"
                          name="maxHk"
                          value={formData.maxHk}
                          onChange={handleInputChange}
                          className="form-input"
                          min="0"
                          required
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="form-group">
                    <label className="form-label">Prioritet (sortering)</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={submitting}
                    >
                      {Array.from({ length: editingProduct ? products.length : products.length + 1 }, (_, i) => i + 1).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">Lägre nummer visas först (1 = högsta prioritet).</p>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="btn-secondary"
                      disabled={submitting}
                    >
                      Avbryt
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Sparar...' : (editingProduct ? 'Uppdatera' : 'Skapa produkt')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Ta bort produkt"
          message={`Är du säker på att du vill ta bort produkten "${productToDelete?.name}"?\n\nProdukten kommer att döljas från systemet men behållas i databasen för att bevara dataintegriteten med befintliga garantier.${deleteError ? `\n\nFel: ${deleteError}` : ''}`}
          confirmText="Ta bort"
          cancelText="Avbryt"
          isLoading={deletingProductId === productToDelete?.id}
          variant="danger"
        />
      </div>
    </AdminLayout>
  );
};

export default withAuth(ProductsPage, { allowedRoles: ['ADMIN'] });