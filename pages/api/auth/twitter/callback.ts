import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterOAuth } from '../../../../lib/oauth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { oauth_token, oauth_verifier } = req.query;
    
    if (!oauth_token || !oauth_verifier) {
      return res.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_parameters`);
    }
    
    const oauthTokenSecret = req.cookies.oauth_token_secret;
    
    if (!oauthTokenSecret) {
      return res.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_token_secret`);
    }
    
    const accessTokenResponse = await TwitterOAuth.getAccessToken(
      oauth_token as string,
      oauthTokenSecret,
      oauth_verifier as string
    );
    
    // Set secure cookies with access tokens
    const cookieOptions = `HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; Max-Age=${30 * 24 * 60 * 60}; Path=/`;
    
    res.setHeader('Set-Cookie', [
      `access_token=${accessTokenResponse.oauth_token}; ${cookieOptions}`,
      `access_token_secret=${accessTokenResponse.oauth_token_secret}; ${cookieOptions}`,
      `user_info=${JSON.stringify({
        user_id: accessTokenResponse.user_id,
        screen_name: accessTokenResponse.screen_name,
      })}; ${cookieOptions}`,
      `oauth_token_secret=; HttpOnly; Max-Age=0; Path=/`
    ]);
    
    res.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);
  } catch (error) {
    console.error('Error in Twitter OAuth callback:', error);
    res.redirect(`${process.env.NEXTAUTH_URL}/?error=oauth_failed`);
  }
}
