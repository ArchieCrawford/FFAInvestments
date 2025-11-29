import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  LineChart,
  ListOrdered,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { Page } from "../components/Page";

async function fetchLatestSnapshots() {
  const { data, error } = await supabase
    .from("schwab_account_snapshots")
    .select("snapshot_date, account_number, current_liquidation_value, total_cash")
    .order("snapshot_date", { ascending: false });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const latestDate = data[0].snapshot_date;
  return data.filter(row => row.snapshot_date === latestDate);
}

async function fetchLatestPositions() {
  const { data, error } = await supabase
    .from("schwab_positions")
    .select("*")
    .order("snapshot_date", { ascending: false })
    .limit(500);
  if (error) throw error;
  if (!data || data.length === 0) return [];

  const latestTs = data[0].snapshot_date;
  return data.filter(row => row.snapshot_date === latestTs);
}

export default function AdminSchwab() {
  const {
    data: snapshots = [],
    isLoading: loadingSnapshots,
    refetch: refetchSnapshots
  } = useQuery({
    queryKey: ["schwab-account-snapshots"],
    queryFn: fetchLatestSnapshots
  });

  const {
    data: positions = [],
    isLoading: loadingPositions,
    refetch: refetchPositions
  } = useQuery({
    queryKey: ["schwab-positions"],
    queryFn: fetchLatestPositions
  });

  const latestSnapshotDate = useMemo(() => {
    if (!snapshots.length) return null;
    return snapshots[0].snapshot_date;
  }, [snapshots]);

  const totalLiquidation = useMemo(() => {
    return snapshots.reduce(
      (sum, row) => sum + Number(row.current_liquidation_value || 0),
      0
    );
  }, [snapshots]);

  const totalCash = useMemo(() => {
    return snapshots.reduce(
      (sum, row) => sum + Number(row.total_cash || 0),
      0
    );
  }, [snapshots]);

  const accountCount = snapshots.length;

  const topPositions = useMemo(() => {
    const bySymbol = new Map();
    positions.forEach(p => {
      const key = p.symbol || p.description || "UNKNOWN";
      const existing = bySymbol.get(key) || {
        symbol: p.symbol,
        description: p.description,
        market_value: 0,
        long_quantity: 0
      };
      existing.market_value += Number(p.market_value || 0);
      existing.long_quantity += Number(p.long_quantity || 0);
      bySymbol.set(key, existing);
    });
    return Array.from(bySymbol.values()).sort(
      (a, b) => b.market_value - a.market_value
    );
  }, [positions]);

  const handleRefresh = async () => {
    await Promise.all([refetchSnapshots(), refetchPositions()]);
  };

  return (
    <Page
      title="Schwab Accounts & Positions"
      subtitle="View brokerage balances and holdings synced from Charles Schwab"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <LineChart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-default">
                Schwab Overview
              </h1>
              <p className="text-muted text-sm">
                Snapshot of linked brokerage accounts and current positions
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            disabled={loadingSnapshots || loadingPositions}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-lg bg-primary text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Schwab Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${totalLiquidation.toLocaleString("en-US", {
                  maximumFractionDigits: 0
                })}
              </div>
              <p className="text-xs opacity-80 mt-1">
                Current liquidation value across all accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-primary" />
                Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-default">
                {accountCount}
              </div>
              <p className="text-xs text-muted mt-1">
                With latest snapshot on{" "}
                {latestSnapshotDate
                  ? format(new Date(latestSnapshotDate), "MMM dd, yyyy")
                  : "—"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Total Cash
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-default">
                ${totalCash.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted mt-1">
                Cash and money markets across Schwab accounts
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-default">
              Top Positions (by market value)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPositions ? (
              <div className="text-center py-8 text-muted">Loading positions…</div>
            ) : topPositions.length === 0 ? (
              <div className="text-center py-8 text-muted">
                No positions found in latest snapshot.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Market Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPositions.slice(0, 50).map(row => (
                      <TableRow key={row.symbol || row.description}>
                        <TableCell>
                          {row.symbol ? (
                            <Badge variant="outline">{row.symbol}</Badge>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {row.description || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.long_quantity.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${row.market_value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {topPositions.length > 50 && (
                  <p className="text-xs text-muted text-center mt-3">
                    Showing top 50 of {topPositions.length} positions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
