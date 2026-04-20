import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

const oauth = new OAuth({
  consumer: {
    key: process.env.TWITTER_CONSUMER_KEY!,
    secret: process.env.TWITTER_CONSUMER_SECRET!,
  },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto
      .createHmac('sha1', key)
      .update(base_string)
      .digest('base64');
  },
});

export interface RequestTokenResponse {
  oauth_token: string;
  oauth_token_secret: string;
  oauth_callback_confirmed: string;
}

export interface AccessTokenResponse {
  oauth_token: string;
  oauth_token_secret: string;
  user_id: string;
  screen_name: string;
}

export class TwitterOAuth {
  private static readonly REQUEST_TOKEN_URL = 'https://api.twitter.com/oauth/request_token';
  private static readonly AUTHORIZE_URL = 'https://api.twitter.com/oauth/authorize';
  private static readonly ACCESS_TOKEN_URL = 'https://api.twitter.com/oauth/access_token';
  private static readonly API_V1_BASE_URL = 'https://api.twitter.com/1.1';
  private static readonly ADS_API_BASE_URL = 'https://ads-api.x.com/11';

  static async getRequestToken(callbackUrl: string): Promise<RequestTokenResponse> {
    const requestData = {
      url: this.REQUEST_TOKEN_URL,
      method: 'POST',
      data: { oauth_callback: callbackUrl },
    };

    const headers = {
      ...oauth.toHeader(oauth.authorize(requestData)),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const response = await fetch(this.REQUEST_TOKEN_URL, {
      method: 'POST',
      headers,
      body: new URLSearchParams({ oauth_callback: callbackUrl }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get request token: ${response.statusText}`);
    }

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);
    
    return {
      oauth_token: params.get('oauth_token')!,
      oauth_token_secret: params.get('oauth_token_secret')!,
      oauth_callback_confirmed: params.get('oauth_callback_confirmed')!,
    };
  }

  static getAuthorizationUrl(oauthToken: string): string {
    return `${this.AUTHORIZE_URL}?oauth_token=${oauthToken}`;
  }

  static async getAccessToken(
    oauthToken: string,
    oauthTokenSecret: string,
    oauthVerifier: string
  ): Promise<AccessTokenResponse> {
    const token = {
      key: oauthToken,
      secret: oauthTokenSecret,
    };

    const requestData = {
      url: this.ACCESS_TOKEN_URL,
      method: 'POST',
      data: { oauth_verifier: oauthVerifier },
    };

    const headers = {
      ...oauth.toHeader(oauth.authorize(requestData, token)),
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const response = await fetch(this.ACCESS_TOKEN_URL, {
      method: 'POST',
      headers,
      body: new URLSearchParams({ oauth_verifier: oauthVerifier }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);
    
    return {
      oauth_token: params.get('oauth_token')!,
      oauth_token_secret: params.get('oauth_token_secret')!,
      user_id: params.get('user_id')!,
      screen_name: params.get('screen_name')!,
    };
  }

  static async getUserProfile(accessToken: string, accessTokenSecret: string) {
    return this.makeApiRequest(
      `${this.API_V1_BASE_URL}/account/verify_credentials.json`,
      'GET',
      accessToken,
      accessTokenSecret
    );
  }

  /**
   * Generic form-encoded API request (GET with query params, POST with form body).
   */
  static async makeApiRequest(
    url: string,
    method: 'GET' | 'POST' | 'DELETE',
    accessToken: string,
    accessTokenSecret: string,
    params: Record<string, string> = {}
  ): Promise<any> {
    const token = { key: accessToken, secret: accessTokenSecret };
    const requestData = { url, method, data: params };
    const oauthHeaders = oauth.toHeader(oauth.authorize(requestData, token));
    const headers: Record<string, string> = { ...oauthHeaders };

    let finalUrl = url;
    let body: string | undefined;

    if (method === 'GET' && Object.keys(params).length > 0) {
      finalUrl += '?' + new URLSearchParams(params).toString();
    } else if (method === 'POST') {
      body = new URLSearchParams(params).toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const response = await fetch(finalUrl, { method, headers, body });

    if (!response.ok) {
      const errorBody = await response.text();
      const err: any = new Error(`API request failed: ${response.status} ${response.statusText}`);
      err.status = response.status;
      err.body = errorBody;
      throw err;
    }

    return response.json();
  }

  /**
   * JSON-body API request used by Ads billing endpoints.
   * OAuth signature is computed over the URL only (no body params in signature).
   */
  static async makeJsonApiRequest(
    url: string,
    method: 'POST',
    accessToken: string,
    accessTokenSecret: string,
    jsonBody: Record<string, any> = {}
  ): Promise<any> {
    const token = { key: accessToken, secret: accessTokenSecret };
    const requestData = { url, method, data: {} };
    const oauthHeaders = oauth.toHeader(oauth.authorize(requestData, token));
    const headers: Record<string, string> = {
      ...oauthHeaders,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(jsonBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const err: any = new Error(`API request failed: ${response.status} ${response.statusText}`);
      err.status = response.status;
      err.body = errorBody;
      throw err;
    }

    return response.json();
  }

  // ── Ads API ──

  static async getAdsAccounts(accessToken: string, accessTokenSecret: string) {
    return this.makeApiRequest(
      `${this.ADS_API_BASE_URL}/accounts`,
      'GET',
      accessToken,
      accessTokenSecret
    );
  }

  static async getFundingInstruments(accessToken: string, accessTokenSecret: string, accountId: string) {
    return this.makeApiRequest(
      `${this.ADS_API_BASE_URL}/accounts/${accountId}/funding_instruments`,
      'GET',
      accessToken,
      accessTokenSecret,
      { with_deleted: 'false' }
    );
  }

  static async getPaymentMethods(accessToken: string, accessTokenSecret: string, accountId: string) {
    return this.makeApiRequest(
      `${this.ADS_API_BASE_URL}/accounts/${accountId}/billing/payment-methods`,
      'GET',
      accessToken,
      accessTokenSecret
    );
  }

  static async createSetupIntent(accessToken: string, accessTokenSecret: string, accountId: string) {
    return this.makeJsonApiRequest(
      `${this.ADS_API_BASE_URL}/accounts/${accountId}/billing/setup-intent`,
      'POST',
      accessToken,
      accessTokenSecret
    );
  }

  static async confirmCard(accessToken: string, accessTokenSecret: string, accountId: string, body: Record<string, any> = {}) {
    return this.makeJsonApiRequest(
      `${this.ADS_API_BASE_URL}/accounts/${accountId}/billing/confirm-card`,
      'POST',
      accessToken,
      accessTokenSecret,
      body
    );
  }
}

export default oauth;
