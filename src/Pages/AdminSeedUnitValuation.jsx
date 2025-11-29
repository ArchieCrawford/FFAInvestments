import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminSeedUnitValuation() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    setError(null)
    try {
      const { data: result, error: rpcError } = await supabase.rpc('api_get_dashboard')
      
      if (rpcError) throw rpcError
      
      const totalValue = result?.org_balance?.total_value || 0
      const totalUnits = result?.member_stats?.total_member_units || 0
      const balanceDate = result?.org_balance?.balance_date || new Date().toISOString().split('T')[0]
      const unitValue = totalUnits > 0 ? totalValue / totalUnits : 0

      setData({
        balance_date: balanceDate,
        total_value: totalValue,
        total_units: totalUnits,
        unit_value: unitValue
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!data) return
    
    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('club_unit_valuations')
        .upsert({
          valuation_date: data.balance_date,
          total_value: data.total_value,
          total_units_outstanding: data.total_units,
          unit_value: data.unit_value
        }, {
          onConflict: 'valuation_date'
        })

      if (insertError) throw insertError

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Loading dashboard data...</div>
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Error</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={fetchDashboardData}>Retry</button>
      </div>
    )
  }

  if (!data) {
    return <div style={{ padding: 20 }}>No data available</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Seed Unit Valuation</h1>
      <p>This tool computes and saves unit valuation from dashboard data.</p>
      
      <table style={{ marginTop: 20, borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>Balance Date:</td>
            <td style={{ padding: '8px 12px' }}>{data.balance_date}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>Total Value:</td>
            <td style={{ padding: '8px 12px' }}>${data.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>Total Units:</td>
            <td style={{ padding: '8px 12px' }}>{data.total_units.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>Computed Unit Value:</td>
            <td style={{ padding: '8px 12px', fontSize: '1.2em', color: '#0066cc' }}>
              ${data.unit_value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: 30 }}>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save unit valuation'}
        </button>
        
        {saved && (
          <span style={{ marginLeft: 15, color: 'green', fontWeight: 'bold' }}>
            ✓ Saved!
          </span>
        )}
      </div>

      <div style={{ marginTop: 30, padding: 15, background: '#f5f5f5', border: '1px solid #ddd' }}>
        <h3>SQL that will be executed:</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
{`INSERT INTO club_unit_valuations 
  (valuation_date, total_value, total_units_outstanding, unit_value)
VALUES 
  ('${data.balance_date}', ${data.total_value}, ${data.total_units}, ${data.unit_value})
ON CONFLICT (valuation_date) 
DO UPDATE SET
  total_value = EXCLUDED.total_value,
  total_units_outstanding = EXCLUDED.total_units_outstanding,
  unit_value = EXCLUDED.unit_value;`}
        </pre>
      </div>
    </div>
  )
}
