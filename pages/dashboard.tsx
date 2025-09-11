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
  id: string
  text: string
  created_at: string
  public_metrics?: {
    retweet_count: number
    like_count: number
    reply_count: number
    quote_count: number
    impression_count?: number
  }
}

interface PostAnalytics {
  id: string
  timestamped_metrics: Array<{
    metrics: {
      impressions?: number
      likes?: number
      retweets?: number
      replies?: number
      engagements?: number
      profile_visits?: number
      url_clicks?: number
      media_views?: number
    }
    timestamp: string
  }>
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<TwitterUser | null>(null)
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [analytics, setAnalytics] = useState<PostAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTokens, setShowTokens] = useState(false)
  const [showUrls, setShowUrls] = useState(false)
  const [tokens, setTokens] = useState<{accessToken: string, accessTokenSecret: string} | null>(null)
  const [apiUrls, setApiUrls] = useState<{url: string, method: string, description: string}[]>([])

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/twitter/tokens')
      if (response.ok) {
        const tokenData = await response.json()
        setTokens(tokenData)
      }
    } catch (err) {
      console.warn('Failed to fetch tokens:', err)
    }
  }

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
      
      // Add profile API URL to the list
      setApiUrls(prev => [...prev, {
        url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
        method: 'GET',
        description: 'User Profile'
      }])
      
      return userData
    } catch (err) {
      setError('Failed to load user profile')
      console.error(err)
      return null
    }
  }

  const fetchUserTweets = async (userId: string): Promise<Tweet[]> => {
    try {
      const response = await fetch(`/api/twitter/user-tweets?userId=${userId}&maxResults=20`)
      if (!response.ok) {
        throw new Error('Failed to fetch tweets')
      }
      const tweetsData = await response.json()
      const tweets = tweetsData.data || []
      setTweets(tweets)
      
      // Add user tweets API URL to the list
      setApiUrls(prev => [...prev, {
        url: `https://api.x.com/2/users/${userId}/tweets?tweet.fields=created_at,public_metrics,context_annotations&max_results=20`,
        method: 'GET',
        description: 'User Tweets'
      }])
      
      return tweets
    } catch (err) {
      setError('Failed to load tweets')
      console.error(err)
      return []
    }
  }

  const fetchPostAnalytics = async (postIds: string[]) => {
    if (postIds.length === 0) return

    try {
      // Get analytics for the last 30 days
      const endTime = new Date().toISOString()
      const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      
      // Build the analytics URL
      const analyticsUrl = `https://api.x.com/2/tweets/analytics?ids=${postIds.join(',')}&start_time=${startTime}&end_time=${endTime}&granularity=total&analytics.fields=impressions,likes,retweets,replies,engagements,profile_visits,url_clicks,media_views`
      
      // Add analytics API URL to the list
      setApiUrls(prev => [...prev, {
        url: analyticsUrl,
        method: 'GET',
        description: `Post Analytics (${postIds.length} posts)`
      }])
      
      const response = await fetch(
        `/api/twitter/analytics?postIds=${postIds.join(',')}&startTime=${startTime}&endTime=${endTime}&granularity=total`
      )
      
      if (!response.ok) {
        console.warn('Analytics not available for these posts')
        return
      }
      
      const analyticsData = await response.json()
      setAnalytics(analyticsData.data || [])
    } catch (err) {
      console.warn('Failed to load analytics:', err)
      // Analytics might not be available for all accounts
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setApiUrls([]) // Reset API URLs
      await fetchTokens()
      const userData = await fetchUserProfile()
      
      if (userData) {
        const userTweets = await fetchUserTweets(userData.id_str)
        if (userTweets.length > 0) {
          const postIds = userTweets.map((tweet: Tweet) => tweet.id)
          await fetchPostAnalytics(postIds)
        }
      }
      
      setLoading(false)
    }
    loadData()
  }, [])

  const handleLogout = () => {
    document.cookie = 'access_token=; Max-Age=0; path=/'
    document.cookie = 'access_token_secret=; Max-Age=0; path=/'
    document.cookie = 'user_info=; Max-Age=0; path=/'
    router.push('/')
  }

  const getAnalyticsForPost = (postId: string) => {
    return analytics.find(a => a.id === postId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="card">
            <div className="animate-pulse">
              <div style={{height: '1rem', backgroundColor: '#333333', borderRadius: '4px', width: '25%', marginBottom: '1rem'}}></div>
              <div style={{height: '1rem', backgroundColor: '#333333', borderRadius: '4px', width: '75%', marginBottom: '0.5rem'}}></div>
              <div style={{height: '1rem', backgroundColor: '#333333', borderRadius: '4px', width: '50%'}}></div>
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
            <div className="flex items-center space-x-3">
              <svg
                className="x-logo"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">X Dashboard v2</h1>
            </div>
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
                  <span><strong>{user.statuses_count.toLocaleString()}</strong> Posts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OAuth Tokens Debug Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">OAuth Tokens (Debug)</h3>
            <button 
              onClick={() => setShowTokens(!showTokens)}
              className="btn btn-secondary text-sm"
            >
              {showTokens ? 'Hide' : 'Show'} Tokens
            </button>
          </div>
          
          {showTokens && tokens && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Access Token:
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-3 bg-gray-800 text-gray-300 rounded text-sm break-all">
                    {tokens.accessToken}
                  </code>
                  <button
                    onClick={() => copyToClipboard(tokens.accessToken)}
                    className="btn btn-secondary text-xs px-3 py-2"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Access Token Secret:
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-3 bg-gray-800 text-gray-300 rounded text-sm break-all">
                    {tokens.accessTokenSecret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(tokens.accessTokenSecret)}
                    className="btn btn-secondary text-xs px-3 py-2"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-800 p-3 rounded">
                <strong>Note:</strong> These tokens are used for API authentication. Keep them secure and never share them publicly.
              </div>
            </div>
          )}
          
          {showTokens && !tokens && (
            <div className="text-gray-500 text-sm">
              No tokens available. Please log in again.
            </div>
          )}
        </div>

        {/* API URLs Debug Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">API Request URLs (Debug)</h3>
            <button 
              onClick={() => setShowUrls(!showUrls)}
              className="btn btn-secondary text-sm"
            >
              {showUrls ? 'Hide' : 'Show'} URLs
            </button>
          </div>
          
          {showUrls && apiUrls.length > 0 && (
            <div className="space-y-4">
              {apiUrls.map((apiCall, index) => (
                <div key={index} className="border border-gray-600 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-400">{apiCall.description}</span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {apiCall.method}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 p-3 bg-gray-800 text-gray-300 rounded text-sm break-all">
                      {apiCall.url}
                    </code>
                    <button
                      onClick={() => copyToClipboard(apiCall.url)}
                      className="btn btn-secondary text-xs px-3 py-2"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="text-xs text-gray-500 bg-gray-800 p-3 rounded">
                <strong>Note:</strong> These are the actual X API endpoints being called. Use these URLs with your OAuth tokens for testing.
              </div>
            </div>
          )}
          
          {showUrls && apiUrls.length === 0 && (
            <div className="text-gray-500 text-sm">
              No API calls made yet. Refresh the data to see URLs.
            </div>
          )}
        </div>

        {/* Posts with Analytics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Posts with Analytics</h3>
          
          {error && tweets.length === 0 ? (
            <div className="error">
              <p>{error}</p>
            </div>
          ) : tweets.length === 0 ? (
            <p className="text-gray-600">No posts found.</p>
          ) : (
            <div className="space-y-4">
              {tweets.map((tweet) => {
                const postAnalytics = getAnalyticsForPost(tweet.id)
                const latestMetrics = postAnalytics?.timestamped_metrics?.[0]?.metrics
                
                return (
                  <div key={tweet.id} className="tweet-card">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">{user?.name}</span>
                          <span className="text-gray-600">@{user?.screen_name}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-400 text-sm">
                            {new Date(tweet.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-800 mb-3">{tweet.text}</p>
                        
                        {/* Basic Metrics */}
                        <div className="flex space-x-6 text-sm text-gray-600 mb-3">
                          <span>🔄 {tweet.public_metrics?.retweet_count || 0}</span>
                          <span>❤️ {tweet.public_metrics?.like_count || 0}</span>
                          <span>💬 {tweet.public_metrics?.reply_count || 0}</span>
                          <span>📊 {tweet.public_metrics?.quote_count || 0}</span>
                        </div>

                        {/* Advanced Analytics */}
                        {latestMetrics && (
                          <div className="border-t border-gray-600 pt-3">
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Analytics (30 days)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-lg font-bold text-white">{latestMetrics.impressions?.toLocaleString() || 'N/A'}</div>
                                <div className="text-gray-400">Impressions</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-white">{latestMetrics.engagements?.toLocaleString() || 'N/A'}</div>
                                <div className="text-gray-400">Engagements</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-white">{latestMetrics.profile_visits?.toLocaleString() || 'N/A'}</div>
                                <div className="text-gray-400">Profile Visits</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-white">{latestMetrics.url_clicks?.toLocaleString() || 'N/A'}</div>
                                <div className="text-gray-400">Link Clicks</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* API Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">X API v2 Integration</h3>
          <p className="text-gray-600 mb-4">
            This dashboard now uses X API v2 endpoints for enhanced analytics:
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-green"></span>
              <span className="text-sm">GET /2/users/{user?.id_str}/tweets - User's posts</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-green"></span>
              <span className="text-sm">GET /2/tweets/analytics - Post analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-green"></span>
              <span className="text-sm">GET /1.1/account/verify_credentials.json - User profile</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (user) {
                setApiUrls([]) // Reset URLs
                fetchUserTweets(user.id_str)
                if (tweets.length > 0) {
                  fetchPostAnalytics(tweets.map((t: Tweet) => t.id))
                }
              }
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
