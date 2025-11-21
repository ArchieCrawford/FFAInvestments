import React, { useEffect, useMemo, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Edit2, Trash2, X } from 'lucide-react'
import { getUnitPriceHistory } from '../lib/ffaApi'
import { useAuth } from '../contexts/AuthContext'

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
      const rows = await getUnitPriceHistory()

      // Aggregate by report_date to compute unit price = sum(portfolio_value)/sum(total_units)
      const map = new Map()
      ;(rows || []).forEach(r => {
        const d = r.report_date
        const pv = parseFloat(r.portfolio_value) || 0
        const tu = parseFloat(r.total_units) || 0
        if (!map.has(d)) map.set(d, { report_date: d, portfolio_value: 0, total_units: 0 })
        const cur = map.get(d)
        cur.portfolio_value += pv
        cur.total_units += tu
      })

      const aggregated = Array.from(map.values()).map(item => ({
        id: item.report_date,
        price_date: item.report_date,
        unit_price: item.total_units ? item.portfolio_value / item.total_units : 0,
        notes: null
      })).sort((a, b) => new Date(b.price_date) - new Date(a.price_date))

      setUnitPrices(aggregated)
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
      <div className="fullscreen-center">
        <div className="spinner-page" />
      </div>
    )
  }

  return (
    <div className="app-page">
      {message && (
        <div className="card" style={{ borderColor: message.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)' }}>
          <p style={{ color: message.type === 'error' ? '#fecaca' : '#bbf7d0' }}>{message.text}</p>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <p className="heading-lg">Unit Value System</p>
            <p className="text-muted">Historical view of the club unit price</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary btn-pill" onClick={() => setEditingId(null)}>
              <Plus size={16} className="mr-2" />
              New Entry
            </button>
          )}
        </div>
        <div className="grid-3">
          <div className="card" style={{ padding: '1.5rem' }}>
            <p className="text-muted">Current Unit Price</p>
            <p className="heading-lg">{currentPrice ? formatCurrency(currentPrice.unit_price) : '$0.0000'}</p>
            <p className="text-muted">{currentPrice ? `Updated ${formatDate(currentPrice.price_date)}` : 'No data yet'}</p>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <p className="text-muted">Change vs Previous</p>
            {change ? (
              <p className="heading-lg" style={{ color: change.pct >= 0 ? '#4ade80' : '#f87171' }}>
                {change.pct >= 0 ? '+' : ''}
                {change.pct.toFixed(2)}%
              </p>
            ) : (
              <p className="heading-lg text-muted">N/A</p>
            )}
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <p className="text-muted">History Entries</p>
            <p className="heading-lg">{unitPrices.length}</p>
            <p className="text-muted">Stored in Supabase</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <p className="heading-md">Price History</p>
        </div>
        {unitPrices.length > 0 ? (
          <>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg width="100%" height="220" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="unitPriceGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(59,130,246,0.7)" />
                    <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                  </linearGradient>
                </defs>
                <path d={chartPath} fill="none" stroke="url(#unitPriceGradient)" strokeWidth="3" />
              </svg>
            </div>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Unit Price</th>
                    <th>Change</th>
                    <th>Notes</th>
                    {isAdmin && <th />}
                  </tr>
                </thead>
                <tbody>
                  {unitPrices.map((price, index) => {
                    const prev = unitPrices[index + 1]
                    const diff = prev ? price.unit_price - prev.unit_price : null
                    const pct = prev ? (diff / prev.unit_price) * 100 : null
                    return (
                      <tr key={price.id}>
                        <td>{formatDate(price.price_date)}</td>
                        <td>{formatCurrency(price.unit_price)}</td>
                        <td style={{ color: diff >= 0 ? '#4ade80' : '#f87171' }}>
                          {pct !== null ? `${diff >= 0 ? '+' : ''}${pct.toFixed(2)}%` : '—'}
                        </td>
                        <td>{price.notes || '—'}</td>
                        {isAdmin && (
                          <td style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleEdit(price)}>
                              <Edit2 size={16} />
                            </button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleDelete(price.id)}>
                              <Trash2 size={16} />
                            </button>
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
          <p className="text-muted">No unit prices recorded yet.</p>
        )}
      </div>

      {isAdmin && (
        <div className="card">
          <div className="card-header">
            <p className="heading-md">Unit prices are derived</p>
          </div>
          <div className="card-content">
            <p className="text-muted">Unit prices are now calculated from member monthly balances and cannot be edited via this UI. Manage source balances or run the back-end process to adjust historical values.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUnitPriceNew
