/**
 * HelloSMS.se Integration
 *
 * This module provides SMS sending functionality using HelloSMS.se API
 * Documentation: https://docs.hellosms.se/reference/endpoints/send-sms/
 */

interface SMSConfig {
  apiUrl: string;
  apiToken: string;
  from?: string;
}

interface SendSMSParams {
  to: string | string[];
  message: string;
  from?: string;
  testMode?: boolean;
}

interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Get SMS configuration from environment variables
 */
const getSMSConfig = (): SMSConfig => {
  const apiUrl = process.env.HELLOSMS_API_URL || 'https://api.hellosms.se/api/v1/sms/send';
  const apiUserName = process.env.HELLOSMS_API_NAME;
  const apiPass = process.env.HELLOSMS_API_PASS;
  const apiToken = Buffer.from(`${apiUserName}:${apiPass}`).toString('base64');
  const from = process.env.HELLOSMS_FROM || 'MobilityPartner';

  if (!apiToken) {
    console.warn('HELLOSMS_API_TOKEN environment variable is not set. SMS functionality will be disabled.');
  }

  return {
    apiUrl,
    apiToken: apiToken || '',
    from
  };
};

/**
 * Send SMS using HelloSMS.se API
 *
 * @param params - SMS sending parameters
 * @returns Promise with SMS response
 */
export async function sendSMS(params: SendSMSParams): Promise<SMSResponse> {
  // Check if SMS sending is enabled
  const smsEnabled = process.env.SEND_SMS === 'true';

  if (!smsEnabled) {
    console.log('SMS sending is disabled. SMS would have been sent to:', params.to);
    console.log('Message:', params.message);
    return {
      success: false,
      message: 'SMS sending is disabled in environment variables'
    };
  }

  const config = getSMSConfig();

  // If API token is not configured, log and return success (development mode)
  if (!config.apiToken) {
    console.log('[SMS - DEV MODE]', {
      to: params.to,
      from: params.from || config.from,
      message: params.message
    });
    return {
      success: true,
      message: 'SMS logged (development mode - no API token configured)'
    };
  }

  try {
    // Normalize phone numbers to array
    const recipients = Array.isArray(params.to) ? params.to : [params.to];

    // Prepare request payload
    const payload = {
      from: params.from || config.from,
      to: recipients,
      message: params.message,
      // test: params.testMode || false
      // test: true
    };

    // Make API request
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${config.apiToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HelloSMS API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: 'SMS sent successfully'
    };

  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send welcome SMS to new dealer
 */
export async function sendDealerWelcomeSMS(
  phone: string,
  companyName: string,
  email: string,
  password: string
): Promise<SMSResponse> {
  const message = `Välkommen till Mobilitypartner!\nDitt konto har skapats. E-mail ${email}, lösenord: ${password}\nLogga in på https://dealer.mobilitypartner.se/login`;

  return sendSMS({
    to: phone,
    message
  });
}

/**
 * Send warranty registration confirmation SMS to customer
 */
export async function sendWarrantyConfirmationSMS(
  phone: string,
  ownerName: string,
  vehicleReg: string,
  productName: string,
  endDate: Date,
  dealerName: string
): Promise<SMSResponse> {
  const formattedEndDate = new Date(endDate).toLocaleDateString('sv-SE');
  const message = `Hej ${ownerName}! Din garanti har registrerats: ${vehicleReg} – ${productName}, Giltig till ${formattedEndDate}. Gör din skadeanmälan på www.mobilitypartner.se`;

  return sendSMS({
    to: phone,
    message
  });
}

/**
 * Send welcome SMS to new admin
 */
export async function sendAdminWelcomeSMS(
  phone: string,
  name: string,
  email: string,
  password: string
): Promise<SMSResponse> {
  const message = `Välkommen ${name}! Ditt admin-konto har skapats. Email: ${email}, Lösenord: ${password}. Logga in på: [URL]`;

  return sendSMS({
    to: phone,
    message
  });
}
