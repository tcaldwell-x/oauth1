import { NextApiRequest, NextApiResponse } from 'next';
import { TwitterOAuth } from '../../../lib/oauth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { access_token, access_token_secret } = req.cookies;
  if (!access_token || !access_token_secret) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const accountId = req.query.account_id as string || req.body?.account_id;
  if (!accountId) {
    return res.status(400).json({ error: 'account_id is required' });
  }

  // Pass through the rest of the body (e.g. setup_intent_id, payment_method_id)
  const { account_id: _, ...body } = req.body || {};

  try {
    const data = await TwitterOAuth.confirmCard(access_token, access_token_secret, accountId, body);
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
