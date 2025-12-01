import React, { useState } from "react";
import Papa from "papaparse";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Upload, CheckCircle, AlertCircle, Download, FileSpreadsheet } from "lucide-react";

export default function AdminImport() {
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const queryClient = useQueryClient();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewData(null);
      setError(null);
      setSuccess(null);
    }
  };

  const parseFile = (file) =>
    new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
      });
    });

  const handlePreview = async (type) => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setImportType(type);

    try {
      const rows = await parseFile(file);
      const cleaned = rows.filter((row) =>
        Object.values(row).some((v) => v !== "" && v != null)
      );

      if (!cleaned.length) {
        setError("No usable rows found in the file");
        setPreviewData(null);
        return;
      }

      setPreviewData(cleaned);
      setSuccess(
        `Found ${cleaned.length} records. Review below and click Import to proceed.`
      );
    } catch (err) {
      setError(err.message || "Failed to process file");
      setPreviewData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!previewData || previewData.length === 0) {
      setError("No data to import");
      return;
    }

    if (!importType) {
      setError("Please choose an import type");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      if (importType === "members") {
        const rows = previewData.map((member) => ({
          full_name: member.full_name || member.name || "",
          member_name: member.full_name || member.name || "",
          email: member.email || null,
          role: member.role || "member",
          phone: member.phone || null,
          join_date:
            member.member_since ||
            new Date().toISOString().split("T")[0],
          membership_status: member.kyc_status || "pending",
        }));

        const filtered = rows.filter((r) => r.full_name);
        if (filtered.length) {
          const { error: insertError } = await supabase
            .from("members")
            .insert(filtered);
          if (insertError) throw insertError;
        }

        queryClient.invalidateQueries({ queryKey: ["members"] });
      } else if (importType === "accounts") {
        const { data: allMembers, error: membersError } = await supabase
          .from("members")
          .select("id, email, full_name");
        if (membersError) throw membersError;

        const memberByEmail = new Map(
          (allMembers || []).map((m) => [m.email, m])
        );

        const rows = previewData.map((acc) => {
          const ownerEmail = acc.owner_email || acc.owner || null;
          const owner = ownerEmail ? memberByEmail.get(ownerEmail) : null;
          return {
            member_id: owner?.id || null,
            member_name: acc.name || "",
            email: ownerEmail,
            account_type: acc.account_type || "personal",
            status: "active",
            current_units: parseFloat(acc.current_units || 0) || 0,
            cash_balance: parseFloat(acc.cash_balance || 0) || 0,
            current_value: parseFloat(acc.current_value || 0) || 0,
            opening_date:
              acc.opening_date || new Date().toISOString().split("T")[0],
            notes: acc.notes || null,
            beneficiary_name: acc.beneficiary_name || null,
          };
        });

        const filtered = rows.filter((r) => r.member_name);
        if (filtered.length) {
          const { error: insertError } = await supabase
            .from("member_accounts")
            .insert(filtered);
          if (insertError) throw insertError;
        }

        queryClient.invalidateQueries({ queryKey: ["accounts"] });
      } else if (importType === "ledger") {
        const { data: allAccounts, error: accountsError } = await supabase
          .from("member_accounts")
          .select("id, member_id, member_name")
          .eq("is_active", true);
        if (accountsError) throw accountsError;

        const accountByName = new Map(
          (allAccounts || []).map((a) => [a.member_name, a])
        );

        const rows = previewData
          .map((entry) => {
            const accountName =
              entry.account_name || entry.member_name || "";
            const account = accountByName.get(accountName);
            if (!account || !account.member_id) return null;

            return {
              member_id: account.member_id,
              entry_date:
                entry.entry_date || new Date().toISOString(),
              entry_type: entry.entry_type || "other",
              amount: parseFloat(entry.amount || 0) || 0,
              units_delta: parseFloat(entry.units_delta || 0) || 0,
              memo: entry.memo || null,
            };
          })
          .filter(Boolean);

        if (rows.length) {
          const { error: insertError } = await supabase
            .from("member_unit_transactions")
            .insert(rows);
          if (insertError) throw insertError;
        }

        queryClient.invalidateQueries({ queryKey: ["recent-ledger"] });
      } else if (importType === "legacy-unit-prices") {
        const rows = previewData.map((price) => ({
          price_date: price.price_date,
          price: parseFloat(price.price || 0) || 0,
          total_aum: parseFloat(price.total_aum || 0) || 0,
          total_units_outstanding:
            parseFloat(price.total_units_outstanding || 0) || 0,
          is_finalized: false,
        }));

        const filtered = rows.filter((r) => r.price_date);
        if (filtered.length) {
          const { error: insertError } = await supabase
            .from("unit_prices")
            .insert(filtered);
          if (insertError) throw insertError;
        }

        queryClient.invalidateQueries({ queryKey: ["unit-prices"] });
      }

      setSuccess(`Successfully imported ${previewData.length} records!`);
      setPreviewData(null);
      setFile(null);
      setImportType(null);
    } catch (err) {
      setError(err.message || "Failed to import data");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = (type) => {
    let csv = "";

    if (type === "members") {
      csv =
        "full_name,email,role,phone,member_since,kyc_status\nJohn Doe,john@example.com,member,555-1234,2024-01-01,approved";
    } else if (type === "accounts") {
      csv =
        "name,account_type,owner_email,current_units,cash_balance,opening_date\nFamily Fund,personal,john@example.com,100,10000,2024-01-01";
    } else if (type === "ledger") {
      csv =
        "account_name,entry_date,entry_type,amount,units_delta,memo\nFamily Fund,2024-01-15,contribution,5000,50,Monthly contribution";
    } else if (type === "legacy-unit-prices") {
      csv =
        "price_date,price,total_aum,total_units_outstanding\n2024-01-31,100.00,250000,2500";
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
  };

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-default mb-2">
            Import Historical Data
          </h1>
          <p className="text-muted">
            Bulk import members, accounts, transactions, and unit prices from
            Excel/CSV
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-emerald-500 bg-emerald-50">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-900">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted">
                Import member profiles with contact info and KYC status
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate("members")}
                  className="flex-1"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Template
                </Button>
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      handleFileChange(e);
                      setTimeout(() => handlePreview("members"), 100);
                    }}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-blue-800"
                    type="button"
                    onClick={(e) =>
                      e.currentTarget.previousElementSibling.click()
                    }
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted">
                Import accounts with units, balances, and owners
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate("accounts")}
                  className="flex-1"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Template
                </Button>
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      handleFileChange(e);
                      setTimeout(() => handlePreview("accounts"), 100);
                    }}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-blue-800"
                    type="button"
                    onClick={(e) =>
                      e.currentTarget.previousElementSibling.click()
                    }
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted">
                Import historical ledger entries and transactions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate("ledger")}
                  className="flex-1"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Template
                </Button>
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      handleFileChange(e);
                      setTimeout(() => handlePreview("ledger"), 100);
                    }}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-blue-800"
                    type="button"
                    onClick={(e) =>
                      e.currentTarget.previousElementSibling.click()
                    }
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                Unit Prices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted">
                Import historical unit price data
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate("legacy-unit-prices")}
                  className="flex-1"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Template
                </Button>
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      handleFileChange(e);
                      setTimeout(
                        () => handlePreview("legacy-unit-prices"),
                        100
                      );
                    }}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-blue-800"
                    type="button"
                    onClick={(e) =>
                      e.currentTarget.previousElementSibling.click()
                    }
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {previewData && previewData.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Preview Data</CardTitle>
                  <p className="text-sm text-muted mt-1">
                    Review {previewData.length} records before importing
                  </p>
                </div>
                <Button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing
                    ? "Importing..."
                    : `Import ${previewData.length} Records`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(previewData[0]).map((key) => (
                        <TableHead key={key} className="capitalize">
                          {key.replace(/_/g, " ")}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 50).map((row, idx) => (
                      <TableRow key={idx}>
                        {Object.values(row).map((value, i) => (
                          <TableCell key={i}>{String(value)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewData.length > 50 && (
                  <p className="text-sm text-muted text-center py-4">
                    Showing first 50 of {previewData.length} records
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
