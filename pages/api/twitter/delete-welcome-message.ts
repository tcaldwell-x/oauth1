import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterOAuth } from '../../../lib/oauth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { access_token, access_token_secret } = req.cookies;
    
    if (!access_token || !access_token_secret) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { id } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Welcome message ID is required' });
    }
    
    const result = await TwitterOAuth.deleteWelcomeMessage(access_token, access_token_secret, id);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting welcome message:', error);
    res.status(500).json({ error: 'Failed to delete welcome message' });
  }
}
