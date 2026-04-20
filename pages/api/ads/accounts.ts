import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterOAuth } from '../../../lib/oauth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { access_token, access_token_secret } = req.cookies;
  if (!access_token || !access_token_secret) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const data = await TwitterOAuth.getAdsAccounts(access_token, access_token_secret);
    res.json(data);
  } catch (error: any) {
    const status = error.status || 500;
    try {
      return res.status(status).json(JSON.parse(error.body));
    } catch {
      return res.status(status).json({ error: error.message, body: error.body || null });
    }
  }
}
