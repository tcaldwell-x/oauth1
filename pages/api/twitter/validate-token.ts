import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterOAuth } from '../../../lib/oauth';
import { tokenStore } from '../../../lib/token-store';

/**
 * POST /api/twitter/validate-token
 * Body: { tokenId: string }
 *
 * Attempts to call GET /1.1/account/verify_credentials.json with the
 * stored token to determine whether it is still valid.
 *
 * Returns the validation result and updates the token store.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ error: 'tokenId is required' });
    }

    const storedToken = tokenStore.getTokenById(tokenId);

    if (!storedToken) {
      return res.status(404).json({ error: 'Token not found in store' });
    }

    // Try calling verify_credentials with this token
    try {
      const profile = await TwitterOAuth.getUserProfile(
        storedToken.accessToken,
        storedToken.accessTokenSecret,
      );

      tokenStore.setValidationResult(tokenId, 'valid');

      return res.json({
        tokenId,
        status: 'valid',
        screenName: profile.screen_name,
        userId: profile.id_str,
        validatedAt: new Date().toISOString(),
      });
    } catch (apiError: any) {
      // If the API returned 401 / 403 the token has been revoked
      const errorMessage = apiError.message || String(apiError);
      const isUnauthorized = errorMessage.includes('401') || errorMessage.includes('Unauthorized');

      tokenStore.setValidationResult(
        tokenId,
        isUnauthorized ? 'invalid' : 'error',
        errorMessage,
      );

      return res.json({
        tokenId,
        status: isUnauthorized ? 'invalid' : 'error',
        error: errorMessage,
        validatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Failed to validate token' });
  }
}