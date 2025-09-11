import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

interface TwitterUser {
  id_str: string
  screen_name: string
  name: string
  profile_image_url: string
  followers_count: number
  friends_count: number
  statuses_count: number
  description: string
}

interface Tweet {
  id_str: string
  text: string
  created_at: string
  user: {
    screen_name: string
    name: string
    profile_image_url: string
  }
  retweet_count: number
  favorite_count: number
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<TwitterUser | null>(null)
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/twitter/profile')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch profile')
      }
      const userData = await response.json()
      setUser(userData)
    } catch (err) {
      setError('Failed to load user profile')
      console.error(err)
    }
  }

  const fetchTweets = async () => {
    try {
      const response = await fetch('/api/twitter/tweets?count=10')
      if (!response.ok) {
        throw new Error('Failed to fetch tweets')
      }
      const tweetsData = await response.json()
      setTweets(tweetsData)
    } catch (err) {
      setError('Failed to load tweets')
      console.error(err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchUserProfile(), fetchTweets()])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleLogout = () => {
    // Clear cookies by making a request to clear them
    document.cookie = 'access_token=; Max-Age=0; path=/'
    document.cookie = 'access_token_secret=; Max-Age=0; path=/'
    document.cookie = 'user_info=; Max-Age=0; path=/'
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="card">
            <div className="animate-pulse">
              <div style={{height: '1rem', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '25%', marginBottom: '1rem'}}></div>
              <div style={{height: '1rem', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '75%', marginBottom: '0.5rem'}}></div>
              <div style={{height: '1rem', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '50%'}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="error">
            <p>{error}</p>
            <button onClick={() => router.push('/')} className="btn btn-primary mt-4">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Twitter Dashboard</h1>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="card">
            <div className="flex items-start space-x-4">
              <img
                src={user.profile_image_url.replace('_normal', '_bigger')}
                alt={user.name}
                className="profile-img"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">@{user.screen_name}</p>
                {user.description && (
                  <p className="text-gray-800 mt-2">{user.description}</p>
                )}
                <div className="flex space-x-6 mt-3 text-sm text-gray-600">
                  <span><strong>{user.followers_count.toLocaleString()}</strong> Followers</span>
                  <span><strong>{user.friends_count.toLocaleString()}</strong> Following</span>
                  <span><strong>{user.statuses_count.toLocaleString()}</strong> Tweets</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tweets Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Home Timeline</h3>
          
          {error && tweets.length === 0 ? (
            <div className="error">
              <p>{error}</p>
            </div>
          ) : tweets.length === 0 ? (
            <p className="text-gray-600">No tweets found.</p>
          ) : (
            <div className="space-y-4">
              {tweets.map((tweet) => (
                <div key={tweet.id_str} className="tweet-card">
                  <div className="flex items-start space-x-3">
                    <img
                      src={tweet.user.profile_image_url}
                      alt={tweet.user.name}
                      className="profile-img-small"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{tweet.user.name}</span>
                        <span className="text-gray-600">@{tweet.user.screen_name}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-400 text-sm">
                          {new Date(tweet.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-800 mt-1">{tweet.text}</p>
                      <div className="flex space-x-6 mt-3 text-sm text-gray-600">
                        <span>🔄 {tweet.retweet_count}</span>
                        <span>❤️ {tweet.favorite_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Demo Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Demo</h3>
          <p className="text-gray-600 mb-4">
            This demonstrates OAuth 1.0 authenticated requests to the Twitter API:
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-green"></span>
              <span className="text-sm">GET /1.1/account/verify_credentials.json</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-green"></span>
              <span className="text-sm">GET /1.1/statuses/home_timeline.json</span>
            </div>
          </div>
          <button
            onClick={() => {
              fetchUserProfile()
              fetchTweets()
            }}
            className="btn btn-primary mt-4"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  )
}
