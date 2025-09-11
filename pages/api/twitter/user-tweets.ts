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
    
    const { userId, maxResults = '10' } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const tweets = await TwitterOAuth.getUserTweets(
      access_token, 
      access_token_secret, 
      userId as string, 
      parseInt(maxResults as string)
    );
    
    res.json(tweets);
  } catch (error) {
    console.error('Error fetching user tweets:', error);
    res.status(500).json({ error: 'Failed to fetch user tweets' });
  }
}
