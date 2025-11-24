import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, Wallet, DollarSign, TrendingUp, AlertCircle,
  CheckCircle, Clock, Plus, ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const [orgHistory, setOrgHistory] = useState([])
  const [orgHistoryLoading, setOrgHistoryLoading] = useState(true)
  const [orgHistoryError, setOrgHistoryError] = useState(null)

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: unitPrices = [] } = useQuery({
    queryKey: ['unit-prices'],
    queryFn: () => base44.entities.UnitPrice.list('-price_date', 1),
  });

  const { data: recentLedger = [] } = useQuery({
    queryKey: ['recent-ledger'],
    queryFn: () => base44.entities.LedgerEntry.list('-created_date', 10),
  });

  const latestUnitPrice = unitPrices[0];
  const totalAUM = latestUnitPrice?.total_aum || 0;
  const totalMembers = users.filter(u => u.role === 'user').length;
  const activeAccounts = accounts.filter(a => a.status === 'active').length;
  const pendingKYC = users.filter(u => u.kyc_status === 'pending').length;

  useEffect(() => {
    let active = true
    const loadHistory = async () => {
      setOrgHistoryLoading(true)
      setOrgHistoryError(null)
      try {
        const { data, error } = await supabase
          .from('org_balance_history')
          .select(`
            balance_date,
            total_value
          `)
          .order('balance_date', { ascending: true })
        if (error) throw error
        if (active) setOrgHistory(data || [])
      } catch (err) {
        if (active) {
          setOrgHistory([])
          setOrgHistoryError(err.message || 'Unable to load club history')
        }
      } finally {
        if (active) setOrgHistoryLoading(false)
      }
    }
    loadHistory()
    return () => {
      active = false
    }
  }, [])

  const orgHistoryData = useMemo(() => {
    return (orgHistory || []).map(entry => ({
      date: entry.balance_date ? format(new Date(entry.balance_date), 'MMM yyyy') : 'Unknown',
      total_value: Number(entry.total_value) || 0,
    }))
  }, [orgHistory])

  const latestOrgSnapshot = useMemo(() => {
    if (!orgHistory || orgHistory.length === 0) return null
    const last = orgHistory[orgHistory.length - 1]
    const totalValue = Number(last.total_value) || 0
    const dateLabel = last.balance_date ? format(new Date(last.balance_date), 'MMM dd, yyyy') : '—'
    return { totalValue, dateLabel }
  }, [orgHistory])

  const tasks = [
    pendingKYC > 0 && { 
      type: 'warning', 
      title: `${pendingKYC} pending KYC approval${pendingKYC > 1 ? 's' : ''}`,
      action: 'Review Members',
      link: createPageUrl("AdminUsers")
    },
    !latestUnitPrice?.is_finalized && {
      type: 'info',
      title: 'Unit price not finalized for current period',
      action: 'Finalize Now',
      link: createPageUrl("AdminUnitPrice")
    },
  ].filter(Boolean);

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
            <p className="text-slate-600">Manage your investment club</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl("AdminUsers")}>
              <Button className="bg-blue-900 hover:bg-blue-800 gap-2">
                <Plus className="w-4 h-4" />
                Add Member
              </Button>
            </Link>
            <Link to={createPageUrl("AdminLedger")}>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Record Transaction
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-900 to-blue-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium opacity-90">Assets Under Management</CardTitle>
                <DollarSign className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${totalAUM.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600">Total Members</CardTitle>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalMembers}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600">Active Accounts</CardTitle>
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{activeAccounts}</div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600">Unit Price</CardTitle>
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                ${latestUnitPrice?.price?.toFixed(4) || '0.00'}
              </div>
              <Badge variant={latestUnitPrice?.is_finalized ? "default" : "outline"} className="mt-2">
                {latestUnitPrice?.is_finalized ? 'Finalized' : 'Pending'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600">Charles Schwab Positions</CardTitle>
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-slate-900">
                ${latestOrgSnapshot ? latestOrgSnapshot.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
              </div>
              <p className="text-sm text-slate-500">As of {latestOrgSnapshot?.dateLabel || '—'}</p>
              <Link to="/admin/schwab">
                <Button className="mt-2 w-full gap-2">
                  View Schwab Positions <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">Club total portfolio value over time</CardTitle>
          </CardHeader>
          <CardContent>
            {orgHistoryLoading ? (
              <p className="text-slate-500">Loading portfolio trend…</p>
            ) : orgHistoryError ? (
              <p className="text-red-500">{orgHistoryError}</p>
            ) : orgHistoryData.length === 0 ? (
              <p className="text-slate-500">No portfolio history available.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={orgHistoryData}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#475569" />
                    <YAxis
                      stroke="#475569"
                      tickFormatter={(value) => `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                    />
                    <Tooltip
                      formatter={(value) =>
                        `$${Number(value).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      }
                    />
                    <Line type="monotone" dataKey="total_value" stroke="#2563eb" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks & Alerts */}
        {tasks.length > 0 && (
          <Card className="border-none shadow-lg border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    {task.type === 'warning' ? (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-600" />
                    )}
                    <span className="font-medium text-slate-900">{task.title}</span>
                  </div>
                  <Link to={task.link}>
                    <Button variant="outline" size="sm" className="gap-2">
                      {task.action} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLedger.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No recent transactions</p>
              ) : (
                <div className="space-y-3">
                  {recentLedger.map(entry => (
                    <div 
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 capitalize">
                          {entry.entry_type.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-slate-500">{entry.memo || 'No memo'}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {format(new Date(entry.entry_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${entry.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {entry.amount >= 0 ? '+' : ''}${Math.abs(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        {entry.units_delta !== 0 && (
                          <p className="text-xs text-slate-500">
                            {entry.units_delta > 0 ? '+' : ''}{entry.units_delta.toFixed(4)} units
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link to={createPageUrl("AdminUsers")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300">
                  <Users className="w-6 h-6" />
                  <span className="text-sm font-medium">Manage Members</span>
                </Button>
              </Link>
              <Link to={createPageUrl("AdminAccounts")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300">
                  <Wallet className="w-6 h-6" />
                  <span className="text-sm font-medium">Manage Accounts</span>
                </Button>
              </Link>
              <Link to={createPageUrl("AdminLedger")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300">
                  <DollarSign className="w-6 h-6" />
                  <span className="text-sm font-medium">Record Transaction</span>
                </Button>
              </Link>
              <Link to={createPageUrl("AdminUnitPrice")}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300">
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-sm font-medium">Update Unit Price</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
