import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterOAuth } from '../../../lib/oauth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { access_token, access_token_secret } = req.cookies;
    
    if (!access_token || !access_token_secret) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const welcomeMessageRules = await TwitterOAuth.getWelcomeMessageRules(access_token, access_token_secret);
    
    res.json(welcomeMessageRules);
  } catch (error) {
    console.error('Error fetching welcome message rules:', error);
    res.status(500).json({ error: 'Failed to fetch welcome message rules' });
  }
}
