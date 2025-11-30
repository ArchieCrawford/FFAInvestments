import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentMember } from "@/lib/authHooks";
import { Page } from "../components/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { member, loading: memberLoading } = useCurrentMember();
  const [selectedPositionsDate, setSelectedPositionsDate] = useState("latest");
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Check session to prevent redirect loop
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setSessionLoading(false);
    }
    checkSession();
  }, []);

  // Only redirect if both member AND session are null (truly not authenticated)
  // Do NOT redirect if member exists but timeline is empty
  useEffect(() => {
    if (!memberLoading && !sessionLoading && !member && !session) {
      navigate("/login", { replace: true });
    }
  }, [memberLoading, sessionLoading, member, session, navigate]);

  const {
    data: timeline = [],
    isLoading: timelineLoading,
    error: timelineError,
  } = useQuery({
    queryKey: ["member-timeline", member?.member_id, member?.email, member?.member_name],
    enabled: !!member,
    queryFn: async () => {
      // Determine filter column and value based on available data
      // Prefer member_id, fallback to email, then member_name
      let filterColumn, filterValue;
      if (member.member_id) {
        filterColumn = "member_id";
        filterValue = member.member_id;
      } else if (member.email) {
        filterColumn = "email";
        filterValue = member.email;
      } else {
        filterColumn = "member_name";
        filterValue = member.member_name;
      }

      console.log('[MemberDashboard] Timeline query filter:', { filterColumn, filterValue });

      const { data, error } = await supabase
        .from("member_monthly_balances")
        .select("*")
        .eq(filterColumn, filterValue)
        .order("report_date", { ascending: true });
      
      if (error) {
        console.error('[MemberDashboard] Timeline query error:', error);
        throw error;
      }

      console.log('[MemberDashboard] Timeline rows found:', data?.length || 0);
      return data || [];
    },
  });

  const {
    data: positions = [],
    isLoading: positionsLoading,
    error: positionsError,
  } = useQuery({
    queryKey: ["member-positions", member?.member_id, member?.id],
    enabled: !!member,
    queryFn: async () => {
      const idsToTry = [member.member_id, member.id].filter(Boolean);
      for (const id of idsToTry) {
        const { data, error } = await supabase
          .from("v_member_positions_as_of")
          .select("*")
          .eq("member_id", id)
          .order("as_of_date", { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) return data;
      }
      return [];
    },
  });

  const latest = timeline.length > 0 ? timeline[timeline.length - 1] : null;

  const portfolioValue = latest ? Number(latest.portfolio_value || latest.value || 0) : 0;
  const totalUnits = latest ? Number(latest.total_units || latest.units || 0) : 0;
  const totalContribution = latest
    ? Number(latest.total_contribution || latest.contributions || 0)
    : 0;
  const unitValue = totalUnits > 0 ? portfolioValue / totalUnits : 0;
  const lastGrowthAmount = latest ? Number(latest.growth_amount || 0) : 0;
  const lastGrowthPct = latest ? Number(latest.growth_pct || 0) : 0;
  const ownershipPct =
    latest && latest.ownership_pct != null ? Number(latest.ownership_pct) : null;

  const chartData = timeline.map((entry) => ({
    date: entry.report_date
      ? format(new Date(entry.report_date), "MMM yy")
      : entry.for_month
      ? format(new Date(entry.for_month), "MMM yy")
      : "",
    value: Number(entry.portfolio_value || entry.value || 0),
  }));

  const positionDates = useMemo(() => {
    const dates = Array.from(
      new Set(
        positions
          .map((p) => p.as_of_date)
          .filter(Boolean)
      )
    );
    return dates.sort((a, b) => new Date(a) - new Date(b));
  }, [positions]);

  const latestPositionsDate =
    positionDates.length > 0 ? positionDates[positionDates.length - 1] : null;

  const effectivePositionsDate =
    selectedPositionsDate === "latest" ? latestPositionsDate : selectedPositionsDate;

  const positionsForSelectedDate = useMemo(() => {
    if (!effectivePositionsDate) return [];
    return positions.filter((p) => p.as_of_date === effectivePositionsDate);
  }, [positions, effectivePositionsDate]);

  const totalValueForSelectedDate = positionsForSelectedDate.reduce((sum, p) => {
    const v =
      p.position_value ??
      p.market_value ??
      p.position_market_value ??
      p.value ??
      0;
    return sum + Number(v || 0);
  }, 0);

  const positionsTableRows = positionsForSelectedDate.map((p) => {
    const rawValue =
      p.position_value ??
      p.market_value ??
      p.position_market_value ??
      p.value ??
      0;
    const value = Number(rawValue || 0);
    const pctOfMember =
      totalValueForSelectedDate > 0 ? (value / totalValueForSelectedDate) * 100 : 0;

    return {
      symbol: p.symbol,
      description: p.description || p.security_name || "",
      units: Number(p.units || p.quantity || p.long_quantity || 0),
      value,
      pctOfMember,
    };
  });

  if (memberLoading) {
    return (
      <Page title="Member Dashboard">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-muted mt-4">Loading...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <Page
      title="Member Dashboard"
      subtitle="View your investment performance"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {(timelineError || positionsError) && (
          <div className="card p-4 border-l-4 border-red-500 text-sm text-red-500">
            {timelineError && <div>Timeline error: {timelineError.message}</div>}
            {positionsError && <div>Positions error: {positionsError.message}</div>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-default">
              Welcome, {member.full_name || member.member_name}
            </h1>
            <p className="text-muted">
              Member since{" "}
              {member.join_date
                ? format(new Date(member.join_date), "MMM dd, yyyy")
                : "—"}
            </p>
          </div>
          <Link to="/member/contribute">
            <Button className="bg-primary hover:bg-primary gap-2">
              <DollarSign className="w-4 h-4" />
              Make a Contribution
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg bg-primary text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                $
                {portfolioValue.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </div>
              {ownershipPct != null && (
                <p className="text-xs mt-2 opacity-90">
                  Ownership of club: {(ownershipPct * 100).toFixed(2)}%
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted">
                Total Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-default">
                $
                {totalContribution.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted">
                Units Owned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-default">
                {totalUnits.toFixed(4)}
              </div>
              <p className="text-xs text-muted mt-1">
                Unit value: ${unitValue.toFixed(4)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2 flex justify-between items-center">
              <CardTitle className="text-sm font-medium text-muted">
                Last Period Change
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastGrowthAmount >= 0 ? "+" : "-"}$
                {Math.abs(lastGrowthAmount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <Badge
                variant="outline"
                className={
                  lastGrowthPct > 0
                    ? "border-emerald-500 text-emerald-600"
                    : lastGrowthPct < 0
                    ? "border-red-500 text-red-600"
                    : ""
                }
              >
                {lastGrowthPct >= 0 ? "+" : ""}
                {(lastGrowthPct * 100).toFixed(2)}%
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-default flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Portfolio value over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineLoading ? (
              <p className="text-muted">Loading performance data…</p>
            ) : chartData.length === 0 ? (
              <p className="text-muted">No history available yet.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(v) =>
                        `$${Number(v).toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}`
                      }
                    />
                    <Tooltip
                      formatter={(value) =>
                        `$${Number(value).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-lg font-bold text-default">
              Your positions
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">As of</span>
              <Select
                value={selectedPositionsDate}
                onValueChange={setSelectedPositionsDate}
                disabled={positionDates.length === 0}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  {positionDates.map((d) => (
                    <SelectItem key={d} value={d}>
                      {format(new Date(d), "MMM dd, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {positionsLoading ? (
              <p className="text-muted">Loading positions…</p>
            ) : positionsTableRows.length === 0 ? (
              <p className="text-muted">
                No positions found for the selected date.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="py-2 pr-4">Symbol</th>
                      <th className="py-2 pr-4">Description</th>
                      <th className="py-2 pr-4 text-right">Units</th>
                      <th className="py-2 pr-4 text-right">Value</th>
                      <th className="py-2 pr-0 text-right">% of portfolio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionsTableRows.map((row) => (
                      <tr key={row.symbol} className="border-b border-border/60">
                        <td className="py-2 pr-4 font-semibold">
                          {row.symbol}
                        </td>
                        <td className="py-2 pr-4 text-muted">
                          {row.description || "—"}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono">
                          {row.units.toFixed(4)}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono">
                          $
                          {row.value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-2 pr-0 text-right">
                          {row.pctOfMember.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted mt-2 text-right">
                  Total: $
                  {totalValueForSelectedDate.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-default">
              Next steps
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Link to="/member/contribute">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center gap-2"
              >
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Make a contribution</span>
              </Button>
            </Link>
            <Link to="/member/statements">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center gap-2"
              >
                <ArrowRight className="w-5 h-5" />
                <span className="text-sm font-medium">View statements</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
