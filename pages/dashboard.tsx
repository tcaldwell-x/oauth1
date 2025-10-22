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

interface WelcomeMessage {
  id: string
  created_timestamp: string
  message_data: {
    text: string
    entities?: {
      hashtags?: Array<{ text: string; indices: number[] }>
      symbols?: Array<{ text: string; indices: number[] }>
      urls?: Array<{ url: string; expanded_url: string; display_url: string; indices: number[] }>
      user_mentions?: Array<{ screen_name: string; name: string; id: number; id_str: string; indices: number[] }>
    }
  }
  name: string
}

interface WelcomeMessageRule {
  id: string
  created_timestamp: string
  welcome_message_id: string
  name: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<TwitterUser | null>(null)
  const [welcomeMessages, setWelcomeMessages] = useState<WelcomeMessage[]>([])
  const [welcomeMessageRules, setWelcomeMessageRules] = useState<WelcomeMessageRule[]>([])
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
      return userData
    } catch (err) {
      setError('Failed to load user profile')
      console.error(err)
      return null
    }
  }

  const fetchWelcomeMessages = async (): Promise<WelcomeMessage[]> => {
    try {
      const response = await fetch('/api/twitter/welcome-messages')
      if (!response.ok) {
        throw new Error('Failed to fetch welcome messages')
      }
      const messagesData = await response.json()
      const messages = messagesData.welcome_messages || []
      setWelcomeMessages(messages)
      return messages
    } catch (err) {
      setError('Failed to load welcome messages')
      console.error(err)
      return []
    }
  }

  const fetchWelcomeMessageRules = async (): Promise<WelcomeMessageRule[]> => {
    try {
      const response = await fetch('/api/twitter/welcome-message-rules')
      if (!response.ok) {
        throw new Error('Failed to fetch welcome message rules')
      }
      const rulesData = await response.json()
      const rules = rulesData.welcome_message_rules || []
      setWelcomeMessageRules(rules)
      return rules
    } catch (err) {
      setError('Failed to load welcome message rules')
      console.error(err)
      return []
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const userData = await fetchUserProfile()
      
      if (userData) {
        await fetchWelcomeMessages()
        await fetchWelcomeMessageRules()
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

  const deleteWelcomeMessage = async (id: string) => {
    try {
      const response = await fetch('/api/twitter/delete-welcome-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })
      
      if (response.ok) {
        setWelcomeMessages(prev => prev.filter(msg => msg.id !== id))
        // Also remove any rules that reference this message
        setWelcomeMessageRules(prev => prev.filter(rule => rule.welcome_message_id !== id))
      } else {
        console.error('Failed to delete welcome message')
      }
    } catch (err) {
      console.error('Error deleting welcome message:', err)
    }
  }

  const deleteWelcomeMessageRule = async (id: string) => {
    try {
      const response = await fetch('/api/twitter/delete-welcome-message-rule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })
      
      if (response.ok) {
        setWelcomeMessageRules(prev => prev.filter(rule => rule.id !== id))
      } else {
        console.error('Failed to delete welcome message rule')
      }
    } catch (err) {
      console.error('Error deleting welcome message rule:', err)
    }
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



        {/* Welcome Messages */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome Messages</h3>
          
          {error && welcomeMessages.length === 0 ? (
            <div className="error">
              <p>{error}</p>
            </div>
          ) : welcomeMessages.length === 0 ? (
            <p className="text-gray-600">No welcome messages found.</p>
          ) : (
            <div className="space-y-4">
              {welcomeMessages.map((message) => (
                <div key={message.id} className="tweet-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">{message.name}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-400 text-sm">
                          {new Date(parseInt(message.created_timestamp)).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-3">{JSON.stringify(message.message_data, null, 4)}</p>
                    </div>
                    <button
                      onClick={() => deleteWelcomeMessage(message.id)}
                      className="btn btn-secondary text-sm ml-4"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Welcome Message Rules */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome Message Rules</h3>
          
          {error && welcomeMessageRules.length === 0 ? (
            <div className="error">
              <p>{error}</p>
            </div>
          ) : welcomeMessageRules.length === 0 ? (
            <p className="text-gray-600">No welcome message rules found.</p>
          ) : (
            <div className="space-y-4">
              {welcomeMessageRules.map((rule) => {
                const associatedMessage = welcomeMessages.find(msg => msg.id === rule.welcome_message_id)
                return (
                  <div key={rule.id} className="tweet-card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">{rule.name}</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-400 text-sm">
                            {new Date(parseInt(rule.created_timestamp)).toLocaleDateString()}
                          </span>
                        </div>
                        {associatedMessage && (
                          <p className="text-gray-600 text-sm mb-2">
                            Associated with: "{associatedMessage.message_data.text}"
                          </p>
                        )}
                        <p className="text-gray-400 text-sm">
                          Message ID: {rule.welcome_message_id}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteWelcomeMessageRule(rule.id)}
                        className="btn btn-secondary text-sm ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* API Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">X API v1.1 Welcome Messages Integration</h3>
          <p className="text-gray-600 mb-4">
            This dashboard uses X API v1.1 endpoints for welcome messages management:
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-green"></span>
              <span className="text-sm">GET /1.1/direct_messages/welcome_messages/list.json - Welcome messages</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-green"></span>
              <span className="text-sm">GET /1.1/direct_messages/welcome_messages/rules/list.json - Welcome message rules</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-green"></span>
              <span className="text-sm">DELETE /1.1/direct_messages/welcome_messages/destroy.json - Delete messages</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="status-indicator status-green"></span>
              <span className="text-sm">DELETE /1.1/direct_messages/welcome_messages/rules/destroy.json - Delete rules</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              fetchWelcomeMessages()
              fetchWelcomeMessageRules()
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
