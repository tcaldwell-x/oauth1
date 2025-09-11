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
    
    const { 
      postIds, 
      startTime, 
      endTime, 
      granularity = 'total' 
    } = req.query;
    
    if (!postIds || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'postIds, startTime, and endTime are required' 
      });
    }
    
    const postIdsArray = Array.isArray(postIds) ? postIds : [postIds];
    
    const analytics = await TwitterOAuth.getPostAnalytics(
      access_token,
      access_token_secret,
      postIdsArray as string[],
      startTime as string,
      endTime as string,
      granularity as 'hourly' | 'daily' | 'weekly' | 'total'
    );
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    res.status(500).json({ error: 'Failed to fetch post analytics' });
  }
}
