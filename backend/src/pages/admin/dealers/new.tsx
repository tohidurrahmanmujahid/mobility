import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/Layout';
import { apiPost, apiGet } from '@/utils/api';
import { withAuth } from '@/components/withAuth';

interface OwnerData {
  id: string | null;
  idnr: string | null;
  status: string | null;
  name: string | null;
  givenName: string | null;
  address: string | null;
  co: string | null;
  postCode: string | null;
  city: string | null;
  sni: string[] | null;
  municipality: string | null;
  municipalityCode: string | null;
  county: string | null;
  countyCode: string | null;
  phone: Array<{
    number: string | null;
    type: 'Landline' | 'Mobile';
    nix: boolean | null;
    nixDate: string | null;
  }> | null;
  nix: boolean | null;
  nixDate: string | null;
  protected: boolean | null;
  legalForm: string | null;
}

const NewDealerPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    orgNumber: '',
    contactPerson: '',
    address: '',
    postalCode: '',
    city: '',
    county: '',
    contactPhone: '',
    contactEmail: '',
    contactName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  const [ownerFound, setOwnerFound] = useState<boolean | null>(null);

  // Fetch owner data when organization number is 10 digits
  useEffect(() => {
    const fetchOwnerData = async () => {
      const orgNumber = formData.orgNumber.replace(/[^0-9]/g, '');

      // Reset owner found state if org number is not 10 digits
      if (orgNumber.length !== 10) {
        setOwnerFound(null);
        return;
      }

      if (orgNumber.length === 10) {
        setLoadingOwner(true);
        setError(null);

        try {
          const response = await apiGet(`/api/v1/owner/${orgNumber}`);

          if (!response.ok) {
            if (response.status === 404) {
              console.log('Owner not found in database or biluppgifter');
              setOwnerFound(false);
              setError('Företaget kunde inte hittas. Kontrollera organisationsnumret.');
              setLoadingOwner(false);
              return;
            }
            throw new Error('Failed to fetch owner data');
          }

          const ownerData: OwnerData = await response.json();

          // Mark owner as found
          setOwnerFound(true);

          // Auto-fill form with owner data
          setFormData(prev => ({
            ...prev,
            companyName: ownerData.name || prev.companyName,
            address: ownerData.address || prev.address,
            postalCode: ownerData.postCode || prev.postalCode,
            city: ownerData.city || prev.city,
            county: ownerData.county || prev.county,
            contactPhone: ownerData.phone?.[0]?.number || prev.contactPhone
          }));

        } catch (err) {
          console.error('Error fetching owner data:', err);
          setOwnerFound(false);
          setError('Kunde inte hämta företagsuppgifter. Försök igen eller fyll i manuellt.');
        } finally {
          setLoadingOwner(false);
        }
      }
    };

    fetchOwnerData();
  }, [formData.orgNumber]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    console.log(formData)
    // Validation
    if (!formData.companyName || !formData.orgNumber) {
      setError('Återförsäljare, organisationsnummer, kontaktpersonens namn och e-post är obligatoriska');
      setSubmitting(false);
      return;
    }

    // Check if owner was found
    if (ownerFound === false) {
      setError('Företaget kunde inte hittas. Kontrollera organisationsnumret och försök igen.');
      setSubmitting(false);
      return;
    }

    if (ownerFound === null) {
      setError('Vänligen vänta medan företagsinformation hämtas.');
      setSubmitting(false);
      return;
    }

    // Validate email
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(formData.contactEmail)) {
    //   setError('Vänligen ange en giltig e-postadress');
    //   setSubmitting(false);
    //   return;
    // }

    // Validate org number (Swedish format)
    // const orgNumberRegex = /^\d{6}-\d{4}$|^\d{10}$/;
    // if (!orgNumberRegex.test(formData.orgNumber)) {
    //   setError('Organisationsnummer måste vara i formatet XXXXXX-XXXX eller 10 siffror');
    //   setSubmitting(false);
    //   return;
    // }

    try {
      const response = await apiPost('/api/admin/dealers/create', formData);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create dealer');
      }

      setSuccess(
        `Återförsäljare skapad framgångsrikt med status "Inkommen"! Du kan skicka inloggningsuppgifter manuellt från återförsäljarlistan när samarbetsavtalet är klart.`
      );

      // Clear form
      setFormData({
        companyName: '',
        orgNumber: '',
        contactPerson: '',
        address: '',
        postalCode: '',
        city: '',
        county: '',
        contactPhone: '',
        contactEmail: '',
        contactName: ''
      });

      // Reset owner found state
      setOwnerFound(null);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/admin/dealers');
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="heading-primary">Ny återförsäljare</h1>
          <p className="body-text mt-2">Registrera ett nytt återförsäljarsamarbete</p>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert-success">
            {success}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="card-body space-y-6">
              {/* Company Information */}
              <div>
                <h2 className="heading-secondary mb-4">Företagsinformation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="form-group">
                    <label htmlFor="orgNumber" className="form-label">
                      Organisationsnummer (Organization number) *
                    </label>
                    <input
                      type="text"
                      id="orgNumber"
                      name="orgNumber"
                      value={formData.orgNumber}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="XXXXXX-XXXX"
                      required
                      disabled={submitting}
                    />
                    {loadingOwner && (
                      <p className="text-xs text-blue-600 mt-1">
                        Hämtar företagsinformation...
                      </p>
                    )}
                    {ownerFound === true && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Företaget hittades och uppgifter har fyllts i automatiskt
                      </p>
                    )}
                    {ownerFound === false && (
                      <p className="text-xs text-red-600 mt-1">
                        ✗ Företaget kunde inte hittas. Kontrollera organisationsnumret.
                      </p>
                    )}
                    {ownerFound === null && !loadingOwner && (
                      <p className="text-xs text-primary-forest mt-1">
                        Format: XXXXXX-XXXX eller 10 siffror
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactPerson" className="form-label">
                      Kontaktperson (Contact person)
                    </label>
                    <input
                      type="text"
                      id="contactPerson"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label htmlFor="companyName" className="form-label">
                      Återförsäljare (Reseller) *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label htmlFor="address" className="form-label">
                      Adress (Address)
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="postalCode" className="form-label">
                      Postnummer (Postal code)
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="123 45"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city" className="form-label">
                      Ort (City)
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group md:col-span-2">
                    <label htmlFor="county" className="form-label">
                      Län (County)
                    </label>
                    <input
                      type="text"
                      id="county"
                      name="county"
                      value={formData.county}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="heading-secondary mb-4">Kontaktuppgifter för administratör</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="contactName" className="form-label">
                      Kontaktperson namn *
                    </label>
                    <input
                      type="text"
                      id="contactName"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contactPhone" className="form-label">
                      Telefonnummer (Phone number)
                    </label>
                    <input
                      type="tel"
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group md:col-span-2">
                    <label htmlFor="contactEmail" className="form-label">
                      E-postadress (Email address) *
                    </label>
                    <input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      disabled={submitting}
                    />
                    <p className="text-xs text-primary-forest mt-1">
                      Inloggningsuppgifter kan skickas manuellt till denna e-postadress efter att återförsäljaren skapats
                    </p>
                  </div>
                </div>
              </div>

              {/* Information Box */}
              {/* <div className="alert-info">
                <h3 className="font-underrubriker font-medium mb-2">Vad händer efter registrering?</h3>
                <ul className="text-sm space-y-1">
                  <li>• Ett automatiskt e-postmeddelande skickas till kontaktpersonen</li>
                  <li>• E-postmeddelandet innehåller användarnamn och lösenord</li>
                  <li>• Återförsäljaren kan logga in direkt och börja registrera garantier</li>
                  <li>• Du kan lägga till kommentarer och övervaka aktivitet från admin-panelen</li>
                </ul>
              </div> */}
            </div>

            <div className="card-footer">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/dealers')}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || ownerFound === false || loadingOwner}
                >
                  {submitting ? 'Skapar återförsäljare...' : loadingOwner ? 'Hämtar företagsinformation...' : 'Skapa återförsäljare'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAuth(NewDealerPage, { allowedRoles: ['ADMIN'] });