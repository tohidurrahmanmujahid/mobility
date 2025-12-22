import React, { useState, useEffect } from 'react';
import { Calendar, Upload, Search, X, FileText, Image, Info } from 'lucide-react';

const VehicleDamageForm = () => {
    const [formData, setFormData] = useState({
        regNr: '',
        skadedatum: '',
        agarNamn: '',
        agarTelefon: '',
        agarEmail: '',
        malarstellningSkade: '',
        datumSenasteService: '',
        malarstellningSenasteService: '',
        serviceInfoSaknas: false,
        agarensBeskrivning: '',
        fordonetPaVerkstad: '',
        organisationsnummer: '',
        kontaktperson: '',
        kontaktTelefon: '',
        kontaktEmail: '',
        skadeorsak: '',
        ovrigtUnderlag: false,
        acceptTerms: false
    });

    const [regSuggestions, setRegSuggestions] = useState([]);
    const [showRegSuggestions, setShowRegSuggestions] = useState(false);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [orgSearchLoading, setOrgSearchLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<any>({});

    // Fetch registration numbers based on org number
    const fetchRegistrationNumbers = async (orgNumber) => {
        if (orgNumber.length >= 6) {
            setOrgSearchLoading(true);
            try {
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
                const response = await fetch(`${apiBaseUrl}/api/v1/dealer/${orgNumber}`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                // Extract registration numbers from vehicles array
                if (data.vehicles && Array.isArray(data.vehicles)) {
                    const regNumbers = data.vehicles.map(vehicle => vehicle.registrationNumber);
                    setRegSuggestions(regNumbers);
                } else {
                    setRegSuggestions([]);
                }

                if(data.dealer?.staff?.length > 0) {
                    const contact = data.dealer.staff[0];
                    setFormData(prev => ({
                        ...prev,
                        kontaktperson: `${contact.name || ''}`,
                        kontaktTelefon: contact.phone || '',
                        kontaktEmail: contact.email || ''
                    }));
                }
            } catch (error) {
                console.error('Error fetching registration numbers:', error);
                setRegSuggestions([]);
            } finally {
                setOrgSearchLoading(false);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }

        if (name === 'organisationsnummer' && value.length >= 6) {
            fetchRegistrationNumbers(value);
        }

        if (name === 'regNr' && value.length > 0) {
            setShowRegSuggestions(true);
        }
    };

    const selectRegNr = (reg) => {
        setFormData(prev => ({ ...prev, regNr: reg }));
        setShowRegSuggestions(false);
    };

    const handleFileUpload = (e, type) => {
        const files = Array.from(e.target.files);
        if (type === 'docs') {
            setUploadedDocs(prev => [...prev, ...files]);
        } else {
            setUploadedImages(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index, type) => {
        if (type === 'docs') {
            setUploadedDocs(prev => prev.filter((_, i) => i !== index));
        } else {
            setUploadedImages(prev => prev.filter((_, i) => i !== index));
        }
    };

    const validateForm = () => {
        const newErrors: any = {};
        const requiredFields = [
            'regNr', 'skadedatum', 'agarNamn', 'malarstellningSkade',
            'datumSenasteService', 'agarensBeskrivning', 'organisationsnummer',
            'kontaktperson', 'kontaktTelefon', 'kontaktEmail'
        ];

        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = true;
            }
        });

        if (!formData.serviceInfoSaknas && !formData.malarstellningSenasteService) {
            newErrors.malarstellningSenasteService = true;
        }

        if (!formData.acceptTerms) {
            newErrors.acceptTerms = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            alert('Vänligen fyll i alla obligatoriska fält');
            return;
        }

        setIsSubmitting(true);

        try {
            // Create FormData object
            const formDataPayload = new FormData();

            // Append all text/boolean fields
            formDataPayload.append('regNr', formData.regNr);
            formDataPayload.append('skadedatum', formData.skadedatum);
            formDataPayload.append('agarNamn', formData.agarNamn);
            formDataPayload.append('agarTelefon', formData.agarTelefon);
            formDataPayload.append('agarEmail', formData.agarEmail);
            formDataPayload.append('malarstellningSkade', formData.malarstellningSkade);
            formDataPayload.append('datumSenasteService', formData.datumSenasteService);
            formDataPayload.append('malarstellningSenasteService', formData.malarstellningSenasteService);
            formDataPayload.append('serviceInfoSaknas', String(formData.serviceInfoSaknas));
            formDataPayload.append('agarensBeskrivning', formData.agarensBeskrivning);
            formDataPayload.append('fordonetPaVerkstad', formData.fordonetPaVerkstad);
            formDataPayload.append('organisationsnummer', formData.organisationsnummer);
            formDataPayload.append('kontaktperson', formData.kontaktperson);
            formDataPayload.append('kontaktTelefon', formData.kontaktTelefon);
            formDataPayload.append('kontaktEmail', formData.kontaktEmail);
            formDataPayload.append('skadeorsak', formData.skadeorsak);
            formDataPayload.append('ovrigtUnderlag', String(formData.ovrigtUnderlag));
            formDataPayload.append('acceptTerms', String(formData.acceptTerms));

            // Append uploaded documents
            uploadedDocs.forEach((file) => {
                formDataPayload.append('uploadedDocs', file);
            });

            // Append uploaded images
            uploadedImages.forEach((file) => {
                formDataPayload.append('uploadedImages', file);
            });

            // Make API call
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const response = await fetch(`${apiBaseUrl}/api/warranties/workshop-submit`, {
                method: 'POST',
                body: formDataPayload,
                // Note: Don't set Content-Type header - browser will set it with boundary
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Success
            alert('Skadeanmälan har skickats!');
            console.log('Submission successful:', result);

            // Reset form after successful submission
            handleReset();

        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Ett fel uppstod vid skickning av skadeanmälan. Vänligen försök igen.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            regNr: '',
            skadedatum: '',
            agarNamn: '',
            agarTelefon: '',
            agarEmail: '',
            malarstellningSkade: '',
            datumSenasteService: '',
            malarstellningSenasteService: '',
            serviceInfoSaknas: false,
            agarensBeskrivning: '',
            fordonetPaVerkstad: '',
            organisationsnummer: '',
            kontaktperson: '',
            kontaktTelefon: '',
            kontaktEmail: '',
            skadeorsak: '',
            ovrigtUnderlag: false,
            acceptTerms: false
        });
        setUploadedDocs([]);
        setUploadedImages([]);
        setErrors({});
    };

    return (
        <div className="min-h-screen bg-gradient-to-b py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
                        {/* Right Column - Workshop Information */}
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                                Verkstadens uppgifter
                            </h2>

                            <div className="space-y-4">
                                {/* Organization Number with Search */}
                                <div className="relative">
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Organisationsnummer <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="organisationsnummer"
                                            value={formData.organisationsnummer}
                                            onChange={handleInputChange}
                                            placeholder="Organisationsnummer"
                                            className={`flex-1 px-4 py-2 border ${errors.organisationsnummer ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fetchRegistrationNumbers(formData.organisationsnummer)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            {orgSearchLoading ? 'Söker...' : 'Sök'}
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-800 mt-6">
                                    Verkstadens kontaktperson
                                </h3>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Kontaktperson <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="kontaktperson"
                                        value={formData.kontaktperson}
                                        onChange={handleInputChange}
                                        placeholder="Kontaktperson i detta ärende"
                                        className={`w-full px-4 py-2 border ${errors.kontaktperson ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Telefon <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="kontaktTelefon"
                                        value={formData.kontaktTelefon}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border ${errors.kontaktTelefon ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="kontaktEmail"
                                        value={formData.kontaktEmail}
                                        onChange={handleInputChange}
                                        placeholder="Kontaktperson E-mail"
                                        className={`w-full px-4 py-2 border ${errors.kontaktEmail ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                </div>

                                {/* Decorative element */}
                                <div className="relative mt-8">
                                    <div className="absolute right-0 top-0">
                                        <svg width="200" height="150" viewBox="0 0 200 150" className="opacity-20">
                                            <circle cx="150" cy="50" r="40" fill="#fbbf24" />
                                            <circle cx="100" cy="100" r="30" fill="#fde68a" />
                                            <path d="M160 80 L180 100 L160 120 L140 100 Z" fill="#3b82f6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Left Column - Vehicle/Damage Information */}
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                                Fordons-/skadeuppgifter
                            </h2>

                            <div className="space-y-4">
                                {/* Registration Number with Autocomplete */}
                                <div className="relative">
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Regnr <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="regNr"
                                        value={formData.regNr}
                                        onChange={handleInputChange}
                                        placeholder="ABC1234 (viktigt att ange fullständigt reg-nr)"
                                        className={`w-full px-4 py-2 border ${errors.regNr ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                    {showRegSuggestions && regSuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg">
                                            {regSuggestions.map((reg, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => selectRegNr(reg)}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                >
                                                    {reg}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Damage Date */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Skadedatum <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            name="skadedatum"
                                            value={formData.skadedatum}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2 border ${errors.skadedatum ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                        />
                                    </div>
                                </div>

                                {/* Owner Information */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Ägare <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="agarNamn"
                                        value={formData.agarNamn}
                                        onChange={handleInputChange}
                                        placeholder="Förnamn Efternamn"
                                        className={`w-full px-4 py-2 border ${errors.agarNamn ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Ägare Telefon
                                    </label>
                                    <input
                                        type="tel"
                                        name="agarTelefon"
                                        value={formData.agarTelefon}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Ägare E-mail
                                    </label>
                                    <input
                                        type="email"
                                        name="agarEmail"
                                        value={formData.agarEmail}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Odometer Readings */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Mätarställning vid skadetilfället <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="malarstellningSkade"
                                        value={formData.malarstellningSkade}
                                        onChange={handleInputChange}
                                        placeholder="Ange i km (endast siffror i fältet)"
                                        className={`w-full px-4 py-2 border ${errors.malarstellningSkade ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Datum senaste service <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="datumSenasteService"
                                        value={formData.datumSenasteService}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border ${errors.datumSenasteService ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Mätarställning senaste service <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="malarstellningSenasteService"
                                        value={formData.malarstellningSenasteService}
                                        onChange={handleInputChange}
                                        placeholder="Ange i km (endast siffror i fältet)"
                                        className={`w-full px-4 py-2 border ${errors.malarstellningSenasteService ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Serviceinformation saknas
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="serviceInfoSaknas"
                                            checked={formData.serviceInfoSaknas}
                                            onChange={handleInputChange}
                                            className="mr-2"
                                        />
                                        <span className="text-sm">Serviceinformation saknas</span>
                                    </label>
                                </div>

                                {/* Description of Damage */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Ägarens beskrivning av skada <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="agarensBeskrivning"
                                        value={formData.agarensBeskrivning}
                                        onChange={handleInputChange}
                                        placeholder="Utförlig beskrivning"
                                        rows={4}
                                        className={`w-full px-4 py-2 border ${errors.agarensBeskrivning ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Fordonet står på verkstad
                                    </label>
                                    <input
                                        type="text"
                                        name="fordonetPaVerkstad"
                                        value={formData.fordonetPaVerkstad}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>


                    </div>

                    {/* Workshop Diagnosis Section */}
                    <div className="border-t border-gray-200 p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                            Verkstadsdiagnos
                        </h2>

                        <p className="text-sm text-gray-600 mb-6">
                            Bifoga offert genom att ladda upp eller ange manuellt!
                        </p>

                        <div className="space-y-6">
                            {/* Cause of Damage */}
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                    Skadeorsak
                                </label>
                                <textarea
                                    name="skadeorsak"
                                    value={formData.skadeorsak}
                                    onChange={handleInputChange}
                                    placeholder="Utförlig beskrivning inkl. teknisk skadeorsak (Använd ej ord som trolig etc.)"
                                    rows={4}

                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* File Upload Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Document Upload */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">
                                        Offert (måste laddas upp om inte kallyl fylls i)
                                    </label>
                                    <p className="text-xs text-gray-500 mb-3">
                                        Arbetslådar enligt fabrikantsbunddata följare och delar specificeras med art nr.
                                    </p>
                                    <p className="text-xs text-gray-500 mb-3">
                                        Godkända filtyper: pdf, docx, doc, txt, xls, xml, xlsx, jp, PNG, jpg, jpeg
                                    </p>

                                    <div className="space-y-2">
                                        <label className="relative inline-block">
                                            <input
                                                type="file"
                                                multiple
                                                accept=".pdf,.docx,.doc,.txt,.xls,.xml,.xlsx"
                                                onChange={(e) => handleFileUpload(e, 'docs')}
                                                className="hidden"
                                            />
                                            <div className="px-4 py-2 bg-white border-2 border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors flex items-center gap-2">
                                                <FileText size={20} />
                                                <span>Ladda upp</span>
                                            </div>
                                        </label>

                                        {uploadedDocs.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {uploadedDocs.map((file, index) => (
                                                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                                        <span className="text-sm truncate">{file.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(index, 'docs')}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">
                                        eller
                                    </label>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-600 mb-3">
                                            Hämta tömda, mc, m.fl., xls, xlsx, xml, jpeg, jp, PNG, jpg, jpeg
                                        </p>
                                        <p className="text-xs text-gray-500 mb-3">
                                            Godkända filtyper: doc, docx, xls, xlsx, xml, jpeg, jp, PNG, jpg, jpeg
                                        </p>

                                        <div className="space-y-2">
                                            <label className="relative inline-block">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept=".doc,.docx,.xls,.xlsx,.xml,.jpeg,.jpg,.png"
                                                    onChange={(e) => handleFileUpload(e, 'images')}
                                                    className="hidden"
                                                />
                                                <div className="px-4 py-2 bg-white border-2 border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors flex items-center gap-2">
                                                    <Image size={20} />
                                                    <span>Ladda upp</span>
                                                </div>
                                            </label>

                                            {uploadedImages.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {uploadedImages.map((file, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                                            <span className="text-sm truncate">{file.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFile(index, 'images')}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Note */}
                            <div className="mt-4">
                                <label className="block text-sm text-gray-600 mb-1">
                                    Övrigt underlag (offert laddas upp separat)
                                </label>
                                <p className="text-xs text-gray-500">
                                    Arbetsluppdatda, bilder, anställningsbevis, kvitto på servicekick etc.
                                </p>
                            </div>

                            {/* Terms Agreement */}
                            <div className="mt-6 p-4 bg-gray-50 rounded-md">
                                <label className="flex items-start">
                                    <input
                                        type="checkbox"
                                        name="acceptTerms"
                                        checked={formData.acceptTerms}
                                        onChange={handleInputChange}
                                        className={`mt-1 mr-3 ${errors.acceptTerms ? 'ring-2 ring-red-500' : ''}`}
                                    />
                                    <span className="text-sm text-gray-700">
                                        Jag förstår att personuppgifter är nödvändiga för att registrera skadeanmälan
                                        <Info size={14} className="inline ml-1 text-gray-400" />
                                    </span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Skickar...' : 'Skicka skadeanmälan'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Rensa formuläret
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleDamageForm;