# Twitter OAuth 1.0 Next.js App

A Next.js application demonstrating OAuth 1.0 authentication with Twitter (X) and making authenticated API requests

## Features

- OAuth 1.0 authentication flow with Twitter
- User profile display
- Home timeline tweets display
- Secure token storage using HTTP-only cookies
- Modern React with TypeScript
- Tailwind CSS for styling

## Setup Instructions

### 1. Twitter Developer Account Setup

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use an existing one
3. Navigate to your app settings
4. Copy your **Consumer Key** and **Consumer Secret**
5. Set the callback URL to: `http://localhost:3000/api/auth/twitter/callback`

### 2. Environment Configuration

1. Copy the `.env.local` file and update it with your Twitter credentials:

```bash
TWITTER_CONSUMER_KEY=your_consumer_key_here
TWITTER_CONSUMER_SECRET=your_consumer_secret_here
NEXTAUTH_URL=http://localhost:3000
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

1. **Request Token**: User clicks "Login with Twitter" → App requests a request token from Twitter
2. **Authorization**: User is redirected to Twitter to authorize the app
3. **Callback**: Twitter redirects back with an OAuth verifier
4. **Access Token**: App exchanges the verifier for an access token
5. **API Requests**: App can now make authenticated requests on behalf of the user

### File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/twitter/          # OAuth flow endpoints
│   │   └── twitter/               # API request endpoints
│   ├── dashboard/                 # Protected dashboard page
│   └── page.tsx                   # Login page
├── lib/
│   └── oauth.ts                   # OAuth 1.0 implementation
└── components/                    # React components (if needed)
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
2. Update Twitter app callback URL to your production URL
3. Use secure cookie settings
4. Consider using a database for token storage instead of cookies
5. Implement proper error handling and logging

## Troubleshooting

- **"Failed to get request token"**: Check your Consumer Key/Secret
- **"OAuth session expired"**: The temporary token expired, try again
- **"Not authenticated"**: Your access tokens may have expired
- **API errors**: Check Twitter API status and rate limits

## Rate Limits

Twitter API has rate limits. This app makes minimal requests but be aware of:
- 15 requests per 15 minutes for user profile
- 15 requests per 15 minutes for home timeline

## License

MIT License
# Updated for Vercel deployment
