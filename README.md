# X OAuth 1.0 Next.js App

A Next.js application demonstrating OAuth 1.0 authentication with X (formerly Twitter) and making authenticated API requests.

## Features

- OAuth 1.0 authentication flow with X
- User profile display
- Home timeline posts display
- Secure token storage using HTTP-only cookies
- Modern React with TypeScript
- Dark theme with X branding

## Setup Instructions

### 1. X Developer Account Setup

1. Go to [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Navigate to your app settings
4. Copy your **Consumer Key** and **Consumer Secret**
5. Set the callback URL to: `https://oauth1.vercel.app/api/auth/twitter/callback`

### 2. Environment Configuration

1. In your Vercel dashboard, go to **Settings** → **Environment Variables**
2. Add these environment variables:

```bash
TWITTER_CONSUMER_KEY=your_consumer_key_here
TWITTER_CONSUMER_SECRET=your_consumer_secret_here
NEXTAUTH_URL=https://oauth1.vercel.app
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## How It Works

### OAuth 1.0 Flow

1. **Request Token**: User clicks "Login with X" → App requests a request token from X
2. **Authorization**: User is redirected to X to authorize the app
3. **Callback**: X redirects back with an OAuth verifier
4. **Access Token**: App exchanges the verifier for an access token
5. **API Requests**: App can now make authenticated requests on behalf of the user

### File Structure

```
oauth1/
├── lib/
│   └── oauth.ts                   # OAuth 1.0 implementation
├── pages/
│   ├── _app.tsx                   # Next.js app wrapper
│   ├── index.tsx                  # Login page
│   ├── dashboard.tsx              # Protected dashboard
│   └── api/
│       ├── auth/twitter/
│       │   ├── index.ts           # OAuth initiation
│       │   └── callback.ts        # OAuth callback handler
│       └── twitter/
│           ├── profile.ts         # User profile API
│           └── tweets.ts          # Posts API
├── styles/
│   └── globals.css                # Dark theme CSS styles
└── README.md                      # Setup instructions
```

### API Endpoints

- `GET /api/auth/twitter` - Initiates OAuth flow
- `GET /api/auth/twitter/callback` - Handles OAuth callback
- `GET /api/twitter/profile` - Fetches user profile
- `GET /api/twitter/tweets` - Fetches user's home timeline

## Security Notes

- Access tokens are stored in HTTP-only cookies
- CSRF protection through OAuth 1.0 signature validation
- Tokens expire and should be refreshed in production
- Use HTTPS in production

## Production Deployment

1. Update `NEXTAUTH_URL` to your production domain
2. Update X app callback URL to your production URL
3. Use secure cookie settings
4. Consider using a database for token storage instead of cookies
5. Implement proper error handling and logging

## Troubleshooting

- **"Failed to get request token"**: Check your Consumer Key/Secret
- **"OAuth session expired"**: The temporary token expired, try again
- **"Not authenticated"**: Your access tokens may have expired
- **API errors**: Check X API status and rate limits

## Rate Limits

X API has rate limits. This app makes minimal requests but be aware of:
- 15 requests per 15 minutes for user profile
- 15 requests per 15 minutes for home timeline

## License

MIT License
