import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { access_token, access_token_secret } = req.cookies;
    
    if (!access_token || !access_token_secret) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Return the tokens for debugging purposes
    res.json({
      accessToken: access_token,
      accessTokenSecret: access_token_secret
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Failed to fetch tokens' });
  }
}
