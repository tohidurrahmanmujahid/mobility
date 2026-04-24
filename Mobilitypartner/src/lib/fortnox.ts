/**
 * Fortnox API Integration Service
 *
 * This service handles all interactions with the Fortnox API including:
 * - OAuth 2.0 authentication flow
 * - Customer management
 * - Invoice creation and management
 * - Token refresh and management
 *
 * Documentation: https://developer.fortnox.se
 */

import { PrismaClient } from '@prisma/client';
import { sendInvoiceEmail } from './email';

const prisma = new PrismaClient();

// Fortnox API base URLs
const FORTNOX_AUTH_URL = 'https://apps.fortnox.se/oauth-v1';
const FORTNOX_API_URL = 'https://api.fortnox.se/3';

// Types
export interface FortnoxCustomer {
  CustomerNumber?: string;
  Name: string;
  OrganisationNumber?: string;
  Email?: string;
  Phone?: string;
  Address1?: string;
  ZipCode?: string;
  City?: string;
}

export interface FortnoxInvoiceRow {
  ArticleNumber?: string;
  Description: string;
  Price: number;
  VAT?: number;
  Quantity?: number;
  DeliveredQuantity?: number;
  AccountNumber?: number;
}

export interface FortnoxInvoice {
  CustomerNumber: string;
  InvoiceDate?: string;
  DueDate?: string;
  InvoiceRows: FortnoxInvoiceRow[];
  Comments?: string;
  VATIncluded?: boolean;
  YourReference?: string;
  EmailInformation?: {
    EmailAddressTo?: string;
    EmailSubject?: string;
    EmailBody?: string;
    EmailAddressFrom?: string;
  };
}

export interface FortnoxAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export class FortnoxService {
  /**
   * Generate OAuth authorization URL
   */
  static async getAuthorizationUrl(state?: string): Promise<string> {
    const settings = await prisma.fortnoxSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings) {
      throw new Error('Fortnox settings not configured');
    }

    const params = new URLSearchParams({
      client_id: settings.clientId,
      redirect_uri: settings.redirectUri,
      scope: settings.scopes,
      state: state || Math.random().toString(36).substring(7),
      response_type: 'code',
    });
    console.log('Generated Fortnox authorization URL with params:', `${FORTNOX_AUTH_URL}/auth?${params.toString()}`);
    return `${FORTNOX_AUTH_URL}/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForToken(code: string): Promise<FortnoxAuthTokens> {
    const settings = await prisma.fortnoxSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings) {
      throw new Error('Fortnox settings not configured');
    }

    // Create Basic Auth header
    const credentials = Buffer.from(`${settings.clientId}:${settings.clientSecret}`).toString('base64');

    const response = await fetch(`${FORTNOX_AUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: settings.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const tokens: FortnoxAuthTokens = await response.json();

    console.log('=== Fortnox Token Received ===');
    console.log('Scope:', tokens.scope);
    console.log('Expires in:', tokens.expires_in);
    console.log('Token type:', tokens.token_type);

    // Save tokens to database
    await this.saveTokens(tokens);

    return tokens;
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(): Promise<FortnoxAuthTokens> {
    const settings = await prisma.fortnoxSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings || !settings.refreshToken) {
      throw new Error('No refresh token available');
    }

    const credentials = Buffer.from(`${settings.clientId}:${settings.clientSecret}`).toString('base64');

    const response = await fetch(`${FORTNOX_AUTH_URL}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: settings.refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const tokens: FortnoxAuthTokens = await response.json();

    // Update tokens in database
    await this.saveTokens(tokens);

    return tokens;
  }

  /**
   * Save tokens to database
   */
  private static async saveTokens(tokens: FortnoxAuthTokens): Promise<void> {
    const settings = await prisma.fortnoxSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings) {
      throw new Error('Fortnox settings not found');
    }

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    await prisma.fortnoxSettings.update({
      where: { id: settings.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: expiryDate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get valid access token (refreshes if expired)
   */
  static async getValidAccessToken(): Promise<string> {
    const settings = await prisma.fortnoxSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings || !settings.accessToken) {
      throw new Error('Fortnox not authenticated. Please complete OAuth flow.');
    }

    // Check if token is expired or will expire in next 5 minutes
    const now = new Date();
    const expiryBuffer = new Date(now.getTime() + 5 * 60000); // 5 minutes buffer

    if (settings.tokenExpiry && settings.tokenExpiry <= expiryBuffer) {
      // Token expired or about to expire, refresh it
      const tokens = await this.refreshAccessToken();
      return tokens.access_token;
    }

    return settings.accessToken;
  }

  /**
   * Make authenticated API request to Fortnox
   */
  private static async apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const accessToken = await this.getValidAccessToken();

    console.log(`[Fortnox API] ${method} ${endpoint}`);

    const headers: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${FORTNOX_API_URL}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Fortnox API] Error ${response.status} on ${method} ${endpoint}:`, error);
      throw new Error(`Fortnox API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  /**
   * Create or update customer in Fortnox
   */
  static async createOrUpdateCustomer(
    dealerId: number,
    customerData: FortnoxCustomer
  ): Promise<{ CustomerNumber: string }> {
    // Check if customer mapping already exists in our DB
    const existingMapping = await prisma.fortnoxCustomerMapping.findUnique({
      where: { dealerId },
    });

    if (existingMapping) {
      // We already have a mapping, try to update but don't fail if no write permission
      try {
        const response = await this.apiRequest<{ Customer: { CustomerNumber: string } }>(
          `/customers/${existingMapping.fortnoxCustomerId}`,
          'PUT',
          { Customer: customerData }
        );
        await prisma.fortnoxCustomerMapping.update({
          where: { dealerId },
          data: { lastSyncAt: new Date() },
        });
        return { CustomerNumber: response.Customer.CustomerNumber };
      } catch (error) {
        console.warn('Could not update customer in Fortnox, using existing mapping:', (error as Error).message);
        return { CustomerNumber: existingMapping.fortnoxCustomerId };
      }
    }

    // No mapping exists - try to find customer by org number in Fortnox
    if (customerData.OrganisationNumber) {
      try {
        const searchResult = await this.apiRequest<{ Customers: { CustomerNumber: string }[] }>(
          `/customers?organisationnumber=${encodeURIComponent(customerData.OrganisationNumber)}`
        );
        if (searchResult.Customers && searchResult.Customers.length > 0) {
          const fortnoxCustomerId = searchResult.Customers[0].CustomerNumber;
          console.log(`Found existing Fortnox customer ${fortnoxCustomerId} for org ${customerData.OrganisationNumber}`);
          // Save mapping
          await prisma.fortnoxCustomerMapping.create({
            data: {
              dealerId,
              fortnoxCustomerId,
              lastSyncAt: new Date(),
            },
          });
          return { CustomerNumber: fortnoxCustomerId };
        }
      } catch (error) {
        console.warn('Could not search customers in Fortnox:', (error as Error).message);
      }
    }

    // Try to create new customer
    try {
      const response = await this.apiRequest<{ Customer: { CustomerNumber: string } }>(
        '/customers',
        'POST',
        { Customer: customerData }
      );

      // Create mapping
      await prisma.fortnoxCustomerMapping.create({
        data: {
          dealerId,
          fortnoxCustomerId: response.Customer.CustomerNumber,
          lastSyncAt: new Date(),
        },
      });

      return { CustomerNumber: response.Customer.CustomerNumber };
    } catch (error) {
      console.error('Could not create customer in Fortnox:', (error as Error).message);
      throw new Error(`Cannot create customer in Fortnox. Please create the customer "${customerData.Name}" (Org: ${customerData.OrganisationNumber}) manually in Fortnox first, then retry.`);
    }
  }

  /**
   * Get customer from Fortnox
   */
  static async getCustomer(customerNumber: string): Promise<any> {
    return await this.apiRequest(`/customers/${customerNumber}`);
  }

  /**
   * Create invoice in Fortnox
   */
  static async createInvoice(invoiceData: FortnoxInvoice): Promise<any> {
    const response = await this.apiRequest<{ Invoice: any }>(
      '/invoices',
      'POST',
      { Invoice: invoiceData }
    );

    return response.Invoice;
  }

  /**
   * Get invoice from Fortnox
   */
  static async getInvoice(invoiceNumber: string): Promise<any> {
    return await this.apiRequest(`/invoices/${invoiceNumber}`);
  }

  /**
   * Send invoice by email
   */
  static async sendInvoice(invoiceNumber: string): Promise<any> {
    return await this.apiRequest(
      `/invoices/${invoiceNumber}/email`,
      'GET'
    );
  }

  /**
   * Sync invoice from local database to Fortnox
   */
  static async syncInvoiceToFortnox(invoiceId: number, make?: string, model?: string): Promise<void> {
    // Get invoice with relations
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        dealer: {
          include: {
            staff: true,
          },
        },
        warranty: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    // Ensure customer exists in Fortnox
    const customerData: FortnoxCustomer = {
      Name: invoice.dealer.companyName,
      OrganisationNumber: invoice.dealer.orgNumber,
      Address1: invoice.dealer.address || undefined,
      ZipCode: invoice.dealer.postalCode || undefined,
      City: invoice.dealer.city || undefined,
      Email: invoice.dealer.staff?.[0]?.email || undefined,
    };

    const customer = await this.createOrUpdateCustomer(invoice.dealerId, customerData);
    const subject = `Invoice ${invoice.invoiceNumber} - Warranty for ${invoice.warranty.product.name}`;
    const dealerEmail = invoice.dealer.staff?.[0]?.email;

    const emailBody = ` Dear ${invoice.dealer.companyName},
        Please find attached the invoice ${invoice.invoiceNumber} for the warranty of the product ${invoice.warranty.product.name}.`;
    // Create invoice in Fortnox
    const fortnoxInvoiceData: FortnoxInvoice = {
      CustomerNumber: customer.CustomerNumber,
      InvoiceDate: invoice.createdAt.toISOString().split('T')[0],
      DueDate: invoice.dueDate.toISOString().split('T')[0],
      VATIncluded: false,
      YourReference: invoice.dealer.companyName,
      Comments: `Warranty Invoice for ${invoice.warranty.product.name} & Invoice Number: ${invoice.invoiceNumber}`,
      InvoiceRows: (() => {
        const product = invoice.warranty.product;
        const totalAmount = parseFloat(invoice.amount.toString());
        const insuranceAmount = parseFloat((product.insuranceAmount || 0).toString());
        // Warranty incl VAT = total - insurance
        const warrantyInclVat = totalAmount - insuranceAmount;
        // Warranty ex VAT (Fortnox adds VAT on top, so send ex-VAT price)
        const warrantyExVat = Math.round((warrantyInclVat / 1.25) * 100) / 100;
        const rows: any[] = [];

        // Row 1: Insurance portion (Account 3004, VAT 0%)
        if (insuranceAmount > 0) {
          rows.push({
            Description: `Varav kompletterande försäkring för ekonomisk förlust vid infriande av garantin`,
            Price: insuranceAmount,
            DeliveredQuantity: 1,
            AccountNumber: 3004,
            VAT: 0
          });
        }

        // Row 2: Warranty portion ex VAT (Account 3001, VAT 25% added by Fortnox)
        rows.push({
          Description: `Garanti ${product.name} - ${make} ${model}`,
          Price: warrantyExVat > 0 ? warrantyExVat : totalAmount,
          DeliveredQuantity: 1,
          AccountNumber: 3001,
          VAT: 25
        });

        return rows;
      })(),
      EmailInformation: {
        EmailAddressTo: dealerEmail,          // optional: override customer email
        EmailSubject: subject, // {no} -> document number, {name} -> customer
        EmailBody: emailBody,
        EmailAddressFrom: "noreply@mobilitypartner.se"
        // other fields supported: EmailInvoice (specific e-mail), EmailInvoiceBCC, ...
      }
    };

    const fortnoxInvoice = await this.createInvoice(fortnoxInvoiceData);

    // Send invoice to dealer by email using our system
    if (dealerEmail) {
      try {

        // await this.sendInvoice(fortnoxInvoice.DocumentNumber);

        console.log(`Invoice ${fortnoxInvoice.DocumentNumber} sent to dealer via email: ${dealerEmail}`);
      } catch (error) {
        console.error(`Failed to send invoice ${fortnoxInvoice.DocumentNumber} by email:`, error);
        // Continue even if sending fails - invoice is still created
      }
    } else {
      console.warn(`No email address found for dealer ${invoice.dealer.companyName}. Invoice created but not sent.`);
    }

    // Update local invoice with Fortnox ID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        fortnoxId: fortnoxInvoice.DocumentNumber,
        fortnoxStatus: 'SYNCED',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Check if Fortnox is configured and authenticated
   */
  static async isConfigured(): Promise<boolean> {
    const settings = await prisma.fortnoxSettings.findFirst({
      where: { isActive: true },
    });

    return !!(settings && settings.accessToken);
  }

  /**
   * Get connection status
   */
  static async getConnectionStatus(): Promise<{
    isConfigured: boolean;
    isAuthenticated: boolean;
    lastSync?: Date;
  }> {
    const settings = await prisma.fortnoxSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings) {
      return {
        isConfigured: false,
        isAuthenticated: false,
      };
    }

    return {
      isConfigured: true,
      isAuthenticated: !!(settings.accessToken && settings.tokenExpiry && settings.tokenExpiry > new Date()),
      lastSync: settings.lastSyncAt || undefined,
    };
  }
}

export default FortnoxService;
