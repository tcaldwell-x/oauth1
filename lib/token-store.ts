/**
 * In-memory token store for debugging OAuth 1.0a token revocation.
 *
 * Tracks every access token issued per user_id so we can:
 *  1. Compare old vs new tokens after re-authentication
 *  2. Validate whether old tokens are still active
 *  3. Detect whether a second OAuth flow revokes the first token
 *
 * ⚠️  This is intentionally in-memory (resets on server restart).
 *     For a real investigation you would persist to a database.
 */

export interface StoredToken {
  /** Unique id for this token entry */
  id: string;
  /** Twitter user_id that owns the token */
  userId: string;
  /** Twitter screen_name at time of auth */
  screenName: string;
  /** The OAuth 1.0a access token */
  accessToken: string;
  /** The OAuth 1.0a access token secret */
  accessTokenSecret: string;
  /** When this token was obtained */
  obtainedAt: string;
  /** Sequential auth number for this user (1 = first, 2 = re-auth, …) */
  authSequence: number;
  /** Last time we validated this token against the API */
  lastValidatedAt: string | null;
  /** Result of the last validation attempt */
  lastValidationResult: 'valid' | 'invalid' | 'error' | null;
  /** Error message from last validation, if any */
  lastValidationError: string | null;
  /** Whether this is the token currently stored in the session cookie */
  isCurrent: boolean;
}

class TokenStore {
  /** Map<userId, StoredToken[]> */
  private store: Map<string, StoredToken[]> = new Map();
  private nextId = 1;

  /**
   * Record a newly-obtained token.  
   * Marks all previous tokens for this user as `isCurrent = false`.
   */
  addToken(
    userId: string,
    screenName: string,
    accessToken: string,
    accessTokenSecret: string,
  ): StoredToken {
    const existing = this.store.get(userId) ?? [];

    // Mark all previous tokens as no longer current
    for (const t of existing) {
      t.isCurrent = false;
    }

    const entry: StoredToken = {
      id: String(this.nextId++),
      userId,
      screenName,
      accessToken,
      accessTokenSecret,
      obtainedAt: new Date().toISOString(),
      authSequence: existing.length + 1,
      lastValidatedAt: null,
      lastValidationResult: null,
      lastValidationError: null,
      isCurrent: true,
    };

    existing.push(entry);
    this.store.set(userId, existing);
    return entry;
  }

  /** Get all tokens ever recorded for a user, newest first. */
  getTokensForUser(userId: string): StoredToken[] {
    return [...(this.store.get(userId) ?? [])].reverse();
  }

  /** Get a single token entry by its store id. */
  getTokenById(id: string): StoredToken | undefined {
    let result: StoredToken | undefined;
    this.store.forEach((tokens) => {
      if (!result) {
        const found = tokens.find((t) => t.id === id);
        if (found) result = found;
      }
    });
    return result;
  }

  /** Update validation results on a token entry. */
  setValidationResult(
    id: string,
    result: 'valid' | 'invalid' | 'error',
    error: string | null = null,
  ): void {
    const token = this.getTokenById(id);
    if (token) {
      token.lastValidatedAt = new Date().toISOString();
      token.lastValidationResult = result;
      token.lastValidationError = error;
    }
  }

  /** Get all stored users (for admin / debug overview). */
  getAllUsers(): string[] {
    const users: string[] = [];
    this.store.forEach((_tokens, userId) => {
      users.push(userId);
    });
    return users;
  }
}

// Singleton — lives for the lifetime of the server process
export const tokenStore = new TokenStore();
