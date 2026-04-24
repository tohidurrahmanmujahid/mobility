import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiGet, apiPost } from '@/utils/api';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealerId?: number;
}

interface VehicleData {
  registrationNumber: string;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  vin: string;
  fuelType?: string;
  engineSize?: string;
  color?: string;
  powerHp?: number;
  owner?: {
    name: string;
    email: string;
    phone: string;
    personnummer: string;
  };
}

interface Product {
  id: number;
  name: string;
  durationMonths: number;
  description?: string;
  pdfUrl?: string;
  maxAge?: number;
  maxKm?: number;
  maxHk?: number;
}

interface OwnerData {
  personnummer: string;
  firstname: string;
  lastname: string;
  address: string;
  postnummer: string;
  ort: string;
  email: string;
  phone: string;
  // Keep name for backwards compatibility (will be computed from firstname + lastname)
  name: string;
}

interface RegistrationData {
  vehicle: VehicleData | null;
  selectedProduct: Product | null;
  owner: OwnerData;
}

const WarrantyRegistrationModal: React.FC<ModalProps> = ({ isOpen, onClose, dealerId }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    vehicle: null,
    selectedProduct: null,
    owner: {
      personnummer: '',
      firstname: '',
      lastname: '',
      address: '',
      postnummer: '',
      ort: '',
      email: '',
      phone: '',
      name: ''
    }
  });

  const steps = [
    { number: 1, title: t('warranty.vehicle'), description: t('warranty.vehicle.subtitle') },
    { number: 2, title: t('warranty.product'), description: t('warranty.product.title') },
    { number: 3, title: t('warranty.owner'), description: t('warranty.owner.title') },
    { number: 4, title: t('warranty.summary'), description: t('warranty.summary.subtitle') }
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setCurrentStep(1);
      setRegistrationData({
        vehicle: null,
        selectedProduct: null,
        owner: {
          personnummer: '',
          firstname: '',
          lastname: '',
          address: '',
          postnummer: '',
          ort: '',
          email: '',
          phone: '',
          name: ''
        }
      });
      setError(null);
    }
  }, [isOpen]);

  const nextStep = async () => {
    // Proceed to next step if validation passes
    if (currentStep < 4 && canProceedFromStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Only allow proceeding if vehicle data is loaded
        return !!registrationData.vehicle;
      case 2:
        // Require product selection to proceed
        return !!registrationData.selectedProduct;
      case 3:
        return !!(
          registrationData.owner.personnummer &&
          registrationData.owner.firstname &&
          registrationData.owner.lastname &&
          registrationData.owner.email &&
          registrationData.owner.phone
        );
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
          <div className="fixed inset-0 transition-opacity bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <div className="relative w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border-0 overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-primary-forest to-primary-forest/80 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white font-rubriker font-rubriker">
                      {t('warranty.register')}
                    </h2>
                    <p className="text-white/80 text-sm font-underrubriker">
                      {t('warranty.step')} {currentStep} {t('warranty.of')} {steps.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:text-white/80 transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${currentStep >= step.number
                        ? 'bg-primary-forest text-white shadow-md'
                        : 'bg-gray-200 text-gray-500'
                        }`}>
                        {currentStep > step.number ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-xs font-bold">{step.number}</span>
                        )}
                      </div>
                      <div className="ml-3 text-left hidden md:block">
                        <p className={`font-medium text-sm transition-colors ${currentStep >= step.number ? 'text-primary-forest' : 'text-gray-500'
                          }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 mx-4">
                        <div className={`h-0.5 rounded-full transition-all duration-300 ${currentStep > step.number ? 'bg-primary-forest' : 'bg-gray-200'
                          }`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 font-medium font-text-secondary">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="p-6">
              {currentStep === 1 && (
                <VehicleStep
                  registrationData={registrationData}
                  setRegistrationData={setRegistrationData}
                  loading={loading}
                  setLoading={setLoading}
                  setError={setError}
                  dealerId={dealerId}
                />
              )}
              {currentStep === 2 && (
                <ProductStep
                  registrationData={registrationData}
                  setRegistrationData={setRegistrationData}
                  loading={loading}
                  setLoading={setLoading}
                  setError={setError}
                />
              )}
              {currentStep === 3 && (
                <OwnerStep
                  registrationData={registrationData}
                  setRegistrationData={setRegistrationData}
                />
              )}
              {currentStep === 4 && (
                <SummaryStep
                  registrationData={registrationData}
                  loading={loading}
                  setLoading={setLoading}
                  setError={setError}
                  onSuccess={onClose}
                  dealerId={dealerId}
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
              <button
                onClick={previousStep}
                disabled={currentStep === 1}
                className={`px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm ${currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 font-text-primary hover:bg-gray-100 border border-gray-200 hover:border-gray-300 shadow-sm'
                  }`}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {t('common.previous')}
                </div>
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-3 py-2 rounded-md font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 text-sm"
                >
                  {t('common.cancel')}
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={!canProceedFromStep(currentStep) || loading}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm ${!canProceedFromStep(currentStep) || loading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-forest text-white hover:bg-primary-forest/90 shadow-md hover:shadow-lg'
                      }`}
                  >
                    <div className="flex items-center">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('common.loading')}
                        </>
                      ) : (
                        <>
                          {t('common.next')}
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                    </div>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Step 1: Vehicle Registration Lookup
const VehicleStep: React.FC<{
  registrationData: RegistrationData;
  setRegistrationData: (data: RegistrationData) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  dealerId?: number;
}> = ({ registrationData, setRegistrationData, loading, setLoading, setError, dealerId }) => {
  const [regNumber, setRegNumber] = useState('');
  const [mileage, setMileage] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState<VehicleData[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleData[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [lookingUpVehicle, setLookingUpVehicle] = useState(false);
  const [apiLookupAttempted, setApiLookupAttempted] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { t } = useLanguage();

  // Check if user is admin
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await apiGet('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setIsAdmin(userData.role === 'ADMIN');
        }
      } catch (err) {
        console.error('Error checking user role:', err);
      }
    };
    checkUserRole();
  }, []);

  // Handle adjusted values for admin
  const handleAdjustedYearChange = (value: number) => {
    if (registrationData.vehicle) {
      setRegistrationData({
        ...registrationData,
        vehicle: {
          ...registrationData.vehicle,
          year: value
        }
      });
    }
  };

  const handleAdjustedMileageChange = (value: number) => {
    if (registrationData.vehicle) {
      setRegistrationData({
        ...registrationData,
        vehicle: {
          ...registrationData.vehicle,
          mileage: value
        }
      });
    }
  };

  const handleAdjustedPowerHpChange = (value: number) => {
    if (registrationData.vehicle) {
      setRegistrationData({
        ...registrationData,
        vehicle: {
          ...registrationData.vehicle,
          powerHp: value
        }
      });
    }
  };

  // Fetch dealer's vehicles on mount
  useEffect(() => {
    const fetchDealerVehicles = async () => {
      setLoadingVehicles(true);
      try {
        const url = dealerId
          ? `/api/warranties/dealer-vehicles?dealerId=${dealerId}`
          : '/api/warranties/dealer-vehicles';
        const response = await apiGet(url);
        const data = await response.json();

        if (response.ok) {
          setAvailableVehicles(data.vehicles || []);
          setFilteredVehicles(data.vehicles || []);
        } else {
          console.error('Failed to fetch dealer vehicles:', data.message);
        }
      } catch (error) {
        console.error('Error fetching dealer vehicles:', error);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchDealerVehicles();
  }, [dealerId]);

  // Reset API lookup attempt when regNumber changes
  useEffect(() => {
    if (regNumber.trim().toUpperCase() !== apiLookupAttempted) {
      setApiLookupAttempted(null);
    }
  }, [regNumber, apiLookupAttempted]);

  // Filter vehicles based on input
  useEffect(() => {
    if (regNumber.trim() === '') {
      setFilteredVehicles(availableVehicles);
    } else {
      const filtered = availableVehicles.filter(v =>
        v.registrationNumber.toLowerCase().includes(regNumber.toLowerCase()) ||
        `${v.make} ${v.model}`.toLowerCase().includes(regNumber.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [regNumber, availableVehicles]);

  // Auto-lookup vehicle from API when not found in dealer's vehicles
  useEffect(() => {
    // Debounce timer
    const timer = setTimeout(async () => {
      const trimmedRegNo = regNumber.trim().toUpperCase();

      // Skip if:
      // - No registration number entered
      // - Registration number is too short (less than 5 characters for Swedish reg numbers)
      // - We already attempted lookup for this exact reg number
      // - Vehicle already found in available vehicles (exact match)
      // - Currently loading
      if (!trimmedRegNo ||
        trimmedRegNo.length < 5 ||
        apiLookupAttempted === trimmedRegNo ||
        availableVehicles.some(v => v.registrationNumber.toUpperCase() === trimmedRegNo) ||
        lookingUpVehicle ||
        loadingVehicles) {
        return;
      }

      // Attempt to lookup from API
      setLookingUpVehicle(true);
      setApiLookupAttempted(trimmedRegNo);

      try {
        // We need a mileage for the API call, but for auto-lookup we can use a temporary value
        // The user will provide the actual mileage later

        const response = await apiGet(
          `/api/warranties/vehicle-search?registrationNumber=${encodeURIComponent(trimmedRegNo)}&dealerId=${dealerId}`
        );

        if (response.ok) {
          const data = await response.json();

          // Add the vehicle to availableVehicles if found
          if (data.vehicle) {
            const newVehicle: VehicleData = {
              registrationNumber: data.vehicle.registrationNumber,
              make: data.vehicle.make,
              model: data.vehicle.model,
              year: data.vehicle.year,
              vin: data.vehicle.vin,
              fuelType: data.vehicle.fuelType,
              color: data.vehicle.color
            };

            // Add to available vehicles (avoid duplicates)
            setAvailableVehicles(prev => {
              const exists = prev.some(v => v.registrationNumber === newVehicle.registrationNumber);
              if (exists) return prev;
              return [...prev, newVehicle];
            });

            // Clear any previous errors
            setError(null);
          }
        } else if (response.status === 404) {
          // Vehicle not found in API - this is not an error, just means it doesn't exist
          console.log(`Vehicle ${trimmedRegNo} not found in API`);
        } else {
          // Other errors - log but don't show to user during auto-lookup
          console.error('Error during auto-lookup:', await response.text());
        }
      } catch (error) {
        // Silently fail auto-lookup - user can still manually proceed
        console.error('Auto-lookup error:', error);
      } finally {
        setLookingUpVehicle(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [regNumber, availableVehicles, apiLookupAttempted, lookingUpVehicle, loadingVehicles, setError]);


  const formatMileage = (value: string): string => {
    // Remove non-digits and format with thousands separator
    const digits = value.replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const handleMileageChange = (value: string) => {
    const formatted = formatMileage(value);
    setMileage(formatted);
  };

  // Check if both fields are filled for validation
  const bothFieldsFilled = regNumber.trim() && mileage.trim() && Number(mileage.replace(/\s/g, '')) > 0;

  // Clear vehicle data when registration number changes
  useEffect(() => {
    if (registrationData.vehicle && regNumber.trim().toUpperCase() !== registrationData.vehicle.registrationNumber.toUpperCase()) {
      setRegistrationData({
        ...registrationData,
        vehicle: null
      });
    }
  }, [regNumber]);

  // Handle search button click
  const handleSearch = async () => {
    if (!regNumber.trim()) {
      setError(t('validation.regNumberRequired'));
      return;
    }

    const numericMileage = Number(mileage.replace(/\s/g, ''));
    if (!mileage.trim() || isNaN(numericMileage) || numericMileage <= 0) {
      setError(t('validation.mileageRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiGet(`/api/warranties/vehicle-lookup?registrationNumber=${encodeURIComponent(regNumber.trim())}&mileage=${encodeURIComponent(mileage.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('error.vehicleLookupFailed'));
      }

      // Update the vehicle data with user-provided mileage
      const vehicleWithMileage = {
        ...data.vehicle,
        mileage: numericMileage
      };

      setRegistrationData({
        ...registrationData,
        vehicle: vehicleWithMileage
      });
    } catch (error: any) {
      setError(error.message || t('error.generalError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0016 10v6a1 1 0 01-1 1h-1m-1 0a1 1 0 01-1 1H9m0 0H5v-2a2 2 0 012-2h2v2z" />
              </svg>
            </div>
            <div className="ml-3 text-left">
              <h3 className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{t('warranty.vehicle.title')}</h3>
              <p className="text-sm text-gray-600 font-underrubriker">{t('warranty.vehicle.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="regNumber" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                {t('warranty.vehicle.regNumber')} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="regNumber"
                  value={regNumber}
                  onChange={(e) => {
                    setRegNumber(e.target.value.toUpperCase());
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="ABC123 or search by make/model"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  disabled={loading || loadingVehicles}
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {(loadingVehicles || lookingUpVehicle) ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-forest"></div>
                      {lookingUpVehicle && (
                        <span className="ml-2 text-xs text-primary-forest">Söker...</span>
                      )}
                    </div>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showDropdown && filteredVehicles.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-scroll">
                    {filteredVehicles.slice(0, 10).map((vehicle, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setRegNumber(vehicle.registrationNumber);
                          setShowDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-primary-forest/10 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-gray-900 text-left">{vehicle.registrationNumber}</p>
                            <p className="text-xs text-gray-600">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                    {filteredVehicles.length > 10 && (
                      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                        +{filteredVehicles.length - 10} more vehicles. Keep typing to narrow down...
                      </div>
                    )}
                  </div>
                )}

                {/* No vehicles found */}
                {showDropdown && regNumber.trim() !== '' && filteredVehicles.length === 0 && !lookingUpVehicle && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 font-medium">Inget fordon hittades i din lista</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Skriv hela registreringsnumret för att söka automatiskt från vårt register
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Looking up vehicle */}
                {showDropdown && regNumber.trim() !== '' && lookingUpVehicle && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-blue-300 rounded-md shadow-lg p-3">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      <p className="text-sm text-blue-700">Söker fordon från register...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="mileage" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                {t('warranty.vehicle.mileage')} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="mileage"
                  value={mileage}
                  onChange={(e) => handleMileageChange(e.target.value)}
                  placeholder="45 000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSearch}
              disabled={!bothFieldsFilled || loading}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center ${!bothFieldsFilled || loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-forest text-white hover:bg-primary-forest/90 shadow-md hover:shadow-lg'
                }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Söker...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Sök fordon
                </>
              )}
            </button>
          </div>

          {!bothFieldsFilled && (
            <div className="mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-blue-800 font-text-primary text-sm">
                      {t('warranty.vehicle.instruction')}
                    </p>
                    {/* {availableVehicles.length > 0 && (
                      <p className="text-blue-700 font-text-primary text-xs mt-2">
                        {availableVehicles.length} vehicle{availableVehicles.length !== 1 ? 's' : ''} available in your inventory
                      </p>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Results Card */}
      {registrationData.vehicle && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-lg font-semibold text-green-800 font-text-primary font-rubriker">{t('warranty.vehicle.found')}</h4>
                <p className="text-sm text-green-600 font-underrubriker">{t('warranty.vehicle.foundSubtitle')}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('warranty.vehicle.regNumber')}</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{registrationData.vehicle.registrationNumber}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('warranty.vehicle.make')}</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{registrationData.vehicle.make} {registrationData.vehicle.model}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('warranty.vehicle.year')}</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{registrationData.vehicle.year}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('warranty.vehicle.mileage')}</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">
                  {registrationData.vehicle.mileage ? `${registrationData.vehicle.mileage.toLocaleString()} km` : t('warranty.vehicle.notAvailable')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('warranty.vehicle.vin')}</p>
                <p className="text-sm font-semibold text-gray-900 font-rubriker break-all">{registrationData.vehicle.vin}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('warranty.vehicle.fuelType')}</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{registrationData.vehicle.fuelType || t('warranty.vehicle.notAvailable')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin-only: Adjustable Vehicle Parameters */}
      {isAdmin && registrationData.vehicle && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-amber-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">Justera fordonsdata (Admin)</h4>
                <p className="text-sm text-gray-600 font-underrubriker">Anpassa värdena för att se tillgängliga produkter</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                  Årsmodell *
                </label>
                <input
                  type="number"
                  value={registrationData.vehicle.year}
                  onChange={(e) => handleAdjustedYearChange(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 text-sm"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                  Mätarställning (km) *
                </label>
                <input
                  type="number"
                  value={registrationData.vehicle.mileage || 0}
                  onChange={(e) => handleAdjustedMileageChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 text-sm"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                  Effekt (hk) *
                </label>
                <input
                  type="number"
                  value={registrationData.vehicle.powerHp || 0}
                  onChange={(e) => handleAdjustedPowerHpChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 text-sm"
                  min="0"
                />
              </div>
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-800 text-sm">
                  Ändringarna påverkar vilka produkter som är tillgängliga för registrering. Dessa värden sparas med garantin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Step 2: Product Selection
const ProductStep: React.FC<{
  registrationData: RegistrationData;
  setRegistrationData: (data: RegistrationData) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}> = ({ registrationData, setRegistrationData, loading, setLoading, setError }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<{ [key: string]: Product[] }>({});
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const { t } = useLanguage();

  // Fetch products when vehicle changes (initial load)
  useEffect(() => {
    if (registrationData.vehicle) {
      fetchEligibleProducts();
    }
  }, []);

  const fetchEligibleProducts = async () => {
    setLoadingProducts(true);
    setError(null);

    try {
      // Use vehicle data directly from registrationData (already adjusted in Step 1 if admin)
      const vehicleDataToSend = registrationData.vehicle;

      const response = await apiPost('/api/warranties/products', { vehicleData: vehicleDataToSend });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('error.productsFetchFailed'));
      }

      setProducts(data.products);
      setGroupedProducts(data.groupedProducts || {});
      setVehicleInfo(data.vehicleInfo);

    } catch (error: any) {
      setError(error.message || t('error.generalError'));
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setRegistrationData({
      ...registrationData,
      selectedProduct: product
    });
  };

  if (loadingProducts) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-forest mx-auto mb-4"></div>
          <p className="text-gray-600">{t('error.loadingProducts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Info Card - Shows data from Step 1 */}
      {registrationData.vehicle && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-4 border-b border-amber-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0016 10v6a1 1 0 01-1 1h-1m-1 0a1 1 0 01-1 1H9m0 0H5v-2a2 2 0 012-2h2v2z" />
                </svg>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">Fordonsdata från steg 1</h4>
                <p className="text-sm text-gray-600 font-underrubriker">{registrationData.vehicle.make} {registrationData.vehicle.model} - {registrationData.vehicle.registrationNumber}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Årsmodell</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{registrationData.vehicle.year}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mätarställning</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{registrationData.vehicle.mileage?.toLocaleString() || 'N/A'} km</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Effekt</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{registrationData.vehicle.powerHp || 'N/A'} hk</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{t('warranty.product.title')}</h3>
              <p className="text-sm text-gray-600 font-underrubriker">
                {t('warranty.product.subtitle').replace('{make}', registrationData.vehicle?.make || '').replace('{model}', registrationData.vehicle?.model || '')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            <label htmlFor="warrantySelect" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
              {t('warranty.product.availableProducts')} *
            </label>
            <div className="relative">
              <select
                id="warrantySelect"
                value={registrationData.selectedProduct?.id || ''}
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.id === Number(e.target.value));
                  if (selectedProduct) {
                    handleProductSelect(selectedProduct);
                  } else {
                    setRegistrationData({
                      ...registrationData,
                      selectedProduct: null
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                disabled={loadingProducts || products.length === 0}
              >
                <option value="">
                  {products.length === 0 ? t('warranty.product.noProducts') : t('warranty.product.selectProduct')}
                </option>
                {products.map((product) => {
                  const startDate = new Date();
                  const endDate = new Date();
                  endDate.setMonth(endDate.getMonth() + product.durationMonths);

                  return (
                    <option key={product.id} value={product.id}>
                      {product.name} - {startDate.toLocaleDateString('sv-SE')} till {endDate.toLocaleDateString('sv-SE')}
                    </option>
                  );
                })}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* No Products Available */}
          {products.length === 0 && (
            <div className="mt-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-amber-900 mb-1">
                      {t('warranty.product.noProductsTitle')}
                    </h4>
                    <p className="text-amber-800 text-sm">
                      {t('warranty.product.noProductsDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Product Details Card */}
      {registrationData.selectedProduct && (
        <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-lg font-semibold text-green-800 font-text-primary font-rubriker">
                  {registrationData.selectedProduct.name}
                </h4>
                <p className="text-sm text-green-600 font-underrubriker">{t('warranty.product.selected')}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('warranty.product.duration')}</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{registrationData.selectedProduct.durationMonths} {t('products.months')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('warranty.product.startDate')}</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{new Date().toLocaleDateString('sv-SE')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t('warranty.product.endDate')}</p>
                <p className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{(() => {
                  const endDate = new Date();
                  endDate.setMonth(endDate.getMonth() + registrationData.selectedProduct.durationMonths);
                  return endDate.toLocaleDateString('sv-SE');
                })()}</p>
              </div>
            </div>

            {registrationData.selectedProduct.description && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('products.description')}</p>
                <p className="text-gray-900">{registrationData.selectedProduct.description}</p>
              </div>
            )}

            {registrationData.selectedProduct.pdfUrl && (
              <a
                href={registrationData.selectedProduct.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 bg-primary-forest text-white rounded-md hover:bg-primary-forest/90 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('warranty.product.viewDetails')}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Step 3: Vehicle Owner Details
const OwnerStep: React.FC<{
  registrationData: RegistrationData;
  setRegistrationData: (data: RegistrationData) => void;
}> = ({ registrationData, setRegistrationData }) => {
  const [formData, setFormData] = useState<OwnerData>({
    personnummer: '',
    firstname: '',
    lastname: '',
    address: '',
    postnummer: '',
    ort: '',
    email: '',
    phone: '',
    name: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSuccess, setLookupSuccess] = useState(false);
  const { t } = useLanguage();

  // Sync formData with registrationData.owner (only if owner has values)
  useEffect(() => {
    if (registrationData.owner.personnummer || registrationData.owner.email ||
      registrationData.owner.phone || registrationData.owner.firstname) {
      setFormData(registrationData.owner);
      if (registrationData.owner.firstname && registrationData.owner.lastname) {
        setLookupSuccess(true);
      }
    }
  }, []);

  const validatePersonnummer = (personnummer: string): boolean => {
    // Basic Swedish personnummer validation (YYYYMMDD-XXXX or YYMMDD-XXXX)
    const pattern = /^(\d{8}|\d{6})-?\d{4}$/;
    return pattern.test(personnummer.replace(/\s/g, ''));
  };

  const validateEmail = (email: string): boolean => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Swedish phone number validation - more lenient
    const cleaned = phone.replace(/[\s-]/g, '');
    return cleaned.length >= 7;
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstname.trim()) {
      newErrors.firstname = 'Förnamn krävs';
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Efternamn krävs';
    }

    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('validation.invalidEmail');
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.phoneRequired');
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t('validation.invalidPhone');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof OwnerData, value: string) => {
    const updatedData = { ...formData, [field]: value };
    // Auto-compute name from firstname and lastname
    if (field === 'firstname' || field === 'lastname') {
      const firstname = field === 'firstname' ? value : formData.firstname;
      const lastname = field === 'lastname' ? value : formData.lastname;
      updatedData.name = `${firstname} ${lastname}`.trim();
    }
    setFormData(updatedData);
    setRegistrationData({
      ...registrationData,
      owner: updatedData
    });
  };

  const formatPersonnummer = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 8) {
      return digits;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 8)}-${digits.slice(8)}`;
    }
    return `${digits.slice(0, 8)}-${digits.slice(8, 12)}`;
  };

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('46')) {
      return `+${digits}`;
    } else if (digits.startsWith('0')) {
      return digits;
    }
    return digits;
  };

  const handlePersonnummerLookup = async () => {
    if (!formData.personnummer.trim()) {
      setLookupError('Ange personnummer först');
      return;
    }

    // if (!validatePersonnummer(formData.personnummer)) {
    //   setLookupError('Ogiltigt personnummer format (YYYYMMDD-XXXX)');
    //   return;
    // }

    setLookupLoading(true);
    setLookupError(null);
    setLookupSuccess(false);

    try {
      const response = await apiGet(`/api/dealer/person-lookup?personnummer=${encodeURIComponent(formData.personnummer)}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Kunde inte hitta person');
      }

      const data = await response.json();

      // Auto-fill the form with the fetched data
      const updatedData: OwnerData = {
        ...formData,
        firstname: data.firstname || formData.firstname,
        lastname: data.lastname || formData.lastname,
        address: data.address || formData.address,
        postnummer: data.postnummer || formData.postnummer,
        ort: data.ort || formData.ort,
        phone: data.phone || formData.phone,
        name: data.fullName || `${data.firstname} ${data.lastname}`.trim()
      };

      setFormData(updatedData);
      setRegistrationData({
        ...registrationData,
        owner: updatedData
      });
      setLookupSuccess(true);
    } catch (error) {
      console.error('Person lookup error:', error);
      setLookupError(error instanceof Error ? error.message : 'Kunde inte hitta person');
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  return (
    <div className="space-y-6">
      {/* Owner Information Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-3 text-left">
              <h3 className="text-lg font-semibold text-gray-900 font-text-primary font-rubriker">{t('warranty.owner.title')}</h3>
              <p className="text-sm text-gray-600 font-underrubriker">{t('warranty.owner.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Personnummer with lookup button - FIRST FIELD */}
          <div className="mb-6">
            <label htmlFor="ownerPersonnummer" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
              {t('warranty.owner.personnummer')} *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  id="ownerPersonnummer"
                  value={formData.personnummer}
                  onChange={(e) => {
                    handleInputChange('personnummer', formatPersonnummer(e.target.value));
                    setLookupSuccess(false);
                    setLookupError(null);
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 text-sm ${lookupError ? 'border-red-300 bg-red-50' : lookupSuccess ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                  placeholder="YYYYMMDD-XXXX"
                  maxLength={13}
                />
              </div>
              <button
                type="button"
                onClick={handlePersonnummerLookup}
                disabled={lookupLoading || !formData.personnummer.trim()}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  lookupLoading || !formData.personnummer.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-forest text-white hover:bg-primary-forest/90'
                }`}
              >
                {lookupLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Söker...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Hämta uppgifter
                  </>
                )}
              </button>
            </div>
            {lookupError && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {lookupError}
              </p>
            )}
            {lookupSuccess && (
              <p className="mt-1 text-sm text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Uppgifter hämtade
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">{t('warranty.owner.personnummerFormat')}</p>
          </div>

          {/* Auto-filled fields (read-only appearance but editable) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Firstname */}
            <div className="space-y-2">
              <label htmlFor="ownerFirstname" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                Förnamn *
              </label>
              <input
                type="text"
                id="ownerFirstname"
                value={formData.firstname}
                onChange={(e) => handleInputChange('firstname', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 text-sm ${lookupSuccess ? 'bg-gray-50' : ''} ${errors.firstname ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Förnamn"
              />
              {errors.firstname && (
                <p className="text-sm text-red-600">{errors.firstname}</p>
              )}
            </div>

            {/* Lastname */}
            <div className="space-y-2">
              <label htmlFor="ownerLastname" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                Efternamn *
              </label>
              <input
                type="text"
                id="ownerLastname"
                value={formData.lastname}
                onChange={(e) => handleInputChange('lastname', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 text-sm ${lookupSuccess ? 'bg-gray-50' : ''} ${errors.lastname ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Efternamn"
              />
              {errors.lastname && (
                <p className="text-sm text-red-600">{errors.lastname}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="ownerAddress" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                Adress
              </label>
              <input
                type="text"
                id="ownerAddress"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 text-sm ${lookupSuccess ? 'bg-gray-50' : ''} border-gray-300`}
                placeholder="Gatuadress"
              />
            </div>

            {/* Postnummer */}
            <div className="space-y-2">
              <label htmlFor="ownerPostnummer" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                Postnummer
              </label>
              <input
                type="text"
                id="ownerPostnummer"
                value={formData.postnummer}
                onChange={(e) => handleInputChange('postnummer', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 text-sm ${lookupSuccess ? 'bg-gray-50' : ''} border-gray-300`}
                placeholder="12345"
              />
            </div>

            {/* Ort */}
            <div className="space-y-2">
              <label htmlFor="ownerOrt" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                Ort
              </label>
              <input
                type="text"
                id="ownerOrt"
                value={formData.ort}
                onChange={(e) => handleInputChange('ort', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 text-sm ${lookupSuccess ? 'bg-gray-50' : ''} border-gray-300`}
                placeholder="Stockholm"
              />
            </div>

            {/* Divider for manual fields */}
            <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
              <p className="text-sm text-gray-600 font-underrubriker mb-4">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Fyll i manuellt (obligatoriska fält)
              </p>
            </div>

            {/* Email - Manual entry */}
            <div className="space-y-2">
              <label htmlFor="ownerEmail" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                {t('warranty.owner.email')} *
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="ownerEmail"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 text-sm ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  placeholder={t('warranty.owner.emailFormat')}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone - Manual entry */}
            <div className="space-y-2">
              <label htmlFor="ownerPhone" className="block text-xs font-medium text-gray-700 font-text-primary mb-1 font-underrubriker">
                {t('warranty.owner.phone')} *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="ownerPhone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', formatPhoneNumber(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-primary-forest focus:border-primary-forest transition-all duration-200 placeholder-gray-400 text-sm ${errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  placeholder="070-123 45 67"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              {errors.phone ? (
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.phone}
                </p>
              ) : (
                <p className="text-xs text-gray-500">{t('warranty.owner.phoneFormat')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Information Card */}
      <div className="bg-white rounded-xl border border-blue-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-lg font-semibold text-blue-900 font-rubriker">{t('warranty.owner.privacyTitle')}</h4>
              <p className="text-sm text-blue-600 font-underrubriker">{t('warranty.owner.privacySubtitle')}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 font-text-primary">
            {t('warranty.owner.privacyText')}
          </p>
        </div>
      </div>

      {/* Validation Success Card */}
      {Object.keys(errors).length === 0 &&
        formData.firstname && formData.lastname && formData.email && formData.phone && formData.personnummer && (
          <div className="bg-white rounded-xl border border-green-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-semibold text-green-800 font-text-primary font-rubriker">{t('warranty.owner.validatedTitle')}</h4>
                  <p className="text-sm text-green-600 font-underrubriker">{t('warranty.owner.validatedSubtitle')}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-green-800 font-text-primary">
                {t('warranty.owner.validatedText')}
              </p>
            </div>
          </div>
        )}
    </div>
  );
};

// Step 4: Summary and Complete Registration
const SummaryStep: React.FC<{
  registrationData: RegistrationData;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  onSuccess: () => void;
  dealerId?: number;
}> = ({ registrationData, loading, setLoading, setError, onSuccess, dealerId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t } = useLanguage();

  const calculateEndDate = (startDate: Date, durationMonths: number): Date => {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  };

  const handleSubmitRegistration = async () => {
    if (!registrationData.vehicle || !registrationData.selectedProduct) {
      setError(t('error.incompleteData'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiPost('/api/warranties/register', {
        vehicleRegistrationNumber: registrationData.vehicle.registrationNumber,
        vehicleData: registrationData.vehicle,
        productId: registrationData.selectedProduct.id,
        ownerName: registrationData.owner.name || `${registrationData.owner.firstname} ${registrationData.owner.lastname}`.trim(),
        ownerFirstname: registrationData.owner.firstname,
        ownerLastname: registrationData.owner.lastname,
        ownerEmail: registrationData.owner.email,
        ownerPhone: registrationData.owner.phone,
        ownerPersonnummer: registrationData.owner.personnummer,
        ownerAddress: registrationData.owner.address,
        ownerPostnummer: registrationData.owner.postnummer,
        ownerOrt: registrationData.owner.ort,
        dealerId: dealerId
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('error.registrationFailed'));
      }

      setSuccess(true);
      // Auto-close modal after 10 seconds
      setTimeout(() => {
        onSuccess();
      }, 10000);

    } catch (error: any) {
      setError(error.message || t('error.generalError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-8 shadow-xl">
            <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            {t('warranty.summary.success')}
          </h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('warranty.summary.successText')}
          </p>
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200 rounded-2xl p-8 text-left max-w-2xl mx-auto">
            <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {t('warranty.summary.nextSteps')}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                <span className="text-green-800 font-text-primary font-medium">{t('warranty.summary.confirmationSent')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                <span className="text-green-800 font-text-primary font-medium">{t('warranty.summary.warrantyActive')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-4"></div>
                <span className="text-green-800 font-text-primary font-medium">{t('warranty.summary.customerContact')}</span>
              </div>
            </div>
          </div>
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-800 font-text-primary font-medium">
                {t('warranty.summary.autoClose')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const startDate = new Date();
  const endDate = registrationData.selectedProduct
    ? calculateEndDate(startDate, registrationData.selectedProduct.durationMonths)
    : new Date();

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary-forest/10 rounded-lg flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-primary-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 font-rubriker">
          {t('warranty.summary.title')}
        </h3>
        <p className="text-gray-600">
          {t('warranty.summary.subtitle')}
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Consolidated Information Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-forest to-primary-forest/90 px-6 py-4">
            <h4 className="text-xl font-bold text-white font-rubriker">{t('warranty.summary.header')}</h4>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Vehicle & Product Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vehicle */}
              <div className="space-y-2">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414A1 1 0 0016 10v6a1 1 0 01-1 1h-1m-1 0a1 1 0 01-1 1H9m0 0H5v-2a2 2 0 012-2h2v2z" />
                    </svg>
                  </div>
                  <h5 className="ml-2 font-semibold text-gray-900 font-rubriker">{t('warranty.vehicle')}</h5>
                </div>
                {registrationData.vehicle && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">{t('warranty.vehicle.regNumber')}</p>
                      <p className="font-medium">{registrationData.vehicle.registrationNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('warranty.vehicle.make')}</p>
                      <p className="font-medium">{registrationData.vehicle.make} {registrationData.vehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('warranty.vehicle.year')}</p>
                      <p className="font-medium">{registrationData.vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('warranty.vehicle.mileage')}</p>
                      <p className="font-medium">{registrationData.vehicle.mileage?.toLocaleString() || 'N/A'} km</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Product */}
              <div className="space-y-2">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h5 className="ml-2 font-semibold text-gray-900 font-rubriker">{t('warranty.product')}</h5>
                </div>
                {registrationData.selectedProduct && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">{t('warranty.product')}</p>
                      <p className="font-medium">{registrationData.selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('warranty.product.duration')}</p>
                      <p className="font-medium">{registrationData.selectedProduct.durationMonths} {t('products.months')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('warranty.product.startDate')}</p>
                      <p className="font-medium">{startDate.toLocaleDateString('sv-SE')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('warranty.product.endDate')}</p>
                      <p className="font-medium">{endDate.toLocaleDateString('sv-SE')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Owner Information */}
            <div className="space-y-2">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h5 className="ml-2 font-semibold text-gray-900 font-rubriker">{t('warranty.owner')}</h5>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">{t('warranty.owner.personnummer')}</p>
                  <p className="font-medium">{registrationData.owner.personnummer}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('warranty.owner.firstname')}</p>
                  <p className="font-medium">{registrationData.owner.firstname}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('warranty.owner.lastname')}</p>
                  <p className="font-medium">{registrationData.owner.lastname}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('warranty.owner.email')}</p>
                  <p className="font-medium text-xs">{registrationData.owner.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('warranty.owner.phone')}</p>
                  <p className="font-medium">{registrationData.owner.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('warranty.owner.address')}</p>
                  <p className="font-medium">{registrationData.owner.address || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('warranty.owner.postnummer')}</p>
                  <p className="font-medium">{registrationData.owner.postnummer || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('warranty.owner.ort')}</p>
                  <p className="font-medium">{registrationData.owner.ort || '-'}</p>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Confirmation Notice */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h6 className="font-semibold text-blue-900 font-rubriker text-sm">{t('warranty.summary.confirmations')}</h6>
                  <p className="text-blue-800 font-text-primary text-sm mt-1">
                    {t('warranty.summary.confirmationsText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        {!registrationData.selectedProduct ? (
          <div className="text-center">
            <button
              disabled
              className="px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-500 cursor-not-allowed text-sm"
            >
              {t('warranty.summary.complete')}
            </button>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-text-secondary">
                  {t('warranty.summary.productRequired')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSubmitRegistration}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm ${isSubmitting
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary-forest text-white hover:bg-primary-forest/90 focus:outline-none focus:ring-2 focus:ring-primary-forest/50 shadow-md hover:shadow-lg'
              }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                {t('warranty.summary.completing')}
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('warranty.summary.complete')}
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default WarrantyRegistrationModal;