import React, { useEffect, useMemo, useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Calendar, Plus, Edit2, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
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
    const { data, error } = await supabase
      .from('unit_prices')
      .select('*')
      .order('price_date', { ascending: false })

    if (error) {
      setMessage({ type: 'error', text: 'Unable to load unit prices.' })
    } else {
      setUnitPrices(data || [])
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
    if (!form.unit_price || !form.price_date) {
      setMessage({ type: 'error', text: 'Unit price and date are required.' })
      return
    }
    const payload = {
      unit_price: parseFloat(form.unit_price),
      price_date: form.price_date,
      notes: form.notes
    }
    let response
    if (editingId) {
      response = await supabase.from('unit_prices').update(payload).eq('id', editingId)
    } else {
      response = await supabase.from('unit_prices').insert(payload)
    }
    if (response.error) {
      setMessage({ type: 'error', text: response.error.message })
    } else {
      setMessage({ type: 'success', text: `Unit price ${editingId ? 'updated' : 'added'} successfully.` })
      setForm({
        unit_price: '',
        price_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setEditingId(null)
      fetchUnitPrices()
    }
  }

  const handleEdit = (price) => {
    setEditingId(price.id)
    setForm({
      unit_price: price.unit_price.toString(),
      price_date: price.price_date,
      notes: price.notes || ''
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this unit price entry?')) return
    const { error } = await supabase.from('unit_prices').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: 'Unable to delete this entry.' })
    } else {
      setMessage({ type: 'success', text: 'Unit price removed.' })
      fetchUnitPrices()
    }
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
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header">
            <p className="heading-md">{editingId ? 'Edit Unit Price' : 'Add Unit Price'}</p>
            {editingId && (
              <button type="button" className="btn btn-outline btn-pill" onClick={() => setEditingId(null)}>
                <X size={16} className="mr-2" />
                Cancel Edit
              </button>
            )}
          </div>
          <div className="grid-3">
            <div>
              <label className="text-muted text-sm">Unit Price</label>
              <input
                type="number"
                step="0.0001"
                className="input"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-muted text-sm">Price Date</label>
              <input
                type="date"
                className="input"
                value={form.price_date}
                onChange={(e) => setForm({ ...form, price_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-muted text-sm">Notes</label>
              <input
                type="text"
                className="input"
                placeholder="Optional"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-success btn-pill">
              {editingId ? 'Update Unit Price' : 'Add Unit Price'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AdminUnitPriceNew
