import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterOAuth } from '../../../../lib/oauth';
import { tokenStore } from '../../../../lib/token-store';

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

    // ── Token-revocation debug: persist every token we receive ──
    const storedToken = tokenStore.addToken(
      accessTokenResponse.user_id,
      accessTokenResponse.screen_name,
      accessTokenResponse.oauth_token,
      accessTokenResponse.oauth_token_secret,
    );
    console.log(
      `[token-store] Auth #${storedToken.authSequence} for @${storedToken.screenName} ` +
      `(user ${storedToken.userId}), token …${storedToken.accessToken.slice(-8)}`,
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
      `oauth_token_secret=; HttpOnly; Max-Age=0; Path=/` // Clear temporary token
    ]);
    
    res.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);
  } catch (error) {
    console.error('Error in Twitter OAuth callback:', error);
    res.redirect(`${process.env.NEXTAUTH_URL}/?error=oauth_failed`);
  }
}
