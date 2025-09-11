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

  const handleTwitterLogin = () => {
    window.location.href = '/api/auth/twitter'
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="card text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Twitter OAuth 1.0 Demo
          </h1>
          
          <p className="text-gray-600 mb-8">
            This app demonstrates OAuth 1.0 authentication with Twitter (X) and 
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
            onClick={handleTwitterLogin}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            <svg
              className="mr-2"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Login with Twitter
          </button>

          <div className="setup-box">
            <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
            <ol className="text-sm text-blue-800 text-left space-y-1">
              <li>1. Create a Twitter Developer account</li>
              <li>2. Create a new app at developer.twitter.com</li>
              <li>3. Copy your Consumer Key and Consumer Secret</li>
              <li>4. Update the .env.local file with your credentials</li>
              <li>5. Set callback URL to: http://localhost:3000/api/auth/twitter/callback</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
