import { NextApiRequest, NextApiResponse } from 'next';
import { tokenStore } from '../../../lib/token-store';

/**
 * GET /api/twitter/token-history
 *
 * Returns every token recorded in the in-memory store for the
 * currently-authenticated user.  Tokens are ordered newest-first.
 *
 * The access_token and access_token_secret are masked to the last 8 chars
 * so the debug UI can differentiate tokens without leaking full secrets.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Identify the user from the cookie
    const userInfoCookie = req.cookies.user_info;
    if (!userInfoCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let userId: string;
    try {
      const parsed = JSON.parse(userInfoCookie);
      userId = parsed.user_id;
    } catch {
      return res.status(400).json({ error: 'Invalid user_info cookie' });
    }

    const tokens = tokenStore.getTokensForUser(userId);

    // Mask secrets before sending to the client
    const masked = tokens.map((t) => ({
      id: t.id,
      userId: t.userId,
      screenName: t.screenName,
      accessTokenSuffix: t.accessToken.slice(-8),
      accessTokenSecretSuffix: t.accessTokenSecret.slice(-8),
      obtainedAt: t.obtainedAt,
      authSequence: t.authSequence,
      lastValidatedAt: t.lastValidatedAt,
      lastValidationResult: t.lastValidationResult,
      lastValidationError: t.lastValidationError,
      isCurrent: t.isCurrent,
      // Include full token info for comparing whether tokens are identical
      tokenChanged: true, // will be computed below
    }));

    // Annotate whether each token is different from the previous one
    // (reversed because masked is newest-first, we want to compare to predecessor)
    const reversed = [...masked].reverse();
    for (let i = 0; i < reversed.length; i++) {
      if (i === 0) {
        reversed[i].tokenChanged = false; // first auth - nothing to compare
      } else {
        reversed[i].tokenChanged =
          reversed[i].accessTokenSuffix !== reversed[i - 1].accessTokenSuffix;
      }
    }
    // Reverse back to newest-first
    const result = reversed.reverse();

    res.json({
      userId,
      totalAuths: result.length,
      tokens: result,
    });
  } catch (error) {
    console.error('Error fetching token history:', error);
    res.status(500).json({ error: 'Failed to fetch token history' });
  }
}