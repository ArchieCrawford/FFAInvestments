import React, { useEffect, useMemo, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Edit2, Trash2, X } from 'lucide-react'
import { getUnitPriceHistory } from '../lib/ffaApi'
import { useAuth } from '../contexts/AuthContext'
import { Page } from './Page'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4
  }).format(value || 0)

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

const AdminUnitPriceNew = () => {
  const { profile } = useAuth()
  const [unitPrices, setUnitPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    unit_price: '',
    price_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    fetchUnitPrices()
  }, [])

  const fetchUnitPrices = async () => {
    setLoading(true)
    try {
      const data = await getUnitPriceHistory()
      // getUnitPriceHistory now returns normalized objects from club_unit_valuations
      const sorted = (data || []).sort((a, b) => new Date(b.price_date) - new Date(a.price_date))
      setUnitPrices(sorted)
    } catch (err) {
      setMessage({ type: 'error', text: 'Unable to load unit prices.' })
    }
    setLoading(false)
  }

  const currentPrice = unitPrices[0]
  const previousPrice = unitPrices[1]

  const change = useMemo(() => {
    if (!currentPrice || !previousPrice) return null
    const diff = currentPrice.unit_price - previousPrice.unit_price
    const pct = (diff / previousPrice.unit_price) * 100
    return { diff, pct }
  }, [currentPrice, previousPrice])

  const chartPath = useMemo(() => {
    if (unitPrices.length === 0) return ''
    const data = [...unitPrices].reverse()
    const prices = data.map(p => p.unit_price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1
    const width = 600
    const height = 200
    return prices
      .map((price, idx) => {
        const x = (idx / (prices.length - 1 || 1)) * width
        const y = height - ((price - min) / range) * height
        return `${idx === 0 ? 'M' : 'L'}${x},${y}`
      })
      .join(' ')
  }, [unitPrices])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: 'error', text: 'Unit prices are now derived from member balances and are not editable via the UI.' })
  }

  const handleEdit = (price) => {
    setMessage({ type: 'error', text: 'Unit price editing is disabled in the migrated schema.' })
  }

  const handleDelete = async (id) => {
    setMessage({ type: 'error', text: 'Unit price deletion is disabled in the migrated schema.' })
  }

  if (loading) {
    return (
      <Page title="Unit Value System">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted mt-4">Loading unit prices...</p>
          </div>
        </div>
      </Page>
    )
  }

  const actions = isAdmin && (
    <button className="btn-primary flex items-center gap-2" onClick={() => setEditingId(null)}>
      <Plus className="w-4 h-4" />
      New Entry
    </button>
  );

  return (
    <Page
      title="Unit Value System"
      subtitle="Historical view of the club unit price"
      actions={actions}
    >
      <div className="space-y-6">
        {message && (
          <div className={`card p-4 border-l-4 ${
            message.type === 'error' ? 'border-red-500' : 'border-green-500 bg-green-500/10'
          }`}>
            <p className={message.type === 'error' ? 'text-red-400' : 'text-green-600'}>{message.text}</p>
          </div>
        )}

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div className="card p-6">
              <p className="text-sm text-muted mb-1">Current Unit Price</p>
              <p className="text-3xl font-bold text-default mb-2">{currentPrice ? formatCurrency(currentPrice.unit_price) : '$0.0000'}</p>
              <p className="text-sm text-muted">{currentPrice ? `Updated ${formatDate(currentPrice.price_date)}` : 'No data yet'}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-muted mb-1">Change vs Previous</p>
              {change ? (
                <p className={`text-3xl font-bold mb-2 ${change.pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {change.pct >= 0 ? '+' : ''}
                  {change.pct.toFixed(2)}%
                </p>
              ) : (
                <p className="text-3xl font-bold text-muted mb-2">N/A</p>
              )}
            </div>
            <div className="card p-6">
              <p className="text-sm text-muted mb-1">History Entries</p>
              <p className="text-3xl font-bold text-default mb-2">{unitPrices.length}</p>
              <p className="text-sm text-muted">Stored in Supabase</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6 border-b border-border">
            <h3 className="text-2xl font-bold text-default">Price History</h3>
          </div>
          {unitPrices.length > 0 ? (
            <>
              <div className="p-6 overflow-x-auto">
                <svg width="100%" height="220" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="unitPriceGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--color-primary))" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="rgb(var(--color-primary))" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={chartPath} fill="none" stroke="url(#unitPriceGradient)" strokeWidth="3" />
                </svg>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Change</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Notes</th>
                      {isAdmin && <th className="px-6 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {unitPrices.map((price, index) => {
                      const prev = unitPrices[index + 1]
                      const diff = prev ? price.unit_price - prev.unit_price : null
                      const pct = prev ? (diff / prev.unit_price) * 100 : null
                      return (
                        <tr key={price.id} className="hover:bg-surface">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-default">{formatDate(price.price_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-default">{formatCurrency(price.unit_price)}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {pct !== null ? `${diff >= 0 ? '+' : ''}${pct.toFixed(2)}%` : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">{price.notes || '—'}</td>
                          {isAdmin && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button className="btn-primary-soft btn-sm" onClick={() => handleEdit(price)}>
                                  <Edit2 size={16} />
                                </button>
                                <button className="btn-primary-soft btn-sm" onClick={() => handleDelete(price.id)}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <p className="text-muted">No unit prices recorded yet.</p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="card p-6">
            <h3 className="text-xl font-bold text-default mb-3">Unit prices are derived</h3>
            <p className="text-muted">Unit prices are now calculated from member monthly balances and cannot be edited via this UI. Manage source balances or run the back-end process to adjust historical values.</p>
          </div>
        )}
      </div>
    </Page>
  )
}

export default AdminUnitPriceNew
