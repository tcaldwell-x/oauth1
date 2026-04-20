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

interface AdsAccount {
  id: string
  name: string
  business_name?: string
  approval_status: string
  salt?: string
}

interface EndpointResult {
  loading: boolean
  data: any | null
  error: string | null
  status: number | null
  timestamp: string | null
}

const EMPTY_RESULT: EndpointResult = { loading: false, data: null, error: null, status: null, timestamp: null }

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<TwitterUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ads state
  const [accounts, setAccounts] = useState<AdsAccount[]>([])
  const [accountsResult, setAccountsResult] = useState<EndpointResult>(EMPTY_RESULT)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  // Per-endpoint results
  const [fundingResult, setFundingResult] = useState<EndpointResult>(EMPTY_RESULT)
  const [paymentResult, setPaymentResult] = useState<EndpointResult>(EMPTY_RESULT)
  const [setupIntentResult, setSetupIntentResult] = useState<EndpointResult>(EMPTY_RESULT)
  const [confirmCardResult, setConfirmCardResult] = useState<EndpointResult>(EMPTY_RESULT)

  // confirm-card body editor
  const [confirmCardBody, setConfirmCardBody] = useState('{}')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/twitter/profile')
        if (!response.ok) {
          if (response.status === 401) { router.push('/'); return }
          throw new Error('Failed to fetch profile')
        }
        setUser(await response.json())
      } catch {
        setError('Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const fetchEndpoint = async (
    url: string,
    method: 'GET' | 'POST',
    setter: (r: EndpointResult) => void,
    body?: any,
  ) => {
    setter({ loading: true, data: null, error: null, status: null, timestamp: null })
    try {
      const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
      if (method === 'POST' && body !== undefined) {
        opts.body = JSON.stringify(body)
      }
      const res = await fetch(url, opts)
      const json = await res.json()
      setter({ loading: false, data: json, error: null, status: res.status, timestamp: new Date().toLocaleTimeString() })
      return { ok: res.ok, data: json }
    } catch (err: any) {
      setter({ loading: false, data: null, error: err.message, status: null, timestamp: new Date().toLocaleTimeString() })
      return { ok: false, data: null }
    }
  }

  const handleFetchAccounts = async () => {
    const result = await fetchEndpoint('/api/ads/accounts', 'GET', setAccountsResult)
    if (result.ok && result.data?.data) {
      setAccounts(result.data.data)
      if (result.data.data.length > 0 && !selectedAccountId) {
        setSelectedAccountId(result.data.data[0].id)
      }
    }
  }

  const handleFetchFunding = () => {
    fetchEndpoint(`/api/ads/funding-instruments?account_id=${selectedAccountId}`, 'GET', setFundingResult)
  }

  const handleFetchPayment = () => {
    fetchEndpoint(`/api/ads/payment-methods?account_id=${selectedAccountId}`, 'GET', setPaymentResult)
  }

  const handleSetupIntent = () => {
    fetchEndpoint('/api/ads/setup-intent', 'POST', setSetupIntentResult, { account_id: selectedAccountId })
  }

  const handleConfirmCard = () => {
    let body: any = {}
    try {
      body = JSON.parse(confirmCardBody)
    } catch {
      setConfirmCardResult({ loading: false, data: null, error: 'Invalid JSON body', status: null, timestamp: new Date().toLocaleTimeString() })
      return
    }
    fetchEndpoint('/api/ads/confirm-card', 'POST', setConfirmCardResult, { account_id: selectedAccountId, ...body })
  }

  const handleLogout = () => {
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
              <div style={{height: '1rem', backgroundColor: '#333', borderRadius: '4px', width: '25%', marginBottom: '1rem'}}></div>
              <div style={{height: '1rem', backgroundColor: '#333', borderRadius: '4px', width: '75%', marginBottom: '0.5rem'}}></div>
              <div style={{height: '1rem', backgroundColor: '#333', borderRadius: '4px', width: '50%'}}></div>
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
            <button onClick={() => router.push('/')} className="btn btn-primary mt-4">Back to Login</button>
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
              <svg className="x-logo" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">Ads API Debugger</h1>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="card">
            <div className="flex items-start space-x-4">
              <img src={user.profile_image_url.replace('_normal', '_bigger')} alt={user.name} className="profile-img" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600">@{user.screen_name}</p>
                <div className="flex space-x-6 mt-3 text-sm text-gray-600">
                  <span><strong>{user.followers_count.toLocaleString()}</strong> Followers</span>
                  <span><strong>{user.friends_count.toLocaleString()}</strong> Following</span>
                  <span><strong>{user.statuses_count.toLocaleString()}</strong> Posts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Fetch Ads Accounts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Ads Accounts</h3>
              <p className="text-gray-400 text-sm mt-1">GET /11/accounts</p>
            </div>
            <button onClick={handleFetchAccounts} disabled={accountsResult.loading} className="btn btn-primary">
              {accountsResult.loading ? 'Loading...' : 'Fetch Accounts'}
            </button>
          </div>

          {accounts.length > 0 && (
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Select Account:</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="account-select"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.id} - {acc.name || acc.business_name || 'Unnamed'} ({acc.approval_status})
                  </option>
                ))}
              </select>
            </div>
          )}

          <ResultPanel result={accountsResult} />
        </div>

        {/* Endpoint buttons - only show when an account is selected */}
        {selectedAccountId && (
          <>
            {/* Funding Instruments */}
            <EndpointCard
              title="Funding Instruments"
              subtitle={`GET /11/accounts/${selectedAccountId}/funding_instruments`}
              method="GET"
              result={fundingResult}
              onFetch={handleFetchFunding}
            />

            {/* Payment Methods */}
            <EndpointCard
              title="Payment Methods"
              subtitle={`GET /11/accounts/${selectedAccountId}/billing/payment-methods`}
              method="GET"
              result={paymentResult}
              onFetch={handleFetchPayment}
            />

            {/* Setup Intent */}
            <EndpointCard
              title="Setup Intent"
              subtitle={`POST /11/accounts/${selectedAccountId}/billing/setup-intent`}
              method="POST"
              result={setupIntentResult}
              onFetch={handleSetupIntent}
            />

            {/* Confirm Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirm Card</h3>
                  <p className="text-gray-400 text-sm mt-1">POST /11/accounts/{selectedAccountId}/billing/confirm-card</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="method-badge method-post">POST</span>
                  <button onClick={handleConfirmCard} disabled={confirmCardResult.loading} className="btn btn-primary">
                    {confirmCardResult.loading ? 'Loading...' : 'Send'}
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-400 block mb-2">Request Body (JSON):</label>
                <textarea
                  value={confirmCardBody}
                  onChange={(e) => setConfirmCardBody(e.target.value)}
                  className="json-input"
                  rows={4}
                  spellCheck={false}
                  placeholder='{"setup_intent_id": "...", "payment_method_id": "..."}'
                />
              </div>
              <ResultPanel result={confirmCardResult} />
            </div>
          </>
        )}

        {/* API Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">X Ads API v11 Endpoints</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="method-badge method-get">GET</span>
              <span className="text-sm">/11/accounts - List ads accounts</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="method-badge method-get">GET</span>
              <span className="text-sm">/11/accounts/:id/funding_instruments</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="method-badge method-get">GET</span>
              <span className="text-sm">/11/accounts/:id/billing/payment-methods</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="method-badge method-post">POST</span>
              <span className="text-sm">/11/accounts/:id/billing/setup-intent</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="method-badge method-post">POST</span>
              <span className="text-sm">/11/accounts/:id/billing/confirm-card</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EndpointCard({ title, subtitle, method, result, onFetch }: {
  title: string
  subtitle: string
  method: 'GET' | 'POST'
  result: EndpointResult
  onFetch: () => void
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`method-badge ${method === 'GET' ? 'method-get' : 'method-post'}`}>{method}</span>
          <button onClick={onFetch} disabled={result.loading} className="btn btn-primary">
            {result.loading ? 'Loading...' : 'Send'}
          </button>
        </div>
      </div>
      <ResultPanel result={result} />
    </div>
  )
}

function ResultPanel({ result }: { result: EndpointResult }) {
  if (!result.data && !result.error && !result.loading) return null

  if (result.loading) {
    return (
      <div className="result-panel">
        <div className="animate-pulse">
          <div style={{height: '0.75rem', backgroundColor: '#333', borderRadius: '4px', width: '60%'}}></div>
        </div>
      </div>
    )
  }

  const isError = result.status !== null && result.status >= 400
  const statusColor = isError ? '#f87171' : '#4ade80'

  return (
    <div className={`result-panel ${isError ? 'result-error' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {result.status && (
            <span className="text-sm font-bold" style={{ color: statusColor }}>
              {result.status}
            </span>
          )}
          {result.timestamp && (
            <span className="text-xs text-gray-500">{result.timestamp}</span>
          )}
        </div>
        {result.data && (
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(result.data, null, 2))}
            className="btn btn-secondary text-xs"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            Copy
          </button>
        )}
      </div>
      {result.error && <pre className="json-output" style={{ color: '#f87171' }}>{result.error}</pre>}
      {result.data && <pre className="json-output">{JSON.stringify(result.data, null, 2)}</pre>}
    </div>
  )
}
