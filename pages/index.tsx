import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (router.query.error) {
      setError(router.query.error as string)
    }
  }, [router.query.error])

  const handleXLogin = () => {
    window.location.href = '/api/auth/twitter'
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="card text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            X OAuth 1.0 Demo
          </h1>
          
          <p className="text-gray-600 mb-8">
            This app demonstrates OAuth 1.0 authentication with X (formerly Twitter) and 
            shows how to make authenticated API requests.
          </p>

          {error && (
            <div className="error mb-6">
              <p>
                {error === 'missing_parameters' && 'Missing OAuth parameters'}
                {error === 'missing_token_secret' && 'OAuth session expired'}
                {error === 'oauth_failed' && 'OAuth authentication failed'}
                {!['missing_parameters', 'missing_token_secret', 'oauth_failed'].includes(error) && 
                 'An error occurred during authentication'}
              </p>
            </div>
          )}

          <button
            onClick={handleXLogin}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            <svg
              className="mr-2 x-logo"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Login with X
          </button>

          <div className="setup-box">
            <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
            <ol className="text-sm text-blue-800 text-left space-y-1">
              <li>1. Create an X Developer account</li>
              <li>2. Create a new app at developer.twitter.com</li>
              <li>3. Copy your Consumer Key and Consumer Secret</li>
              <li>4. Update the environment variables in Vercel</li>
              <li>5. Set callback URL to: https://oauth1.vercel.app/api/auth/twitter/callback</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
