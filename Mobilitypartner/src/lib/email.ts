import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const port = Number(process.env.EMAIL_SERVER_PORT) || 587;

  return nodemailer.createTransport({
    // host: process.env.EMAIL_SERVER_HOST,
    // port: port,
    // secure: port === 465, // true for 465, false for other ports
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    // tls: {
    //   // Do not fail on invalid certs (for Azure Communication Services)
    //   rejectUnauthorized: false,
    //   ciphers: 'SSLv3'
    // },
    // Enable debug output
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });
};

interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  contentType?: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

/**
 * Send an email using nodemailer
 */
export async function sendEmail({ to, subject, html, text, attachments, forceSend = true }: SendEmailParams & { forceSend?: boolean }) {
  // Check if email sending is enabled
  const emailEnabled = process.env.SEND_EMAIL === 'true' || forceSend;

  if (!emailEnabled) {
    console.log('Email sending is disabled. Email would have been sent to:', to);
    console.log('Subject:', subject);
    return { success: false, message: 'Email sending is disabled in environment variables' };
  }

  try {
    const transporter = createTransporter();

    // Verify SMTP connection configuration
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Mobility Partner'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_SERVER_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      html,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        path: att.path,
        content: att.content,
        contentType: att.contentType
      }))
    });

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send welcome email to new admin user
 */
export async function sendAdminWelcomeEmail(
  email: string,
  name: string,
  password: string
) {
  const subject = 'Välkommen till Mobility Partner - Admin-konto skapat';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0e321e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .credentials { background-color: white; padding: 15px; border-left: 4px solid #0e321e; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0e321e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Välkommen till Mobility Partner!</h1>
        </div>
        <div class="content">
          <p>Hej ${name},</p>

          <p>Ditt admin-konto har skapats framgångsrikt för Mobility Partner garantisystem.</p>

          <div class="credentials">
            <h3>Dina inloggningsuppgifter:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Lösenord:</strong> ${password}</p>
          </div>

          <p><strong>Viktigt:</strong> Vi rekommenderar starkt att du byter ditt lösenord efter första inloggningen av säkerhetsskäl.</p>

          <a href="${process.env.ADMIN_DOMAIN || 'http://localhost:3000'}/login" class="button">Logga in nu</a>

          <p>Om du har några frågor, tveka inte att kontakta supporten.</p>

          <p>Med vänliga hälsningar,<br>Mobility Partner Team</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email. Svara inte på detta meddelande.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html, forceSend: true });
}

/**
 * Send welcome email to new dealer user
 */
export async function sendDealerWelcomeEmail(
  email: string,
  name: string,
  password: string,
  companyName: string
) {
  const subject = `Välkommen till Mobility Partner - ${companyName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0e321e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .credentials { background-color: white; padding: 15px; border-left: 4px solid #0e321e; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0e321e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Välkommen till Mobility Partner!</h1>
        </div>
        <div class="content">
          <p>Hej ${name},</p>

          <p>Ditt återförsäljarkonto har skapats för ${companyName} i Mobility Partner garantisystem.</p>

          <div class="credentials">
            <h3>Dina inloggningsuppgifter:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Lösenord:</strong> ${password}</p>
          </div>

          <p><strong>Viktigt:</strong> Vi rekommenderar starkt att du byter ditt lösenord efter första inloggningen av säkerhetsskäl.</p>

          <p>Med ditt konto kan du:</p>
          <ul>
            <li>Registrera nya garantier för dina kunder</li>
            <li>Hantera och spåra aktiva garantier</li>
            <li>Se garantihistorik och rapporter</li>
            <li>Uppdatera företagsinformation</li>
          </ul>

          <a href="${process.env.DEALER_DOMAIN || 'http://localhost:3000'}/login" class="button">Logga in nu</a>

          <p>Om du har några frågor, tveka inte att kontakta supporten.</p>

          <p>Med vänliga hälsningar,<br>Mobility Partner Team</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email. Svara inte på detta meddelande.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html, forceSend: true });
}

/**
 * Send warranty registration confirmation email to customer
 */
export async function sendWarrantyConfirmationEmail(
  warrantyNumber: string,
  ownerEmail: string,
  ownerName: string,
  vehicleRegistrationNumber: string,
  vehicleMake: string,
  vehicleModel: string,
  vehicleMileage: number,
  productName: string,
  startDate: Date,
  endDate: Date,
  dealerCompanyName: string,
  pdfUrl?: string
) {
  const subject = 'Garantiregistrering bekräftad - Mobility Partner';

  // Prepare attachments if PDF URL is provided
  const attachments: EmailAttachment[] = [];
  if (pdfUrl) {
    try {
      // Convert URL path to filesystem path
      // pdfUrl can be:
      // - Old format: "/uploads/products/product-xxx.pdf"
      // - API format: "/api/uploads/products/product-xxx.pdf"
      // - New format: "/api/files/serve?type=products&file=product-xxx.pdf"
      let absolutePath = '';

      if (pdfUrl.includes('file=')) {
        // New format: extract filename from query parameter
        const match = pdfUrl.match(/file=([^&]+)/);
        const filename = match ? match[1] : '';
        absolutePath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);
      } else {
        // Old formats: extract path
        let relativePath = pdfUrl.startsWith('/') ? pdfUrl.substring(1) : pdfUrl;
        if (relativePath.startsWith('api/')) {
          relativePath = relativePath.substring(4);
        }
        absolutePath = path.join(process.cwd(), 'public', relativePath);
      }

      // Check if file exists on filesystem
      if (fs.existsSync(absolutePath)) {
        // Read file from filesystem
        const fileContent = fs.readFileSync(absolutePath);
        attachments.push({
          filename: `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_villkor.pdf`,
          content: fileContent,
          contentType: 'application/pdf'
        });
        console.log('PDF attachment added from filesystem:', absolutePath);
      } else {
        console.warn('PDF file not found at path:', absolutePath);
      }
    } catch (error) {
      console.error('Error reading PDF file for email attachment:', error);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .warranty-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; }
        .detail-value { color: #1f2937; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .success-badge { background-color: #D1FAE5; color: #065F46; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .contact-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Garanti Registrerad!</h1>
        </div>
        <div class="content">
          <p>Hej ${ownerName},</p>

          <div class="success-badge">Din garanti har registrerats framgångsrikt</div>

          <div class="warranty-details">
            <h3>Garantidetaljer:</h3>

            <div class="detail-row">
              <span class="detail-label">Garantinummer:</span>
              <span class="detail-value">${warrantyNumber}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Fordon:</span>
              <span class="detail-value">${vehicleMake} ${vehicleModel}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Mätarställning:</span>
              <span class="detail-value">${vehicleMileage.toLocaleString('sv-SE')} km</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Registreringsnummer:</span>
              <span class="detail-value">${vehicleRegistrationNumber}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Produkt:</span>
              <span class="detail-value">${productName}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Giltig från:</span>
              <span class="detail-value">${new Date(startDate).toLocaleDateString('sv-SE')}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Giltig till:</span>
              <span class="detail-value">${new Date(endDate).toLocaleDateString('sv-SE')}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Återförsäljare:</span>
              <span class="detail-value">${dealerCompanyName}</span>
            </div>
          </div>

          <p><strong>Viktigt att komma ihåg:</strong></p>
          <ul>
            <li>Spara detta email som bekräftelse på din garantiregistrering</li>
            <li>Vid garantiärenden, kontakta din återförsäljare: ${dealerCompanyName}</li>
            <li>Se till att alla serviceintervaller följs enligt tillverkarens rekommendationer</li>
            ${pdfUrl ? '<li>Garantivillkoren finns bifogade i detta email</li>' : ''}
          </ul>

          <p>Om du har några frågor angående din garanti, kontakta din återförsäljare.</p>

          <div class="contact-box">
            <p style="margin: 0; color: #92400e;"><strong>Vid skada, kontakta:</strong></p>
            <p style="margin: 10px 0 0 0; color: #92400e;">
              Mobilitypartner Norden AB<br>
              Telefon: 041-00000<br>
              E-post: <a href="mailto:support@mobilitypartner.se" style="color: #92400e;">support@mobilitypartner.se</a>
            </p>
          </div>

          <p>Med vänliga hälsningar,<br>${dealerCompanyName}<br>via Mobility Partner</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email. Svara inte på detta meddelande.</p>
          <p>För frågor, kontakta ${dealerCompanyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: ownerEmail, subject, html, attachments: attachments.length > 0 ? attachments : undefined });
}

/**
 * Send product creation notification email to admin
 */
export async function sendProductCreatedEmail(
  adminEmail: string,
  productName: string,
  productDetails: {
    durationMonths: number;
    premium: number;
    vehicleType?: string;
    maxAge?: number;
    maxKm?: number;
  }
) {
  const subject = `Ny produkt skapad: ${productName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366F1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .product-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ny Produkt Skapad</h1>
        </div>
        <div class="content">
          <p>En ny garantiprodukt har skapats i systemet:</p>

          <div class="product-details">
            <h3>${productName}</h3>

            <div class="detail-row">
              <strong>Löptid:</strong> ${productDetails.durationMonths} månader
            </div>

            <div class="detail-row">
              <strong>Premie:</strong> ${productDetails.premium} SEK
            </div>

            ${productDetails.vehicleType ? `
            <div class="detail-row">
              <strong>Fordonstyp:</strong> ${productDetails.vehicleType}
            </div>
            ` : ''}

            ${productDetails.maxAge ? `
            <div class="detail-row">
              <strong>Max ålder:</strong> ${productDetails.maxAge} år
            </div>
            ` : ''}

            ${productDetails.maxKm ? `
            <div class="detail-row">
              <strong>Max körsträcka:</strong> ${productDetails.maxKm.toLocaleString('sv-SE')} km
            </div>
            ` : ''}
          </div>

          <p>Produkten är nu tillgänglig för återförsäljare att använda vid garantiregistreringar.</p>

          <p>Med vänliga hälsningar,<br>Mobility Partner System</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email från Mobility Partner.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: adminEmail, subject, html });
}

/**
 * Send workshop submission notification email to admin
 */
export async function sendWorkshopSubmissionEmail(
  adminEmail: string,
  workshopData: {
    regNr: string;
    skadedatum: string;
    agarNamn: string;
    agarTelefon: string;
    agarEmail: string;
    malarstellningSkade: string;
    datumSenasteService: string;
    malarstellningSenasteService: string;
    serviceInfoSaknas: boolean;
    agarensBeskrivning: string;
    fordonetPaVerkstad: string;
    organisationsnummer: string;
    kontaktperson: string;
    kontaktTelefon: string;
    kontaktEmail: string;
    skadeorsak: string;
    ovrigtUnderlag: boolean;
  },
  attachments?: {
    uploadedImages: string[];
    uploadedDocs: string[];
  }
) {
  const subject = `Ny verkstadsinlämning - ${workshopData.regNr}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .section { background-color: white; padding: 20px; border-radius: 5px; margin: 15px 0; }
        .section-title { color: #1f2937; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #EF4444; padding-bottom: 10px; }
        .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; width: 250px; flex-shrink: 0; }
        .detail-value { color: #1f2937; }
        .checkbox-item { padding: 8px 0; }
        .checkbox-yes { color: #10B981; font-weight: bold; }
        .checkbox-no { color: #6b7280; }
        .alert-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .alert-text { color: #92400E; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .description-box { background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 15px 0; white-space: pre-wrap; }
        .files-list { list-style: none; padding: 0; }
        .files-list li { padding: 8px; background: #f3f4f6; margin: 5px 0; border-radius: 3px; }
        .files-list a { color: #2563eb; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔧 Ny Verkstadsinlämning</h1>
        </div>
        <div class="content">
          <p>En ny verkstadsinlämning har registrerats i systemet.</p>

          ${workshopData.serviceInfoSaknas ? `
          <div class="alert-box">
            <p class="alert-text">⚠️ OBSERVERA: Information om senaste service saknas</p>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Fordonsinformation</div>

            <div class="detail-row">
              <span class="detail-label">Registreringsnummer:</span>
              <span class="detail-value"><strong>${workshopData.regNr}</strong></span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Skadedatum:</span>
              <span class="detail-value">${new Date(workshopData.skadedatum).toLocaleDateString('sv-SE')}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Mätarställning vid skade:</span>
              <span class="detail-value">${workshopData.malarstellningSkade} km</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Ägarinformation</div>

            <div class="detail-row">
              <span class="detail-label">Namn:</span>
              <span class="detail-value">${workshopData.agarNamn}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Telefon:</span>
              <span class="detail-value">${workshopData.agarTelefon}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">E-post:</span>
              <span class="detail-value"><a href="mailto:${workshopData.agarEmail}">${workshopData.agarEmail}</a></span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Servicehistorik</div>

            ${workshopData.serviceInfoSaknas ? `
              <p style="color: #6b7280; font-style: italic;">Information om senaste service saknas</p>
            ` : `
              <div class="detail-row">
                <span class="detail-label">Datum senaste service:</span>
                <span class="detail-value">${new Date(workshopData.datumSenasteService).toLocaleDateString('sv-SE')}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Mätarställning vid service:</span>
                <span class="detail-value">${workshopData.malarstellningSenasteService} km</span>
              </div>
            `}
          </div>

          <div class="section">
            <div class="section-title">Ägarens beskrivning av skadan</div>
            <div class="description-box">${workshopData.agarensBeskrivning}</div>
          </div>

          <div class="section">
            <div class="section-title">Verkstadsinformation</div>

            <div class="detail-row">
              <span class="detail-label">Verkstad:</span>
              <span class="detail-value"><strong>${workshopData.fordonetPaVerkstad}</strong></span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Organisationsnummer:</span>
              <span class="detail-value">${workshopData.organisationsnummer}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Kontaktperson:</span>
              <span class="detail-value">${workshopData.kontaktperson}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Telefon:</span>
              <span class="detail-value">${workshopData.kontaktTelefon}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">E-post:</span>
              <span class="detail-value"><a href="mailto:${workshopData.kontaktEmail}">${workshopData.kontaktEmail}</a></span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Verkstadens diagnostisering/skadeorsak</div>
            <div class="description-box">${workshopData.skadeorsak}</div>
          </div>

          ${attachments && (attachments.uploadedImages.length > 0 || attachments.uploadedDocs.length > 0) ? `
          <div class="section">
            <div class="section-title">Bifogade filer</div>

            ${attachments.uploadedImages.length > 0 ? `
              <h4>Bilder (${attachments.uploadedImages.length})</h4>
              <ul class="files-list">
                ${attachments.uploadedImages.map(file => `
                  <li>📷 <a href="${process.env.ADMIN_DOMAIN || 'http://localhost:3000'}/api/files/serve?type=workshop-submissions&file=${file}" target="_blank">${file}</a></li>
                `).join('')}
              </ul>
            ` : ''}

            ${attachments.uploadedDocs.length > 0 ? `
              <h4>Dokument (${attachments.uploadedDocs.length})</h4>
              <ul class="files-list">
                ${attachments.uploadedDocs.map(file => `
                  <li>📄 <a href="${process.env.ADMIN_DOMAIN || 'http://localhost:3000'}/api/files/serve?type=workshop-submissions&file=${file}" target="_blank">${file}</a></li>
                `).join('')}
              </ul>
            ` : ''}

            <div class="checkbox-item">
              <span class="${workshopData.ovrigtUnderlag ? 'checkbox-yes' : 'checkbox-no'}">
                ${workshopData.ovrigtUnderlag ? '✓' : '✗'} Övrigt underlag bifogat
              </span>
            </div>
          </div>
          ` : ''}

          <p><strong>Nästa steg:</strong></p>
          <ul>
            <li>Granska inlämningen i admin-panelen</li>
            <li>Kontrollera om fordonet har en aktiv garanti</li>
            <li>Granska bifogade bilder och dokument</li>
            <li>Kontakta verkstaden vid behov: ${workshopData.kontaktTelefon} eller ${workshopData.kontaktEmail}</li>
          </ul>

          <p>Med vänliga hälsningar,<br>Mobility Partner System</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email från Mobility Partner.</p>
          <p>Inlämnad: ${new Date().toLocaleString('sv-SE')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: adminEmail, subject, html });
}

/**
 * Send partnership request notification email to admin
 */
export async function sendPartnershipRequestEmail(
  adminEmail: string,
  partnershipData: {
    companyName: string;
    orgNumber: string;
    phone: string;
    email: string;
  }
) {
  const subject = `Ny partnerskapsförfrågan - ${partnershipData.companyName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .section { background-color: white; padding: 20px; border-radius: 5px; margin: 15px 0; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; display: block; margin-bottom: 5px; }
        .detail-value { color: #1f2937; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .highlight { background-color: #EDE9FE; padding: 5px 10px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤝 Ny Partnerskapsförfrågan</h1>
        </div>
        <div class="content">
          <p>En ny partnerskapsförfrågan har mottagits från ett företag som är intresserat av att bli återförsäljare.</p>

          <div class="section">
            <h3>Företagsinformation</h3>

            <div class="detail-row">
              <span class="detail-label">Företagsnamn:</span>
              <span class="detail-value highlight"><strong>${partnershipData.companyName}</strong></span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Organisationsnummer:</span>
              <span class="detail-value">${partnershipData.orgNumber}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Telefon:</span>
              <span class="detail-value"><a href="tel:${partnershipData.phone}">${partnershipData.phone}</a></span>
            </div>

            <div class="detail-row">
              <span class="detail-label">E-post:</span>
              <span class="detail-value"><a href="mailto:${partnershipData.email}">${partnershipData.email}</a></span>
            </div>
          </div>

          <p><strong>Nästa steg:</strong></p>
          <ul>
            <li>Kontakta företaget via telefon eller e-post</li>
            <li>Verifiera företagets organisationsnummer</li>
            <li>Diskutera partnervillkor och krav</li>
            <li>Skapa återförsäljarkonto om godkänd</li>
          </ul>

          <p>Kontakta företaget snarast för att diskutera samarbetsmöjligheter.</p>

          <p>Med vänliga hälsningar,<br>Mobility Partner System</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email från Mobility Partner.</p>
          <p>Mottagen: ${new Date().toLocaleString('sv-SE')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: adminEmail, subject, html });
}

/**
 * Send invoice email to dealer
 */
export async function sendInvoiceEmail(
  dealerEmail: string,
  dealerCompanyName: string,
  invoiceData: {
    invoiceNumber: string;
    fortnoxInvoiceNumber: string;
    productName: string;
    make: string;
    model: string;
    amount: string;
    dueDate: string;
    invoiceDate: string;
  }
) {
  const subject = `Invoice ${invoiceData.invoiceNumber} - Warranty for ${invoiceData.productName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 650px;
          margin: 20px auto;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #264922ff 0%, #206b30ff 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 18px;
          color: #1f2937;
          margin-bottom: 20px;
        }
        .intro-text {
          color: #4b5563;
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .invoice-box {
          background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
          border-left: 4px solid #667eea;
          border-radius: 8px;
          padding: 25px;
          margin: 25px 0;
        }
        .invoice-header {
          font-size: 16px;
          color: #296135ff;
          font-weight: bold;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .invoice-details {
          background-color: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
        }
        .detail-value {
          color: #1f2937;
          font-weight: 500;
          text-align: right;
        }
        .amount-row {
          background-color: #fef3c7;
          margin: -20px -20px 0 -20px;
          padding: 20px;
          border-radius: 0 0 6px 6px;
        }
        .amount-row .detail-label {
          color: #92400e;
          font-size: 16px;
        }
        .amount-row .detail-value {
          color: #92400e;
          font-size: 20px;
          font-weight: bold;
        }
        .important-notice {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 4px;
        }
        .important-notice p {
          margin: 0;
          color: #92400e;
          font-weight: 500;
        }
        .info-section {
          margin: 25px 0;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 6px;
        }
        .info-section h3 {
          color: #374151;
          font-size: 16px;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .info-section ul {
          margin: 0;
          padding-left: 20px;
          color: #4b5563;
        }
        .info-section li {
          margin: 8px 0;
          line-height: 1.6;
        }
        .contact-info {
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
          padding: 15px 20px;
          margin: 25px 0;
          border-radius: 6px;
          text-align: center;
        }
        .contact-info p {
          margin: 5px 0;
          color: #0c4a6e;
        }
        .footer {
          background-color: #f9fafb;
          text-align: center;
          padding: 25px;
          color: #6b7280;
          font-size: 13px;
          border-radius: 0 0 8px 8px;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 5px 0;
        }
        .signature {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .signature p {
          margin: 5px 0;
          color: #4b5563;
        }
        .company-name {
          font-weight: bold;
          color: #667eea;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Invoice</h1>
          <p>Warranty Claim Invoice</p>
        </div>

        <div class="content">
          <div class="greeting">
            Dear ${dealerCompanyName},
          </div>

          <p class="intro-text">
            Thank you for your business. Please find the details of your invoice for the warranty claim below.
            This invoice has been generated in our Fortnox system and is now available for your review.
          </p>

          <div class="invoice-box">
            <div class="invoice-header">Invoice Details</div>

            <div class="invoice-details">
              <div class="detail-row">
                <span class="detail-label">Invoice Number:&nbsp;</span>
                <span class="detail-value">${invoiceData.invoiceNumber}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Fortnox Invoice Number:&nbsp;</span>
                <span class="detail-value">${invoiceData.fortnoxInvoiceNumber}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Invoice Date:&nbsp;</span>
                <span class="detail-value">${invoiceData.invoiceDate}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Due Date:&nbsp;</span>
                <span class="detail-value">${invoiceData.dueDate}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Product:&nbsp;</span>
                <span class="detail-value">${invoiceData.productName}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Vehicle:&nbsp;</span>
                <span class="detail-value">${invoiceData.make} ${invoiceData.model}</span>
              </div>

              <div class="amount-row">
                <div class="detail-row">
                  <span class="detail-label">Total Amount:&nbsp;</span>
                  <span class="detail-value">${invoiceData.amount} SEK</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h3>Important Information</h3>
            <ul>
              <li>This invoice has been created in Fortnox and can be accessed through your Fortnox account</li>
              <li>Please keep this email as a reference for your records</li>
              <li>Payment should be made according to the payment terms on the invoice</li>
              <li>For any questions regarding this invoice, please contact us using the information below</li>
            </ul>
          </div>

          <div class="contact-info">
            <p><strong>Need Help?</strong></p>
            <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
          </div>

          <div class="signature">
            <p>Best regards,</p>
            <p class="company-name">Mobility Partner</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Warranty Solutions Team</p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Mobility Partner</strong></p>
          <p>This is an automated email. Please do not reply to this message.</p>
          <p style="margin-top: 10px;">© ${new Date().getFullYear()} Mobility Partner. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: dealerEmail, subject, html, forceSend: true });
}

/**
 * Send warranty cancellation notification email
 */
export async function sendWarrantyCancellationEmail(
  recipientEmail: string,
  recipientName: string,
  recipientType: 'customer' | 'dealer',
  warrantyData: {
    vehicleRegistrationNumber: string;
    vehicleMake: string;
    vehicleModel: string;
    productName: string;
    cancellationDate: string;
    originalEndDate: string;
    dealerCompanyName?: string;
    ownerName?: string;
  }
) {
  const subject = `Garantiavbrott - ${warrantyData.vehicleRegistrationNumber}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .warranty-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; }
        .detail-value { color: #1f2937; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .alert-badge { background-color: #FEE2E2; color: #991B1B; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .important-notice { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Garantiavbrott</h1>
        </div>
        <div class="content">
          <p>Hej ${recipientName},</p>

          <div class="alert-badge">Garanti avbruten</div>

          <p>${recipientType === 'customer'
            ? 'Din garanti har avbrutits från systemet. Nedan finns detaljerad information om den avbrutna garantin.'
            : 'En garanti som är registrerad av din återförsäljare har avbrutits från systemet. Nedan finns detaljerad information.'
          }</p>

          <div class="warranty-details">
            <h3>Garantidetaljer:</h3>

            <div class="detail-row">
              <span class="detail-label">Fordon:</span>
              <span class="detail-value">${warrantyData.vehicleMake} ${warrantyData.vehicleModel}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Registreringsnummer:</span>
              <span class="detail-value">${warrantyData.vehicleRegistrationNumber}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Produkt:</span>
              <span class="detail-value">${warrantyData.productName}</span>
            </div>

            ${warrantyData.ownerName && recipientType === 'dealer' ? `
            <div class="detail-row">
              <span class="detail-label">Ägare:</span>
              <span class="detail-value">${warrantyData.ownerName}</span>
            </div>
            ` : ''}

            ${warrantyData.dealerCompanyName && recipientType === 'customer' ? `
            <div class="detail-row">
              <span class="detail-label">Återförsäljare:</span>
              <span class="detail-value">${warrantyData.dealerCompanyName}</span>
            </div>
            ` : ''}

            <div class="detail-row">
              <span class="detail-label">Ursprungligt slutdatum:</span>
              <span class="detail-value">${new Date(warrantyData.originalEndDate).toLocaleDateString('sv-SE')}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Avbrutit datum:</span>
              <span class="detail-value">${new Date(warrantyData.cancellationDate).toLocaleDateString('sv-SE')}</span>
            </div>
          </div>

          <div class="important-notice">
            <p style="margin: 0; color: #92400e;"><strong>Viktigt:</strong></p>
            <ul style="margin: 10px 0 0 0; color: #92400e;">
              <li>Denna garanti är nu avbruten och ger inte längre någon täckning</li>
              <li>Alla aktiva ärenden eller anspråk kan påverkas av detta avbrott</li>
              ${recipientType === 'customer'
                ? `<li>Kontakta ${warrantyData.dealerCompanyName} om du har frågor om avbrottet</li>`
                : '<li>Kontakta administratören om du har frågor om avbrottet</li>'
              }
            </ul>
          </div>

          <p>${recipientType === 'customer'
            ? 'Om du har några frågor angående detta avbrott, vänligen kontakta din återförsäljare.'
            : 'Detta meddelande skickas för att hålla dig informerad om statusändringar i garantier som är kopplade till din återförsäljare.'
          }</p>

          <p>Med vänliga hälsningar,<br>Mobility Partner Team</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email. Svara inte på detta meddelande.</p>
          <p>Skickat: ${new Date().toLocaleString('sv-SE')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: recipientEmail, subject, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
  userRole?: string
) {
  // Determine the base URL based on user role
  let baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (userRole === 'ADMIN') {
    baseUrl = process.env.ADMIN_DOMAIN || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  } else if (userRole === 'DEALER' || userRole === 'DEALER_STAFF') {
    baseUrl = process.env.DEALER_DOMAIN || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  const subject = 'Återställ ditt lösenord - Mobility Partner';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0e321e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0e321e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .token-box { background-color: #fff; padding: 15px; border: 2px dashed #d1d5db; margin: 20px 0; border-radius: 5px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Återställ lösenord</h1>
        </div>
        <div class="content">
          <p>Hej ${name},</p>

          <p>Vi har mottagit en begäran om att återställa lösenordet för ditt konto på Mobility Partner.</p>

          <p>Klicka på knappen nedan för att återställa ditt lösenord:</p>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Återställ lösenord</a>
          </div>

          <p>Om knappen inte fungerar, kopiera och klistra in följande länk i din webbläsare:</p>

          <div class="token-box">
            <a href="${resetUrl}" style="color: #0e321e; word-break: break-all;">${resetUrl}</a>
          </div>

          <div class="warning">
            <p style="margin: 0; color: #92400e;"><strong>Viktigt:</strong></p>
            <ul style="margin: 10px 0 0 0; color: #92400e;">
              <li>Denna länk är giltig i 1 timme</li>
              <li>Om du inte begärde en lösenordsåterställning, ignorera detta meddelande</li>
              <li>Ditt nuvarande lösenord förblir oförändrat tills du skapar ett nytt</li>
            </ul>
          </div>

          <p>Om du inte begärde denna återställning av lösenord, vänligen ignorera detta e-postmeddelande och ditt lösenord kommer att förbli oförändrat.</p>

          <p>Med vänliga hälsningar,<br>Mobility Partner Team</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email. Svara inte på detta meddelande.</p>
          <p>Skickat: ${new Date().toLocaleString('sv-SE')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html, forceSend: true});
}

/**
 * Send claim submission confirmation email to customer
 */
export async function sendClaimSubmissionEmailToCustomer(
  customerEmail: string,
  customerName: string,
  claimData: {
    vehicleRegistrationNumber: string;
    vehicleMake: string;
    vehicleModel: string;
    productName: string;
    skadedatum: Date;
    claimId: number;
  }
) {
  const subject = 'Skadeanmälan mottagen - Mobility Partner';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0e321e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .claim-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; }
        .detail-value { color: #1f2937; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .success-badge { background-color: #D1FAE5; color: #065F46; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .contact-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Skadeanmälan Mottagen</h1>
        </div>
        <div class="content">
          <p>Hej ${customerName},</p>

          <div class="success-badge">Din skadeanmälan har tagits emot</div>

          <p>Vi har mottagit din skadeanmälan och kommer att behandla den snarast möjligt.</p>

          <div class="claim-details">
            <h3>Ärendedetaljer:</h3>

            <div class="detail-row">
              <span class="detail-label">Ärendenummer:</span>
              <span class="detail-value">#${claimData.claimId}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Fordon:</span>
              <span class="detail-value">${claimData.vehicleMake} ${claimData.vehicleModel}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Registreringsnummer:</span>
              <span class="detail-value">${claimData.vehicleRegistrationNumber}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Produkt:</span>
              <span class="detail-value">${claimData.productName}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Skadedatum:</span>
              <span class="detail-value">${new Date(claimData.skadedatum).toLocaleDateString('sv-SE')}</span>
            </div>
          </div>

          <div class="contact-box">
            <p style="margin: 0; color: #92400e;"><strong>Vad händer nu?</strong></p>
            <p style="margin: 10px 0 0 0; color: #92400e;">
              Vi kommer att granska din skadeanmälan och kontakta dig inom kort för vidare hantering.
            </p>
          </div>

          <p>Om du har några frågor, kontakta oss på:</p>
          <p>E-post: <a href="mailto:support@mobilitypartner.se">support@mobilitypartner.se</a></p>

          <p>Med vänliga hälsningar,<br>Mobility Partner Team</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email. Svara inte på detta meddelande.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: customerEmail, subject, html, forceSend: true });
}

/**
 * Send claim submission notification email to support
 */
export async function sendClaimSubmissionEmailToSupport(
  claimData: {
    claimId: number;
    customerFirstname: string;
    customerLastname: string;
    customerEmail: string;
    customerPhone: string;
    customerPersonnummer: string;
    customerAddress?: string;
    customerPostnummer: string;
    customerOrt: string;
    vehicleRegistrationNumber: string;
    vehicleMake: string;
    vehicleModel: string;
    productName: string;
    dealerName: string;
    skadedatum: Date;
    mileage?: string;
    damageDescription?: string;
  }
) {
  const supportEmail = 'support@mobilitypartner.se';
  const subject = `Ny skadeanmälan - ${claimData.vehicleRegistrationNumber} - #${claimData.claimId}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .section { background-color: white; padding: 20px; border-radius: 5px; margin: 15px 0; }
        .section-title { color: #1f2937; font-size: 16px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #0e321e; padding-bottom: 10px; }
        .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; width: 200px; flex-shrink: 0; }
        .detail-value { color: #1f2937; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .description-box { background-color: #FEF3C7; padding: 15px; border-radius: 5px; margin: 15px 0; white-space: pre-wrap; }
        .alert-badge { background-color: #FEE2E2; color: #991B1B; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 10px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ny Skadeanmälan</h1>
        </div>
        <div class="content">
          <div class="alert-badge">Ärendenummer: #${claimData.claimId}</div>

          <div class="section">
            <div class="section-title">Kundinformation</div>

            <div class="detail-row">
              <span class="detail-label">Namn:</span>
              <span class="detail-value">${claimData.customerFirstname} ${claimData.customerLastname}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Personnummer:</span>
              <span class="detail-value">${claimData.customerPersonnummer}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Telefon:</span>
              <span class="detail-value">${claimData.customerPhone}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">E-post:</span>
              <span class="detail-value"><a href="mailto:${claimData.customerEmail}">${claimData.customerEmail}</a></span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Adress:</span>
              <span class="detail-value">${claimData.customerAddress || '-'}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Postnummer & Ort:</span>
              <span class="detail-value">${claimData.customerPostnummer} ${claimData.customerOrt}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Fordonsinformation</div>

            <div class="detail-row">
              <span class="detail-label">Registreringsnummer:</span>
              <span class="detail-value"><strong>${claimData.vehicleRegistrationNumber}</strong></span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Fordon:</span>
              <span class="detail-value">${claimData.vehicleMake} ${claimData.vehicleModel}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Mätarställning:</span>
              <span class="detail-value">${claimData.mileage ? claimData.mileage + ' km' : '-'}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Skadedatum:</span>
              <span class="detail-value">${new Date(claimData.skadedatum).toLocaleDateString('sv-SE')}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Garantiinformation</div>

            <div class="detail-row">
              <span class="detail-label">Produkt:</span>
              <span class="detail-value">${claimData.productName}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">Återförsäljare:</span>
              <span class="detail-value">${claimData.dealerName}</span>
            </div>
          </div>

          ${claimData.damageDescription ? `
          <div class="section">
            <div class="section-title">Skadebeskrivning</div>
            <div class="description-box">${claimData.damageDescription}</div>
          </div>
          ` : ''}

          <p><strong>Åtgärd krävs:</strong> Granska skadeanmälan i admin-panelen och kontakta kunden.</p>

          <p>Med vänliga hälsningar,<br>Mobility Partner System</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email från Mobility Partner.</p>
          <p>Mottagen: ${new Date().toLocaleString('sv-SE')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: supportEmail, subject, html, forceSend: true });
}

/**
 * Send password change notification email to dealer staff
 */
export async function sendPasswordChangeEmail(
  email: string,
  name: string,
  newPassword: string,
  companyName: string
) {
  const subject = 'Ditt lösenord har ändrats - Mobility Partner';
  const loginUrl = process.env.DEALER_DOMAIN || 'https://dealer.mobilitypartner.se';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0e321e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
        .credentials { background-color: white; padding: 15px; border-left: 4px solid #0e321e; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0e321e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .alert-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Lösenord Ändrat</h1>
        </div>
        <div class="content">
          <p>Hej ${name},</p>

          <p>Ditt lösenord för ${companyName} kontot har ändrats av en administratör.</p>

          <div class="credentials">
            <h3>Dina nya inloggningsuppgifter:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Nytt lösenord:</strong> ${newPassword}</p>
          </div>

          <div class="alert-box">
            <p style="margin: 0; color: #92400e;"><strong>Viktigt:</strong></p>
            <ul style="margin: 10px 0 0 0; color: #92400e;">
              <li>Vi rekommenderar starkt att du byter ditt lösenord efter första inloggningen</li>
              <li>Om du inte begärde denna ändring, kontakta din administratör omedelbart</li>
            </ul>
          </div>

          <a href="${loginUrl}/login" class="button">Logga in nu</a>

          <p>Om du har några frågor, kontakta din administratör.</p>

          <p>Med vänliga hälsningar,<br>Mobility Partner Team</p>
        </div>
        <div class="footer">
          <p>Detta är ett automatiskt email. Svara inte på detta meddelande.</p>
          <p>Skickat: ${new Date().toLocaleString('sv-SE')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html, forceSend: true });
}
