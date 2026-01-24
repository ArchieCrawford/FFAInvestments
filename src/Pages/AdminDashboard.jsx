import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Wallet,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Plus,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function buildSchwabSummary(rows) {
  let totalValue = 0;
  let latestSnapshotTs = null;

  for (const row of rows || []) {
    const mv = Number(row.market_value || 0);
    if (Number.isFinite(mv)) totalValue += mv;
    if (row.snapshot_date) {
      const ts = new Date(row.snapshot_date).getTime();
      if (Number.isFinite(ts) && (!latestSnapshotTs || ts > latestSnapshotTs)) {
        latestSnapshotTs = ts;
      }
    }
  }

  return {
    totalValue,
    latestSnapshotTs,
    dateLabel: latestSnapshotTs
      ? format(new Date(latestSnapshotTs), "MMM dd, yyyy h:mm a")
      : "Data unavailable",
  };
}

export default function AdminDashboard() {
  const [orgHistory, setOrgHistory] = useState([]);
  const [orgHistoryLoading, setOrgHistoryLoading] = useState(true);
  const [orgHistoryError, setOrgHistoryError] = useState(null);

  // Members (org-wide headcount, KYC, etc.)
  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Member accounts (for "Active Accounts" card)
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_accounts")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // Latest unit price snapshot for club
  const { data: latestUnitPrice } = useQuery({
    queryKey: ["latest-unit-price"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unit_prices")
        .select("*")
        .order("price_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    },
  });

  // Recent canonical ledger entries from member_unit_transactions
  const {
    data: recentLedger = [],
    isLoading: recentLedgerLoading,
    error: recentLedgerError,
  } = useQuery({
    queryKey: ["recent-ledger"],
    queryFn: async () => {
      // NOTE: using tx_date / tx_type / cash_amount / notes from new schema
      const { data, error } = await supabase
        .from("member_unit_transactions")
        .select("id, member_id, tx_date, tx_type, cash_amount, units_delta, unit_value_at_tx, notes")
        .order("tx_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  // Fallback AUM from v_member_positions_as_of (if unit_prices.total_aum is unavailable)
  const {
    data: latestPositions = [],
    isLoading: positionsLoading,
    error: positionsError,
  } = useQuery({
    queryKey: ["latest-member-positions"],
    queryFn: async () => {
      // Get latest snapshot rows from v_member_positions_as_of
      const { data, error } = await supabase
        .from("v_member_positions_as_of")
        .select("as_of_date,current_value")
        .order("as_of_date", { ascending: false })
        .limit(500); // keep it reasonable

      if (error) throw error;
      return data || [];
    },
  });

  const { data: schwabPositions = [] } = useQuery({
    queryKey: ["latest_schwab_positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("latest_schwab_positions")
        .select("market_value,snapshot_date");

      if (error) throw error;
      return data || [];
    },
  });

  const schwabSummary = useMemo(
    () => buildSchwabSummary(schwabPositions),
    [schwabPositions]
  );

  // derive AUM from view if needed
  const viewAumFallback = useMemo(() => {
    if (!latestPositions || latestPositions.length === 0) return null;
    const latestDate = latestPositions[0].as_of_date;
    if (!latestDate) return null;

    return latestPositions
      .filter((row) => row.as_of_date === latestDate)
      .reduce(
        (sum, row) => sum + Number(row.current_value || 0),
        0
      );
  }, [latestPositions]);

  // Org-level historical AUM curve from org_balance_history
  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      setOrgHistoryLoading(true);
      setOrgHistoryError(null);
      try {
        const { data, error } = await supabase
          .from("org_balance_history")
          .select("balance_date, total_value")
          .order("balance_date", { ascending: true });

        if (error) throw error;
        if (active) setOrgHistory(data || []);
      } catch (err) {
        if (active) {
          setOrgHistory([]);
          setOrgHistoryError(err.message || "Unable to load club history");
        }
      } finally {
        if (active) setOrgHistoryLoading(false);
      }
    };
    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  const orgHistoryData = useMemo(() => {
    return (orgHistory || []).map((entry) => ({
      date: entry.balance_date
        ? format(new Date(entry.balance_date), "MMM yyyy")
        : "Unknown",
      total_value: Number(entry.total_value) || 0,
    }));
  }, [orgHistory]);

  const latestOrgSnapshot = useMemo(() => {
    if (!orgHistory || orgHistory.length === 0) return null;
    const last = orgHistory[orgHistory.length - 1];
    const totalValue = Number(last.total_value) || 0;
    const dateLabel = last.balance_date
      ? format(new Date(last.balance_date), "MMM dd, yyyy")
      : "—";
    return { totalValue, dateLabel };
  }, [orgHistory]);

  const totalAUM =
    (latestUnitPrice && latestUnitPrice.total_aum) ??
    viewAumFallback ??
    0;
  const totalMembers = members.length;
  const activeAccounts = accounts.filter((a) => a.status === "active").length;
  const pendingKYC = members.filter((m) => m.kyc_status === "pending").length;

  const tasks = [
    pendingKYC > 0 && {
      type: "warning",
      title: `${pendingKYC} pending KYC approval${
        pendingKYC > 1 ? "s" : ""
      }`,
      action: "Review Members",
      link: createPageUrl("AdminUsers"),
    },
    !latestUnitPrice?.is_finalized && {
      type: "info",
      title: "Unit price not finalized for current period",
      action: "Finalize Now",
      link: createPageUrl("AdminUnitPrice"),
    },
  ].filter(Boolean);

  return (
    <div className="p-6 lg:p-8 bg-bg min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-default tracking-tight mb-2">
              Admin Dashboard
            </h1>
            <p className="text-muted text-sm">Club overview and quick actions</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to={createPageUrl("AdminUsers")}>
              <Button className="bg-primary hover:bg-primary gap-2">
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg bg-primary text-white relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium opacity-90">
                  Assets Under Management
                </CardTitle>
                <DollarSign className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold leading-tight">
                $
                {totalAUM.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-muted">
                  Total Members
                </CardTitle>
                <Users className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-default leading-tight">
                {totalMembers}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-muted">
                  Active Accounts
                </CardTitle>
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-default leading-tight">
                {activeAccounts}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-muted">
                  Unit Price
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-default leading-tight">
                ${latestUnitPrice?.price?.toFixed(4) || "0.00"}
              </div>
              <Badge
                variant={latestUnitPrice?.is_finalized ? "default" : "outline"}
                className="mt-2"
              >
                {latestUnitPrice?.is_finalized ? "Finalized" : "Pending"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Schwab Summary – driven by latest_schwab_positions snapshot_date */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg xl:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-muted">
                  Charles Schwab Positions
                </CardTitle>
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-default">
                $
                {schwabSummary.totalValue.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <p className="text-sm text-muted">
                As of {schwabSummary.dateLabel}
              </p>
              <Link to="/admin/schwab">
                <Button className="mt-2 w-full gap-2">
                  View Schwab Positions <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Org portfolio over time */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-default">
              Club total portfolio value over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgHistoryLoading ? (
              <p className="text-muted">Loading portfolio trend…</p>
            ) : orgHistoryError ? (
              <p className="text-red-500">{orgHistoryError}</p>
            ) : orgHistoryData.length === 0 ? (
              <p className="text-muted">No portfolio history available.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={orgHistoryData}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#475569" />
                    <YAxis
                      stroke="#475569"
                      tickFormatter={(value) =>
                        `$${Number(value).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}`
                      }
                    />
                    <Tooltip
                      formatter={(value) =>
                        `$${Number(value).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="total_value"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        {tasks.length > 0 && (
          <Card className="border-none shadow-lg border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-default flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg bg-bg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {task.type === "warning" ? (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-600" />
                    )}
                    <span className="font-medium text-default">
                      {task.title}
                    </span>
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

        {/* Recent transactions + quick actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-default">
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLedgerLoading ? (
                <p className="text-muted text-center py-8">
                  Loading recent transactions…
                </p>
              ) : recentLedgerError ? (
                <p className="text-red-500 text-center py-8">
                  Failed to load transactions
                </p>
              ) : recentLedger.length === 0 ? (
                <p className="text-muted text-center py-8">
                  No recent transactions
                </p>
              ) : (
                <div className="space-y-3">
                  {recentLedger.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-bg transition-all"
                    >
                      <div>
                        <p className="font-semibold text-default capitalize">
                          {entry.tx_type?.replace("_", " ")}
                        </p>
                        <p className="text-sm text-muted">
                          {entry.notes || "No memo"}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {entry.tx_date
                            ? format(new Date(entry.tx_date), "MMM dd, yyyy")
                            : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            entry.cash_amount >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {entry.cash_amount >= 0 ? "+" : "-"}$
                          {Math.abs(entry.cash_amount || 0).toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                            }
                          )}
                        </p>
                        {entry.units_delta && entry.units_delta !== 0 && (
                          <p className="text-xs text-muted">
                            {entry.units_delta > 0 ? "+" : ""}
                            {Number(entry.units_delta).toFixed(4)} units
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
              <CardTitle className="text-lg font-bold text-default">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link to={createPageUrl("AdminUsers")}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary-soft hover:border-blue-300"
                >
                  <Users className="w-6 h-6" />
                  <span className="text-sm font-medium">Manage Members</span>
                </Button>
              </Link>
              <Link to={createPageUrl("AdminAccounts")}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary-soft hover:border-blue-300"
                >
                  <Wallet className="w-6 h-6" />
                  <span className="text-sm font-medium">Manage Accounts</span>
                </Button>
              </Link>
              <Link to={createPageUrl("AdminLedger")}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary-soft hover:border-blue-300"
                >
                  <DollarSign className="w-6 h-6" />
                  <span className="text-sm font-medium">
                    Record Transaction
                  </span>
                </Button>
              </Link>
              <Link to={createPageUrl("AdminUnitPrice")}>
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center gap-2 hover:bg-primary-soft hover:border-blue-300"
                >
                  <TrendingUp className="w-6 h-6" />
                  <span className="text-sm font-medium">
                    Update Unit Price
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
