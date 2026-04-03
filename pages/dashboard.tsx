import { useState, useEffect, useCallback } from 'react'
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

interface TokenEntry {
  id: string
  userId: string
  screenName: string
  accessTokenSuffix: string
  accessTokenSecretSuffix: string
  obtainedAt: string
  authSequence: number
  lastValidatedAt: string | null
  lastValidationResult: 'valid' | 'invalid' | 'error' | null
  lastValidationError: string | null
  isCurrent: boolean
  tokenChanged: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<TwitterUser | null>(null)
  const [welcomeMessages, setWelcomeMessages] = useState<WelcomeMessage[]>([])
  const [welcomeMessageRules, setWelcomeMessageRules] = useState<WelcomeMessageRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Token debug state ──
  const [tokenHistory, setTokenHistory] = useState<TokenEntry[]>([])
  const [totalAuths, setTotalAuths] = useState(0)
  const [validatingTokenId, setValidatingTokenId] = useState<string | null>(null)
  const [validatingAll, setValidatingAll] = useState(false)
  const [reauthing, setReauthing] = useState(false)

  const fetchTokenHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/twitter/token-history')
      if (!response.ok) return
      const data = await response.json()
      setTokenHistory(data.tokens || [])
      setTotalAuths(data.totalAuths || 0)
    } catch (err) {
      console.error('Failed to fetch token history:', err)
    }
  }, [])

  const validateToken = async (tokenId: string) => {
    setValidatingTokenId(tokenId)
    try {
      const response = await fetch('/api/twitter/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId }),
      })
      if (response.ok) {
        // Refresh history to pick up updated validation results
        await fetchTokenHistory()
      }
    } catch (err) {
      console.error('Failed to validate token:', err)
    } finally {
      setValidatingTokenId(null)
    }
  }

  const validateAllTokens = async () => {
    setValidatingAll(true)
    for (const token of tokenHistory) {
      await validateToken(token.id)
    }
    setValidatingAll(false)
  }

  const handleReauth = () => {
    setReauthing(true)
    window.location.href = '/api/auth/twitter/reauth'
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
        await fetchTokenHistory()
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



        {/* ── Token Revocation Debug Panel ── */}
        <div className="card debug-panel">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                🔍 OAuth 1.0a Token Revocation Debugger
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Reproduce the bug: re-authenticate and check if old tokens get revoked
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleReauth}
                disabled={reauthing}
                className="btn btn-reauth"
              >
                {reauthing ? 'Redirecting…' : '🔄 Re-Authenticate (OAuth 1.0a)'}
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="debug-instructions mb-4">
            <p className="font-semibold text-sm mb-2">How to reproduce the bug:</p>
            <ol className="text-sm space-y-1" style={{ paddingLeft: '1.25rem', listStyleType: 'decimal' }}>
              <li>Click <strong>"Re-Authenticate"</strong> above to do a second OAuth 1.0a login</li>
              <li>After returning, click <strong>"Validate All Tokens"</strong> to check each token</li>
              <li>If Auth #1's token shows <span className="token-status-invalid">INVALID</span>, the re-auth revoked it</li>
              <li>Repeat multiple times — the customer reports it doesn't always happen</li>
            </ol>
          </div>

          {/* Summary */}
          <div className="debug-summary mb-4">
            <div className="grid grid-cols-2 gap-4" style={{ maxWidth: '400px' }}>
              <div>
                <span className="text-gray-400 text-sm">Total Auths</span>
                <p className="font-bold text-xl">{totalAuths}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Tokens Tracked</span>
                <p className="font-bold text-xl">{tokenHistory.length}</p>
              </div>
            </div>
          </div>

          {/* Token list */}
          {tokenHistory.length === 0 ? (
            <div className="text-gray-400 text-sm" style={{ padding: '1rem', textAlign: 'center', border: '1px dashed #333', borderRadius: '6px' }}>
              No tokens recorded yet. Log in to start tracking, then re-authenticate to test revocation.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Token History (newest first)</span>
                <button
                  onClick={validateAllTokens}
                  disabled={validatingAll}
                  className="btn btn-secondary text-sm"
                  style={{ padding: '0.4rem 0.8rem' }}
                >
                  {validatingAll ? 'Validating…' : '✓ Validate All Tokens'}
                </button>
              </div>
              <div className="space-y-2">
                {tokenHistory.map((token) => (
                  <div
                    key={token.id}
                    className={`token-entry ${token.isCurrent ? 'token-current' : ''} ${
                      token.lastValidationResult === 'invalid' ? 'token-revoked' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="token-auth-badge">Auth #{token.authSequence}</span>
                          {token.isCurrent && <span className="token-badge-current">CURRENT</span>}
                          {token.tokenChanged && <span className="token-badge-changed">NEW TOKEN</span>}
                          {!token.tokenChanged && token.authSequence > 1 && (
                            <span className="token-badge-same">SAME TOKEN</span>
                          )}
                          {token.lastValidationResult === 'valid' && (
                            <span className="token-status-valid">✓ VALID</span>
                          )}
                          {token.lastValidationResult === 'invalid' && (
                            <span className="token-status-invalid">✗ REVOKED</span>
                          )}
                          {token.lastValidationResult === 'error' && (
                            <span className="token-status-error">⚠ ERROR</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>
                            <span className="text-gray-500">Token:</span>{' '}
                            <code className="token-value">…{token.accessTokenSuffix}</code>
                            <span className="text-gray-500" style={{ marginLeft: '0.75rem' }}>Secret:</span>{' '}
                            <code className="token-value">…{token.accessTokenSecretSuffix}</code>
                          </div>
                          <div>
                            <span className="text-gray-500">Obtained:</span>{' '}
                            {new Date(token.obtainedAt).toLocaleString()}
                            {token.lastValidatedAt && (
                              <>
                                <span className="text-gray-500" style={{ marginLeft: '0.75rem' }}>Validated:</span>{' '}
                                {new Date(token.lastValidatedAt).toLocaleString()}
                              </>
                            )}
                          </div>
                          {token.lastValidationError && (
                            <div className="text-sm" style={{ color: '#ff6b6b' }}>
                              Error: {token.lastValidationError}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => validateToken(token.id)}
                        disabled={validatingTokenId === token.id || validatingAll}
                        className="btn btn-secondary text-sm"
                        style={{ padding: '0.35rem 0.7rem', whiteSpace: 'nowrap' }}
                      >
                        {validatingTokenId === token.id ? '…' : 'Validate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

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
                      <p className="text-gray-800 mb-3">{JSON.stringify(message.message_data, null, 2)}</p>
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
