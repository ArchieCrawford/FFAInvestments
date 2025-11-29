import React, { useMemo, useState, useEffect } from "react";
// No data fetching here; integration page is for auth/connect only.
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
import schwabApi from '../services/schwabApi';
import { Link } from 'react-router-dom';
// NOTE: Enrichment button moved to Insights page. This page restored to be the Schwab authentication + integration landing.


export default function AdminSchwab() {
  // Schwab auth / integration state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accountStatus, setAccountStatus] = useState({ checked: false, count: 0, details: [] });
  const [checkingLive, setCheckingLive] = useState(false);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        const tokenRaw = localStorage.getItem('schwab_tokens');
        const status = schwabApi.getAuthStatus?.();
        const authed = !!(status?.authenticated || tokenRaw);
        if (active) {
          setIsAuthenticated(authed);
          setAuthChecked(true);
        }
      } catch (err) {
        if (active) {
          setAuthError(err.message || 'Failed to determine Schwab auth status');
          setAuthChecked(true);
        }
      }
    };
    checkAuth();
    return () => { active = false; };
  }, []);

  const handleConnect = async () => {
    try {
      setAuthError('');
      setIsConnecting(true);
      const authUrl = await schwabApi.getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (err) {
      setAuthError('Failed to initiate Schwab connection.');
    } finally {
      setIsConnecting(false);
    }
  };

  const checkLiveAccounts = async () => {
    // Always fetch live data from Schwab API; do not use cached database values.
    setCheckingLive(true);
    try {
      const accounts = await schwabApi.getAccounts();
      const count = Array.isArray(accounts) ? accounts.length : 0;
      setAccountStatus({ checked: true, count, details: accounts || [] });
    } catch (err) {
      // If live check fails, reflect status but do not fallback to cached data.
      setAccountStatus({ checked: true, count: 0, details: [] });
    } finally {
      setCheckingLive(false);
    }
  };

  // This page intentionally does not display data; use Insights for metrics and positions.

  if (!authChecked) {
    return (
      <Page title="Schwab Integration" subtitle="Connecting to Charles Schwab">
        <div className="max-w-xl mx-auto py-12 text-center">
          <p className="text-muted">Checking Schwab authentication…</p>
        </div>
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      <Page title="Schwab Integration" subtitle="Connect your brokerage to enable data syncing">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-xl border border-border bg-surface shadow-sm">
            <h1 className="text-2xl font-bold mb-2 text-default">Connect to Charles Schwab</h1>
            <p className="text-muted mb-4">Authorize access so we can pull account snapshots, positions and balances securely. You will be redirected to Schwab and return here afterwards.</p>
            {authError && <div className="text-sm text-red-500 mb-3">{authError}</div>}
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleConnect} disabled={isConnecting} className="gap-2 bg-primary hover:bg-primary">
                {isConnecting ? 'Redirecting…' : 'Connect to Charles Schwab'}
              </Button>
              <Link to="/admin/schwab/insights">
                <Button variant="outline" className="gap-2">Go to Insights</Button>
              </Link>
              <Link to="/admin/org-balance">
                <Button variant="outline" className="gap-2">Org Balance History</Button>
              </Link>
            </div>
            <p className="text-xs text-muted mt-4">Need help? Contact support or review the integration guide.</p>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Schwab Integration"
      subtitle="Linked brokerage accounts and current positions"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <LineChart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-default">Schwab Connected</h1>
              <p className="text-muted text-sm">You’re authenticated. Use Insights to view balances, positions, and charts.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/schwab/insights">
              <Button variant="outline" className="gap-2">Open Insights</Button>
            </Link>
            <Link to="/admin/org-balance">
              <Button variant="outline" className="gap-2">Org Balance</Button>
            </Link>
          </div>
        </div>

        {/* Live status widget: always fetch directly from Schwab API */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-default">Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted">
                {checkingLive
                  ? 'Checking live account list…'
                  : accountStatus.checked
                    ? `Live accounts found: ${accountStatus.count}`
                    : 'Status not checked yet'}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={checkLiveAccounts} disabled={checkingLive} className="gap-2">
                  {checkingLive ? 'Checking…' : 'Check Live Status'}
                </Button>
                <Button onClick={handleConnect} variant="outline" className="gap-2">
                  Reconnect
                </Button>
              </div>
            </div>
            {accountStatus.details && accountStatus.details.length > 0 && (
              <div className="text-xs text-muted">
                Showing first account: {accountStatus.details[0]?.securitiesAccount?.accountNumber || accountStatus.details[0]?.accountNumber || accountStatus.details[0]?.accountId || '—'}
              </div>
            )}
            <p className="text-xs text-muted">Note: This status uses the live Schwab API directly—no cached database values.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-default">What’s next?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted space-y-2">
            <p>Visit Insights to capture a snapshot, sync positions, and push values into org balance history.</p>
            <p>If your session expires, return here to reconnect.</p>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
