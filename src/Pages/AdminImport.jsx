import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

  const handlePreview = async (type) => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setImportType(type);

    try {
      // Upload file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Define schema based on import type
      let schema = {};
      
      if (type === 'members') {
        schema = {
          type: "array",
          items: {
            type: "object",
            properties: {
              full_name: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
              phone: { type: "string" },
              member_since: { type: "string" },
              kyc_status: { type: "string" }
            }
          }
        };
      } else if (type === 'accounts') {
        schema = {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              account_type: { type: "string" },
              owner_email: { type: "string" },
              current_units: { type: "number" },
              cash_balance: { type: "number" },
              opening_date: { type: "string" }
            }
          }
        };
      } else if (type === 'ledger') {
        schema = {
          type: "array",
          items: {
            type: "object",
            properties: {
              account_name: { type: "string" },
              entry_date: { type: "string" },
              entry_type: { type: "string" },
              amount: { type: "number" },
              units_delta: { type: "number" },
              memo: { type: "string" }
            }
          }
        };
  } else if (type === 'legacy-unit-prices') {
        schema = {
          type: "array",
          items: {
            type: "object",
            properties: {
              price_date: { type: "string" },
              price: { type: "number" },
              total_aum: { type: "number" },
              total_units_outstanding: { type: "number" }
            }
          }
        };
      }

      // Extract data from file
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      if (result.status === 'success') {
        setPreviewData(result.output);
        setSuccess(`Found ${result.output.length} records. Review below and click Import to proceed.`);
      } else {
        setError(result.details || 'Failed to extract data from file');
      }
    } catch (err) {
      setError(err.message || 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!previewData || previewData.length === 0) {
      setError("No data to import");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const user = await base44.auth.me();

      if (importType === 'members') {
        // Import members
        for (const member of previewData) {
          await base44.entities.User.create({
            full_name: member.full_name,
            email: member.email,
            role: member.role || 'user',
            phone: member.phone || '',
            member_since: member.member_since || new Date().toISOString().split('T')[0],
            kyc_status: member.kyc_status || 'pending',
          });
        }
        queryClient.invalidateQueries({ queryKey: ['users'] });
      } else if (importType === 'accounts') {
        // Import accounts and link to users
        const allUsers = await base44.entities.User.list();
        
        for (const acc of previewData) {
          const account = await base44.entities.Account.create({
            name: acc.name,
            account_type: acc.account_type || 'personal',
            current_units: acc.current_units || 0,
            cash_balance: acc.cash_balance || 0,
            opening_date: acc.opening_date || new Date().toISOString().split('T')[0],
            status: 'active',
          });

          // Link owner if provided
          if (acc.owner_email) {
            const owner = allUsers.find(u => u.email === acc.owner_email);
            if (owner) {
              await base44.entities.AccountUser.create({
                account_id: account.id,
                user_email: owner.email,
                role_in_account: 'owner'
              });
            }
          }
        }
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
      } else if (importType === 'ledger') {
        // Legacy Base44 ledger import is deprecated. Skipping this branch.
        // Please use Supabase member_unit_transactions via dedicated tools.
        // No-op here to remove Base44 usage.
  } else if (importType === 'legacy-unit-prices') {
        // Import unit prices
        for (const price of previewData) {
          await base44.entities.UnitPrice.create({
            price_date: price.price_date,
            price: price.price,
            total_aum: price.total_aum || 0,
            total_units_outstanding: price.total_units_outstanding || 0,
            is_finalized: false,
          });
        }
        queryClient.invalidateQueries({ queryKey: ['unit-prices'] });
      }

      setSuccess(`Successfully imported ${previewData.length} records!`);
      setPreviewData(null);
      setFile(null);
      setImportType(null);
    } catch (err) {
      setError(err.message || 'Failed to import data');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = (type) => {
    let csv = '';
    
    if (type === 'members') {
      csv = 'full_name,email,role,phone,member_since,kyc_status\nJohn Doe,john@example.com,user,555-1234,2024-01-01,approved';
    } else if (type === 'accounts') {
      csv = 'name,account_type,owner_email,current_units,cash_balance,opening_date\nFamily Fund,personal,john@example.com,100,10000,2024-01-01';
    } else if (type === 'ledger') {
      csv = 'account_name,entry_date,entry_type,amount,units_delta,memo\nFamily Fund,2024-01-15,contribution,5000,50,Monthly contribution';
  } else if (type === 'legacy-unit-prices') {
      csv = 'price_date,price,total_aum,total_units_outstanding\n2024-01-31,100.00,250000,2500';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
  };

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold text-default mb-2">Import Historical Data</h1>
          <p className="text-muted">Bulk import members, accounts, transactions, and unit prices from Excel/CSV</p>
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
            <AlertDescription className="text-emerald-900">{success}</AlertDescription>
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
              <p className="text-sm text-muted">Import member profiles with contact info and KYC status</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('members')}
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
                      setTimeout(() => handlePreview('members'), 100);
                    }}
                    className="hidden"
                  />
                  <Button size="sm" className="w-full bg-primary hover:bg-blue-800" type="button" onClick={(e) => e.currentTarget.previousElementSibling.click()}>
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
              <p className="text-sm text-muted">Import accounts with units, balances, and owners</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('accounts')}
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
                      setTimeout(() => handlePreview('accounts'), 100);
                    }}
                    className="hidden"
                  />
                  <Button size="sm" className="w-full bg-primary hover:bg-blue-800" type="button" onClick={(e) => e.currentTarget.previousElementSibling.click()}>
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
              <p className="text-sm text-muted">Import historical ledger entries and transactions</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('ledger')}
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
                      setTimeout(() => handlePreview('ledger'), 100);
                    }}
                    className="hidden"
                  />
                  <Button size="sm" className="w-full bg-primary hover:bg-blue-800" type="button" onClick={(e) => e.currentTarget.previousElementSibling.click()}>
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
              <p className="text-sm text-muted">Import historical unit price data</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('legacy-unit-prices')}
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
                      setTimeout(() => handlePreview('legacy-unit-prices'), 100);
                    }}
                    className="hidden"
                  />
                  <Button size="sm" className="w-full bg-primary hover:bg-blue-800" type="button" onClick={(e) => e.currentTarget.previousElementSibling.click()}>
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
                  {isProcessing ? 'Importing...' : `Import ${previewData.length} Records`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(previewData[0]).map(key => (
                        <TableHead key={key} className="capitalize">
                          {key.replace(/_/g, ' ')}
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