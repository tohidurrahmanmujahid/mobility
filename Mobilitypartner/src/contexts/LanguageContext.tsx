import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'sv' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  sv: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.dealers': 'Återförsäljare',
    'nav.newDealer': 'Ny återförsäljare',
    'nav.products': 'Produkter',
    'nav.warranties': 'Registrerade garantier',
    'nav.claims': 'Skadereglering',
    'nav.finance': 'Finance',
    'nav.settings': 'Inställningar',
    'nav.auditLog': 'Ändringslogg',
    'nav.logout': 'Logga ut',

    // Header
    'header.adminDashboard': 'Admin Dashboard',
    'header.dealerDashboard': 'Återförsäljare Dashboard',
    'header.companyName': 'Mobility Partner',

    // Common
    'common.loading': 'Laddar...',
    'common.search': 'Sök',
    'common.save': 'Spara',
    'common.cancel': 'Avbryt',
    'common.delete': 'Ta bort',
    'common.edit': 'Redigera',
    'common.close': 'Stäng',
    'common.yes': 'Ja',
    'common.no': 'Nej',
    'common.next': 'Nästa',
    'common.previous': 'Föregående',
    'common.submit': 'Skicka',
    'common.add': 'Lägg till',
    'common.remove': 'Ta bort',
    'common.view': 'Visa',
    'common.download': 'Ladda ner',
    'common.email': 'E-post',
    'common.phone': 'Telefon',
    'common.name': 'Namn',
    'common.address': 'Adress',
    'common.status': 'Status',
    'common.date': 'Datum',
    'common.actions': 'Åtgärder',

    // Auth
    'auth.signIn': 'Logga in',
    'auth.signingIn': 'Loggar in...',
    'auth.signInTitle': 'Logga in på ditt konto',
    'auth.adminSignInTitle': 'Admin - Logga in',
    'auth.dealerSignInTitle': 'Partner - Logga in',
    'auth.emailAddress': 'E-postadress',
    'auth.password': 'Lösenord',
    'auth.forgotPassword': 'Glömt lösenord?',
    'auth.redirecting': 'Omdirigerar till inloggning...',
    'auth.adminAccessOnly': 'Endast administratörer har tillgång till denna sida',
    'auth.dealerAccessOnly': 'Endast återförsäljare har tillgång till denna sida',
    'auth.inactivityLogout': 'Du har loggats ut på grund av inaktivitet. Vänligen logga in igen.',

    // Dashboard
    'dashboard.title': 'Admin Dashboard',
    'dashboard.subtitle': 'Översikt över systemet och senaste aktiviteter',
    'dashboard.dealers': 'Återförsäljare',
    'dashboard.warranties': 'Garantier',
    'dashboard.activeClaims': 'Aktiva ärenden',
    'dashboard.pendingInvoices': 'Väntande fakturor',
    'dashboard.recentWarranties': 'Senaste garantier',
    'dashboard.recentClaims': 'Senaste ärenden',
    'dashboard.viewAllWarranties': 'Se alla garantier',
    'dashboard.viewAllClaims': 'Se alla ärenden',
    'dashboard.totalWarranties': 'Antal Garantier',
    'dashboard.activeWarranties': 'Aktiva Garantier',
    'dashboard.expiredWarranties': 'Avslutade Garantier',

    // Dealer Dashboard
    'dealer.welcome': 'Välkommen, {name}!',
    'dealer.registerWarranty': 'Registrera garanti',
    'dealer.recentWarranties': 'Recent Warranties',
    'dealer.noWarranties': 'Inga garantier registrerade ännu',
    'dealer.validUntil': 'Giltig till',

    // Dealers
    'dealers.title': 'Återförsäljare',
    'dealers.subtitle': 'Hantera och övervaka alla registrerade återförsäljare',
    'dealers.newDealer': '+ Ny återförsäljare',
    'dealers.allDealers': 'Alla återförsäljare',
    'dealers.selectDealer': 'Välj en återförsäljare',
    'dealers.companyInfo': 'Företagsinformation',
    'dealers.companyName': 'Företagsnamn',
    'dealers.orgNumber': 'Organisationsnummer',
    'dealers.address': 'Adress',
    'dealers.contactPerson': 'Kontaktperson',
    'dealers.registered': 'Registrerad',
    'dealers.staff': 'Personal',
    'dealers.active': 'Aktiv',
    'dealers.inactive': 'Inaktiv',
    'dealers.comments': 'Kommentarer',
    'dealers.addComment': '+ Lägg till kommentar',
    'dealers.noComments': 'Inga kommentarer ännu',
    'dealers.warranties': 'Garantier',
    'dealers.invoices': 'Fakturor',
    'dealers.contactInfo': 'Kontaktuppgifter',
    'dealers.backToAdmin': '← Tillbaka till admin',
    'dealers.adminView': 'Admin View - Viewing {companyName} Dashboard',

    // Products
    'products.title': 'Produkter',
    'products.subtitle': 'Hantera garantiprodukter',
    'products.name': 'Produktnamn',
    'products.duration': 'Varaktighet',
    'products.months': 'månader',
    'products.description': 'Beskrivning',
    'products.pdfUrl': 'PDF URL',
    'products.createdAt': 'Skapad',
    'products.newProduct': 'Ny produkt',
    'products.editProduct': 'Redigera produkt',
    'products.addProduct': '+ Lägg till produkt',

    // Warranties
    'warranties.title': 'Registrerade garantier',
    'warranties.subtitle': 'Alla registrerade garantier i systemet',
    'warranties.filterByDealer': 'Filtrera efter återförsäljare',
    'warranties.filterByStatus': 'Filtrera efter status',
    'warranties.vehicleReg': 'Fordon',
    'warranties.owner': 'Ägare',
    'warranties.product': 'Produkt',
    'warranties.dealer': 'Återförsäljare',
    'warranties.startDate': 'Startdatum',
    'warranties.endDate': 'Slutdatum',
    'warranties.mileage': 'Mätarställning',

    // Warranty Registration Modal
    'warranty.register': 'Registrera garanti',
    'warranty.step': 'Steg',
    'warranty.of': 'av',
    'warranty.vehicle': 'Fordon',
    'warranty.product': 'Produkt',
    'warranty.owner': 'Fordonsägare',
    'warranty.summary': 'Sammanställning',

    // Step 1 - Vehicle
    'warranty.vehicle.title': 'Fordonsuppgifter',
    'warranty.vehicle.subtitle': 'Ange registreringsnummer och mätarställning',
    'warranty.vehicle.regNumber': 'Registreringsnummer',
    'warranty.vehicle.mileage': 'Mätarställning (km)',
    'warranty.vehicle.found': 'Fordon hittat!',
    'warranty.vehicle.foundSubtitle': 'Fordonsdata har hämtats framgångsrikt',
    'warranty.vehicle.make': 'Märke & Modell',
    'warranty.vehicle.year': 'Årsmodell',
    'warranty.vehicle.vin': 'VIN',
    'warranty.vehicle.fuelType': 'Bränsletyp',
    'warranty.vehicle.notAvailable': 'Ej tillgänglig',
    'warranty.vehicle.instruction': 'Fyll i både registreringsnummer och mätarställning, klicka sedan på "Nästa" för att hämta fordonsdata.',

    // Step 2 - Product
    'warranty.product.title': 'Välj garantiprodukt',
    'warranty.product.subtitle': 'För {make} {model}',
    'warranty.product.vehicleInfo': 'Fordonsinformation',
    'warranty.product.vehicleInfoSubtitle': 'Information som påverkar garantivalen',
    'warranty.product.vehicleAge': 'Fordonsålder',
    'warranty.product.years': 'år',
    'warranty.product.availableProducts': 'Tillgängliga garantiprodukter',
    'warranty.product.selectProduct': 'Välj en garantiprodukt...',
    'warranty.product.noProducts': 'Inga tillgängliga produkter för detta fordon',
    'warranty.product.noProductsTitle': 'Inga tillgängliga produkter',
    'warranty.product.noProductsDesc': 'Detta fordon uppfyller tyvärr inte kriterierna för våra garantiprodukter.',
    'warranty.product.selected': 'Vald garantiprodukt',
    'warranty.product.duration': 'Giltighetstid',
    'warranty.product.startDate': 'Startdatum',
    'warranty.product.endDate': 'Slutdatum',
    'warranty.product.viewDetails': 'Visa produktdetaljer (PDF)',

    // Step 3 - Owner
    'warranty.owner.title': 'Fordonsägarens uppgifter',
    'warranty.owner.subtitle': 'Fyll i ägarens kontaktuppgifter för garantiregistreringen',
    'warranty.owner.name': 'Namn',
    'warranty.owner.nameFormat': 'För- och efternamn',
    'warranty.owner.personnummer': 'Personnummer',
    'warranty.owner.personnummerFormat': 'Format: YYYYMMDD-XXXX',
    'warranty.owner.email': 'E-post',
    'warranty.owner.emailFormat': 'namn@exempel.se',
    'warranty.owner.phone': 'Telefonnummer',
    'warranty.owner.phoneFormat': 'Svenskt mobilnummer eller telefonnummer',
    'warranty.owner.firstname': 'Förnamn',
    'warranty.owner.lastname': 'Efternamn',
    'warranty.owner.address': 'Adress',
    'warranty.owner.postnummer': 'Postnummer',
    'warranty.owner.ort': 'Ort',
    'warranty.owner.lookup': 'Hämta uppgifter',
    'warranty.owner.lookupLoading': 'Söker...',
    'warranty.owner.lookupSuccess': 'Uppgifter hämtade',
    'warranty.owner.lookupError': 'Kunde inte hämta uppgifter',
    'warranty.owner.autoFilled': 'Uppgifter hämtade från personnummer',
    'warranty.owner.manualEntry': 'Fyll i manuellt',
    'warranty.owner.privacyTitle': 'Behandling av personuppgifter',
    'warranty.owner.privacySubtitle': 'Information enligt GDPR',
    'warranty.owner.privacyText': 'Uppgifterna behandlas för garantihantering enligt GDPR. Kunden kommer att få bekräftelse via e-post och SMS.',
    'warranty.owner.validatedTitle': 'Uppgifter validerade',
    'warranty.owner.validatedSubtitle': 'Alla obligatoriska fält är korrekt ifyllda',
    'warranty.owner.validatedText': 'Alla uppgifter är korrekt ifyllda. Du kan fortsätta till nästa steg för att granska och slutföra registreringen.',

    // Step 4 - Summary
    'warranty.summary.title': 'Sammanställning',
    'warranty.summary.subtitle': 'Granska alla uppgifter innan du slutför garantiregistreringen',
    'warranty.summary.header': 'Registreringssammanfattning',
    'warranty.summary.confirmations': 'Automatiska bekräftelser',
    'warranty.summary.confirmationsText': 'Kunden får automatiskt bekräftelse via e-post och SMS när registreringen är klar.',
    'warranty.summary.complete': 'Slutför registrering',
    'warranty.summary.completing': 'Registrerar...',
    'warranty.summary.productRequired': 'En garantiprodukt måste väljas för att slutföra registreringen',
    'warranty.summary.success': 'Garanti registrerad!',
    'warranty.summary.successText': 'Garantiregistreringen har genomförts framgångsrikt. Kunden kommer att få en bekräftelse via e-post och SMS.',
    'warranty.summary.nextSteps': 'Nästa steg:',
    'warranty.summary.confirmationSent': 'Bekräftelse skickas automatiskt till kunden',
    'warranty.summary.warrantyActive': 'Garantin är nu aktiv och kan ses i ditt dashboard',
    'warranty.summary.customerContact': 'Kunden kan kontakta er för eventuella frågor',
    'warranty.summary.autoClose': 'Detta fönster stängs automatiskt om några sekunder...',

    // Form Validation
    'validation.required': 'Detta fält är obligatoriskt',
    'validation.invalidEmail': 'Ogiltig e-postadress',
    'validation.invalidPhone': 'Ogiltigt telefonnummer',
    'validation.invalidPersonnummer': 'Ogiltigt personnummer',
    'validation.nameRequired': 'Namn är obligatoriskt',
    'validation.emailRequired': 'E-post är obligatorisk',
    'validation.phoneRequired': 'Telefonnummer är obligatoriskt',
    'validation.personnummerRequired': 'Personnummer är obligatoriskt',
    'validation.regNumberRequired': 'Vänligen ange ett registreringsnummer',
    'validation.mileageRequired': 'Vänligen ange en giltig mätarställning',

    // Settings
    'settings.title': 'Administratörer',
    'settings.subtitle': 'Hantera systemadministratörer',
    'settings.administrators': 'Administratörer',
    'settings.registerAdmin': 'Registrera ny administratör',
    'settings.adminName': 'Administratörsnamn',
    'settings.adminEmail': 'E-postadress',
    'settings.adminPassword': 'Lösenord',
    'settings.registerButton': 'Registrera administratör',

    // Error Messages
    'error.vehicleLookupFailed': 'Kunde inte hämta fordonsdata',
    'error.productsFetchFailed': 'Kunde inte hämta produkter',
    'error.registrationFailed': 'Registreringen misslyckades',
    'error.generalError': 'Ett fel inträffade',
    'error.incompleteData': 'Ofullständig data för registrering',
    'error.loadingProducts': 'Hämtar tillgängliga produkter...',

    // Status
    'status.active': 'aktiv',
    'status.inactive': 'inaktiv',
    'status.expired': 'utgången',
    'status.pending': 'väntande',
    'status.loading': 'Laddar...',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.dealers': 'Dealers',
    'nav.newDealer': 'New Dealer',
    'nav.products': 'Products',
    'nav.warranties': 'Registered Warranties',
    'nav.claims': 'Claims',
    'nav.finance': 'Finance',
    'nav.settings': 'Settings',
    'nav.auditLog': 'Audit Log',
    'nav.logout': 'Log Out',

    // Header
    'header.adminDashboard': 'Admin Dashboard',
    'header.dealerDashboard': 'Dealer Dashboard',
    'header.companyName': 'Mobility Partner',

    // Common
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.view': 'View',
    'common.download': 'Download',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.name': 'Name',
    'common.address': 'Address',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.actions': 'Actions',

    // Auth
    'auth.signIn': 'Sign in',
    'auth.signingIn': 'Signing in...',
    'auth.signInTitle': 'Sign in to your account',
    'auth.adminSignInTitle': 'Admin - Sign In',
    'auth.dealerSignInTitle': 'Partner - Sign In',
    'auth.emailAddress': 'Email address',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.redirecting': 'Redirecting to login...',
    'auth.adminAccessOnly': 'Only administrators have access to this page',
    'auth.dealerAccessOnly': 'Only dealers have access to this page',
    'auth.inactivityLogout': 'You have been logged out due to inactivity. Please log in again.',

    // Dashboard
    'dashboard.title': 'Admin Dashboard',
    'dashboard.subtitle': 'System overview and recent activities',
    'dashboard.dealers': 'Dealers',
    'dashboard.warranties': 'Warranties',
    'dashboard.activeClaims': 'Active Claims',
    'dashboard.pendingInvoices': 'Pending Invoices',
    'dashboard.recentWarranties': 'Recent Warranties',
    'dashboard.recentClaims': 'Recent Claims',
    'dashboard.viewAllWarranties': 'View All Warranties',
    'dashboard.viewAllClaims': 'View All Claims',
    'dashboard.totalWarranties': 'Total Warranties',
    'dashboard.activeWarranties': 'Active Warranties',
    'dashboard.expiredWarranties': 'Expired Warranties',

    // Dealer Dashboard
    'dealer.welcome': 'Welcome, {name}!',
    'dealer.registerWarranty': 'Register Warranty',
    'dealer.recentWarranties': 'Recent Warranties',
    'dealer.noWarranties': 'No warranties registered yet',
    'dealer.validUntil': 'Valid until',

    // Dealers
    'dealers.title': 'Dealers',
    'dealers.subtitle': 'Manage and monitor all registered dealers',
    'dealers.newDealer': '+ New Dealer',
    'dealers.allDealers': 'All Dealers',
    'dealers.selectDealer': 'Select a dealer',
    'dealers.companyInfo': 'Company Information',
    'dealers.companyName': 'Company Name',
    'dealers.orgNumber': 'Organization Number',
    'dealers.address': 'Address',
    'dealers.contactPerson': 'Contact Person',
    'dealers.registered': 'Registered',
    'dealers.staff': 'Staff',
    'dealers.active': 'Active',
    'dealers.inactive': 'Inactive',
    'dealers.comments': 'Comments',
    'dealers.addComment': '+ Add Comment',
    'dealers.noComments': 'No comments yet',
    'dealers.warranties': 'Warranties',
    'dealers.invoices': 'Invoices',
    'dealers.contactInfo': 'Contact Information',
    'dealers.backToAdmin': '← Back to admin',
    'dealers.adminView': 'Admin View - Viewing {companyName} Dashboard',

    // Products
    'products.title': 'Products',
    'products.subtitle': 'Manage warranty products',
    'products.name': 'Product Name',
    'products.duration': 'Duration',
    'products.months': 'months',
    'products.description': 'Description',
    'products.pdfUrl': 'PDF URL',
    'products.createdAt': 'Created',
    'products.newProduct': 'New Product',
    'products.editProduct': 'Edit Product',
    'products.addProduct': '+ Add Product',

    // Warranties
    'warranties.title': 'Registered Warranties',
    'warranties.subtitle': 'All registered warranties in the system',
    'warranties.filterByDealer': 'Filter by dealer',
    'warranties.filterByStatus': 'Filter by status',
    'warranties.vehicleReg': 'Vehicle',
    'warranties.owner': 'Owner',
    'warranties.product': 'Product',
    'warranties.dealer': 'Dealer',
    'warranties.startDate': 'Start Date',
    'warranties.endDate': 'End Date',
    'warranties.mileage': 'Mileage',

    // Warranty Registration Modal
    'warranty.register': 'Register Warranty',
    'warranty.step': 'Step',
    'warranty.of': 'of',
    'warranty.vehicle': 'Vehicle',
    'warranty.product': 'Product',
    'warranty.owner': 'Vehicle Owner',
    'warranty.summary': 'Summary',

    // Step 1 - Vehicle
    'warranty.vehicle.title': 'Vehicle Information',
    'warranty.vehicle.subtitle': 'Enter registration number and mileage',
    'warranty.vehicle.regNumber': 'Registration Number',
    'warranty.vehicle.mileage': 'Mileage (km)',
    'warranty.vehicle.found': 'Vehicle Found!',
    'warranty.vehicle.foundSubtitle': 'Vehicle data has been successfully retrieved',
    'warranty.vehicle.make': 'Make & Model',
    'warranty.vehicle.year': 'Year',
    'warranty.vehicle.vin': 'VIN',
    'warranty.vehicle.fuelType': 'Fuel Type',
    'warranty.vehicle.notAvailable': 'Not available',
    'warranty.vehicle.instruction': 'Fill in both registration number and mileage, then click "Next" to retrieve vehicle data.',

    // Step 2 - Product
    'warranty.product.title': 'Select Warranty Product',
    'warranty.product.subtitle': 'For {make} {model}',
    'warranty.product.vehicleInfo': 'Vehicle Information',
    'warranty.product.vehicleInfoSubtitle': 'Information that affects warranty options',
    'warranty.product.vehicleAge': 'Vehicle Age',
    'warranty.product.years': 'years',
    'warranty.product.availableProducts': 'Available Warranty Products',
    'warranty.product.selectProduct': 'Select a warranty product...',
    'warranty.product.noProducts': 'No available products for this vehicle',
    'warranty.product.noProductsTitle': 'No Available Products',
    'warranty.product.noProductsDesc': 'Unfortunately, this vehicle does not meet the criteria for our warranty products.',
    'warranty.product.selected': 'Selected Warranty Product',
    'warranty.product.duration': 'Duration',
    'warranty.product.startDate': 'Start Date',
    'warranty.product.endDate': 'End Date',
    'warranty.product.viewDetails': 'View Product Details (PDF)',

    // Step 3 - Owner
    'warranty.owner.title': 'Vehicle Owner Information',
    'warranty.owner.subtitle': 'Fill in the owner\'s contact information for warranty registration',
    'warranty.owner.name': 'Name',
    'warranty.owner.nameFormat': 'First and last name',
    'warranty.owner.personnummer': 'Personal Number',
    'warranty.owner.personnummerFormat': 'Format: YYYYMMDD-XXXX',
    'warranty.owner.email': 'Email',
    'warranty.owner.emailFormat': 'name@example.com',
    'warranty.owner.phone': 'Phone Number',
    'warranty.owner.phoneFormat': 'Swedish mobile or phone number',
    'warranty.owner.firstname': 'First Name',
    'warranty.owner.lastname': 'Last Name',
    'warranty.owner.address': 'Address',
    'warranty.owner.postnummer': 'Postal Code',
    'warranty.owner.ort': 'City',
    'warranty.owner.lookup': 'Fetch Details',
    'warranty.owner.lookupLoading': 'Searching...',
    'warranty.owner.lookupSuccess': 'Details fetched',
    'warranty.owner.lookupError': 'Could not fetch details',
    'warranty.owner.autoFilled': 'Details fetched from personal number',
    'warranty.owner.manualEntry': 'Enter manually',
    'warranty.owner.privacyTitle': 'Personal Data Processing',
    'warranty.owner.privacySubtitle': 'Information according to GDPR',
    'warranty.owner.privacyText': 'Personal data is processed for warranty management according to GDPR. The customer will receive confirmation via email and SMS. For future integration with Smart365/Bilweb API, data can be automatically filled in.',
    'warranty.owner.validatedTitle': 'Information Validated',
    'warranty.owner.validatedSubtitle': 'All required fields are correctly filled',
    'warranty.owner.validatedText': 'All information is correctly filled in. You can proceed to the next step to review and complete the registration.',

    // Step 4 - Summary
    'warranty.summary.title': 'Summary',
    'warranty.summary.subtitle': 'Review all information before completing the warranty registration',
    'warranty.summary.header': 'Registration Summary',
    'warranty.summary.confirmations': 'Automatic Confirmations',
    'warranty.summary.confirmationsText': 'The customer will automatically receive confirmation via email and SMS when registration is complete.',
    'warranty.summary.complete': 'Complete Registration',
    'warranty.summary.completing': 'Registering...',
    'warranty.summary.productRequired': 'A warranty product must be selected to complete registration',
    'warranty.summary.success': 'Warranty Registered!',
    'warranty.summary.successText': 'The warranty registration has been completed successfully. The customer will receive confirmation via email and SMS.',
    'warranty.summary.nextSteps': 'Next steps:',
    'warranty.summary.confirmationSent': 'Confirmation is automatically sent to the customer',
    'warranty.summary.warrantyActive': 'The warranty is now active and can be seen in your dashboard',
    'warranty.summary.customerContact': 'The customer can contact you for any questions',
    'warranty.summary.autoClose': 'This window will close automatically in a few seconds...',

    // Form Validation
    'validation.required': 'This field is required',
    'validation.invalidEmail': 'Invalid email address',
    'validation.invalidPhone': 'Invalid phone number',
    'validation.invalidPersonnummer': 'Invalid personal number',
    'validation.nameRequired': 'Name is required',
    'validation.emailRequired': 'Email is required',
    'validation.phoneRequired': 'Phone number is required',
    'validation.personnummerRequired': 'Personal number is required',
    'validation.regNumberRequired': 'Please enter a registration number',
    'validation.mileageRequired': 'Please enter a valid mileage',

    // Settings
    'settings.title': 'Administrators',
    'settings.subtitle': 'Manage system administrators',
    'settings.administrators': 'Administrators',
    'settings.registerAdmin': 'Register New Administrator',
    'settings.adminName': 'Administrator Name',
    'settings.adminEmail': 'Email Address',
    'settings.adminPassword': 'Password',
    'settings.registerButton': 'Register Administrator',

    // Error Messages
    'error.vehicleLookupFailed': 'Could not retrieve vehicle data',
    'error.productsFetchFailed': 'Could not retrieve products',
    'error.registrationFailed': 'Registration failed',
    'error.generalError': 'An error occurred',
    'error.incompleteData': 'Incomplete data for registration',
    'error.loadingProducts': 'Loading available products...',

    // Status
    'status.active': 'active',
    'status.inactive': 'inactive',
    'status.expired': 'expired',
    'status.pending': 'pending',
    'status.loading': 'Loading...',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('sv'); // Default to Swedish

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'sv' ? 'en' : 'sv');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['sv']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};