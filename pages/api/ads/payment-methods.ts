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

  const accountId = req.query.account_id as string;
  if (!accountId) {
    return res.status(400).json({ error: 'account_id is required' });
  }

  try {
    const data = await TwitterOAuth.getPaymentMethods(access_token, access_token_secret, accountId);
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching payment methods:', error);
    if (error.body) {
      try { return res.status(error.status || 500).json(JSON.parse(error.body)); } catch {}
    }
    res.status(error.status || 500).json({ error: error.message });
  }
}
