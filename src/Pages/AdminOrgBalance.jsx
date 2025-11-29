import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Page } from '../components/Page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminOrgBalance() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    setError('');
    try {
      const { data, error } = await supabase
        .from('org_balance_history')
        .select('balance_date,total_value')
        .order('balance_date', { ascending: true });
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load org balance history');
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const chartData = useMemo(() => (history || []).map(row => ({
    date: row.balance_date ? format(new Date(row.balance_date), 'MMM yyyy') : '—',
    total_value: Number(row.total_value) || 0,
  })), [history]);

  const latest = useMemo(() => {
    if (!history.length) return null;
    const last = history[history.length - 1];
    return {
      date: last.balance_date ? format(new Date(last.balance_date), 'MMM dd, yyyy') : '—',
      value: Number(last.total_value) || 0,
    };
  }, [history]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
  };

  return (
    <Page title="Organization Balance History" subtitle="Track total club value over time">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
            <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className="w-4 h-4" /> {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
          <div className="text-right">
            {latest && (
              <div className="text-sm text-muted">
                Latest: <span className="font-semibold text-default">${latest.value.toLocaleString('en-US')}</span> on {latest.date}
              </div>
            )}
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-default">Total Portfolio Value Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted">Loading history…</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : chartData.length === 0 ? (
              <p className="text-muted">No history yet. Capture a Schwab snapshot and roll into org balance via Insights.</p>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#475569" />
                    <YAxis stroke="#475569" tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
                    <Tooltip formatter={(v) => `$${Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}/>
                    <Line type="monotone" dataKey="total_value" stroke="#2563eb" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-default">How this works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted space-y-3">
            <p>The organization balance history aggregates external brokerage balances (e.g. Schwab) plus internal ledger data. Use the Schwab Insights page to capture snapshots and push the latest value into this history.</p>
            <p>Snapshots can be rolled via the "Save snapshot to org history" button on the Schwab Insights page after a successful data pull.</p>
            <p>Historical values are useful for performance tracking and member reporting.</p>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
