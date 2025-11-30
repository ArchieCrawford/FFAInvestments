import React, { useEffect, useMemo } from "react";
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

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { member, loading: memberLoading } = useCurrentMember();

  // Redirect if not logged in
  useEffect(() => {
    if (!memberLoading && !member) {
      navigate("/login", { replace: true });
    }
  }, [memberLoading, member, navigate]);

  const memberEmail = member?.email || member?.member_email;

  const {
    data: timeline = [],
    isLoading: timelineLoading,
    error: timelineError,
  } = useQuery({
    queryKey: ["member-timeline", memberEmail],
    enabled: !!memberEmail,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_member_positions_as_of")
        .select("*")
        .eq("member_email", memberEmail)
        .order("as_of_date", { ascending: true });

      if (error) {
        console.error("[MemberDashboard] Timeline query error:", error);
        throw error;
      }
      return data || [];
    },
  });

  const latest = useMemo(
    () => (timeline.length > 0 ? timeline[timeline.length - 1] : null),
    [timeline]
  );

  const portfolioValue = latest ? Number(latest.current_value || 0) : 0;
  const totalUnits = latest ? Number(latest.current_units || 0) : 0;
  const totalContribution = latest ? Number(latest.total_contribution || 0) : 0;
  const unitValue = totalUnits > 0 ? portfolioValue / totalUnits : 0;
  const lastGrowthAmount = latest ? Number(latest.growth_amount || 0) : 0;
  const lastGrowthPct = latest ? Number(latest.growth_pct || 0) : 0;
  const ownershipPct = latest ? Number(latest.ownership_percentage || 0) : 0;

  const chartData = useMemo(
    () =>
      timeline.map((entry) => ({
        date: entry.as_of_date
          ? format(new Date(entry.as_of_date), "MMM yy")
          : "",
        value: Number(entry.current_value || 0),
      })),
    [timeline]
  );

  // Loading auth
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-default">
              Welcome, {member.full_name || member.member_name || "Member"}
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

        {/* Timeline error (view / RLS / data issues) */}
        {timelineError && (
          <div className="card p-4 border-l-4 border-red-500 flex items-start gap-3">
            <ArrowRight className="h-4 w-4 text-red-500 mt-0.5" />
            <p className="text-red-400">
              We couldn&apos;t load your history. Admin may need to backfill
              member_monthly_balances or v_member_positions_as_of.
            </p>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Portfolio Value */}
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
            </CardContent>
          </Card>

          {/* Total Contributions */}
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

          {/* Units + Unit Value */}
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

          {/* Last Period Change + Ownership */}
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
              <div className="flex items-center gap-2 mt-2">
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
                <Badge variant="outline">
                  Ownership: {(ownershipPct * 100).toFixed(2)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
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
              <p className="text-muted">
                No history available yet. Admin may need to import your legacy
                balances or allocate units.
              </p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" />
                    <YAxis
                      stroke="#64748b"
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

        {/* Next steps */}
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
                <span className="text-sm font-medium">
                  Make a contribution
                </span>
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
