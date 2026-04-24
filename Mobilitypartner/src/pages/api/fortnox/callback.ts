/**
 * Fortnox OAuth Callback Endpoint
 *
 * GET /api/fortnox/callback?code=XXX&state=YYY
 *
 * This endpoint is called by Fortnox after user authorizes the app.
 * It exchanges the authorization code for access and refresh tokens.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { handleApiError, validateMethod } from '@/lib/api-helpers';
import FortnoxService from '@/lib/fortnox';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate method
    console.log(req.query)
    if (!validateMethod(req, res, ['GET'])) return;

    const { code, state, error } = req.query;
    console.log('Fortnox OAuth callback received:', { code, state, error });
    // Check for OAuth error
    if (error) {
      return res.status(400).json({
        message: `OAuth error: ${error}`,
      });
    }

    // Validate code parameter
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        message: 'Missing or invalid authorization code',
      });
    }

    // Exchange code for tokens
    const tokens = await FortnoxService.exchangeCodeForToken(code);

    // Redirect to settings page with success message
    // In a production app, you might want to validate the state parameter as well
    return res.redirect('/admin/settings/fortnox?success=true');
  } catch (error) {
    console.error('Fortnox OAuth callback error:', error);

    // Redirect to settings page with error
    return res.redirect('/admin/settings/fortnox?error=auth_failed');
  }
}
