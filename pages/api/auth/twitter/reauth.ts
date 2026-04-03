import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterOAuth } from '../../../../lib/oauth';

/**
 * GET /api/auth/twitter/reauth
 *
 * Starts a *new* OAuth 1.0a flow without clearing the existing access-token
 * cookies.  This lets us get a second access token for the same user so we
 * can test whether the first token gets revoked.
 *
 * Uses `force_login=true` on the authorize URL so Twitter always shows the
 * login screen even if the user is already signed in.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`;
    const requestTokenResponse = await TwitterOAuth.getRequestToken(callbackUrl);

    // Store the new request-token secret (overwrite is fine — it's temporary)
    res.setHeader('Set-Cookie', [
      `oauth_token_secret=${requestTokenResponse.oauth_token_secret}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; Max-Age=900; Path=/`,
    ]);

    // force_login=true ensures Twitter shows the auth screen again
    const authorizeUrl =
      TwitterOAuth.getAuthorizationUrl(requestTokenResponse.oauth_token) +
      '&force_login=true';

    res.redirect(authorizeUrl);
  } catch (error) {
    console.error('Error in Twitter re-auth:', error);
    res.status(500).json({ error: 'Failed to initiate Twitter re-auth' });
  }
}