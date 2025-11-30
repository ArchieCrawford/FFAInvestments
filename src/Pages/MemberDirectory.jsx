import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Mail } from "lucide-react";
import { Page } from "../components/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MemberDirectory() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query members table and join with member_accounts for portfolio data
        const { data, error } = await supabase
          .from("members")
          .select(`
            member_id,
            member_name,
            full_name,
            email,
            kyc_status,
            join_date,
            member_accounts!inner (
              current_units,
              current_value,
              status
            )
          `)
          .order("member_name", { ascending: true });

        if (error) throw error;
        if (mounted) setMembers(data || []);
      } catch (err) {
        if (mounted) {
          setMembers([]);
          setError(err.message || "Unable to load member directory");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadMembers();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return members.filter((member) => {
      const name = member.full_name || member.member_name || "";
      const email = member.email || "";
      return (
        !term ||
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term)
      );
    });
  }, [members, searchTerm]);

  if (loading) {
    return (
      <Page title="Member Directory">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-muted mt-4">Loading member directory…</p>
          </div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Member Directory">
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      title="Member Directory"
      subtitle="Contact information and portfolio status for all members"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted" />
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-default">
              {filteredMembers.length}
            </div>
            <p className="text-sm text-muted mt-1">
              {filteredMembers.length !== members.length
                ? `Showing  of  members`
                : "All club members"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Member Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Units Owned
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Portfolio Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-muted">
                        No members found
                        {searchTerm && ` matching ""`}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const accountData = Array.isArray(member.member_accounts)
                        ? member.member_accounts[0]
                        : member.member_accounts;

                      const units = Number(accountData?.current_units || 0);
                      const value = Number(accountData?.current_value || 0);
                      const status = accountData?.status || "unknown";

                      return (
                        <tr
                          key={member.member_id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-default">
                              {member.full_name || member.member_name || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-muted">
                              {member.email || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-mono text-default">
                              {units.toFixed(4)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-default">
                              $
                              {value.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={
                                status === "active"
                                  ? "border-green-500 text-green-600 bg-green-50"
                                  : status === "inactive"
                                  ? "border-gray-500 text-gray-600 bg-gray-50"
                                  : "border-border text-muted"
                              }
                            >
                              {status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {member.email ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="gap-2"
                              >
                                <a href={`mailto:`}>
                                  <Mail className="w-4 h-4" />
                                  Email
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted">
                                No email
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
