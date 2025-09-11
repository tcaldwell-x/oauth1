import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterOAuth } from '../../../lib/oauth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const callbackUrl = `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`;
    const requestTokenResponse = await TwitterOAuth.getRequestToken(callbackUrl);
    
    // Store the token secret in a secure cookie
    res.setHeader('Set-Cookie', [
      `oauth_token_secret=${requestTokenResponse.oauth_token_secret}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; Max-Age=900; Path=/`
    ]);
    
    res.redirect(TwitterOAuth.getAuthorizationUrl(requestTokenResponse.oauth_token));
  } catch (error) {
    console.error('Error in Twitter OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate Twitter OAuth' });
  }
}
