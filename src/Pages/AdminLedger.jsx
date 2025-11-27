import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createMemberUnitTransaction, getLatestUnitValuation } from "@/lib/ffaApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, Search, Download, Upload, Filter } from "lucide-react";
import { format } from "date-fns";

export default function AdminLedger() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    account_id: "",
    entry_date: new Date().toISOString().split('T')[0],
    entry_type: "contribution",
    amount: 0,
    units_delta: 0,
    unit_price_at_entry: 0,
    memo: "",
  });

  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['ledger-entries'],
    queryFn: () => base44.entities.LedgerEntry.list('-entry_date'),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const { data: unitPrice } = useQuery({
    queryKey: ['latest-unit-price'],
    queryFn: async () => {
      const prices = await base44.entities.UnitPrice.list('-price_date', 1);
      return prices[0];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (entryData) => {
      // Map AdminLedger form to canonical member_unit_transactions
      const latest = await getLatestUnitValuation();
      const unitValue = latest?.unit_value ?? null;
      const txTypeMap = {
        contribution: 'contribution',
        withdrawal: 'withdrawal',
        fee: 'adjustment',
        distribution: 'distribution',
        trade: 'adjustment',
        unit_allocation: 'allocation',
        adjustment: 'adjustment',
      };
      const tx_type = txTypeMap[entryData.entry_type] || 'adjustment';
      const cash_amount = Number(entryData.amount) || 0;
      const units_delta = Number(entryData.units_delta) || 0;
      await createMemberUnitTransaction({
        member_id: entryData.account_id, // NOTE: replace with actual member_id when account->member mapping exists
        tx_date: entryData.entry_date,
        tx_type,
        cash_amount,
        unit_value_at_tx: unitValue,
        units_delta,
        notes: entryData.memo || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      account_id: "",
      entry_date: new Date().toISOString().split('T')[0],
      entry_type: "contribution",
      amount: 0,
      units_delta: 0,
      unit_price_at_entry: unitPrice?.price || 0,
      memo: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleExportCSV = () => {
    const csv = [
      ['Date', 'Account', 'Type', 'Amount', 'Units Delta', 'Unit Price', 'Memo'],
      ...filteredEntries.map(entry => {
        const account = accounts.find(a => a.id === entry.account_id);
        return [
          entry.entry_date,
          account?.name || 'Unknown',
          entry.entry_type,
          entry.amount,
          entry.units_delta,
          entry.unit_price_at_entry,
          entry.memo || ''
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.memo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || entry.entry_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-default mb-2">Ledger Management</h1>
            <p className="text-muted">Record and manage all transactions</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary hover:bg-blue-800 gap-2"
                  onClick={resetForm}
                >
                  <Plus className="w-4 h-4" />
                  Record Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Record New Transaction</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Account *</Label>
                      <Select
                        value={formData.account_id}
                        onValueChange={(value) => setFormData({...formData, account_id: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Transaction Date *</Label>
                      <Input
                        type="date"
                        value={formData.entry_date}
                        onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Transaction Type *</Label>
                      <Select
                        value={formData.entry_type}
                        onValueChange={(value) => setFormData({...formData, entry_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contribution">Contribution</SelectItem>
                          <SelectItem value="withdrawal">Withdrawal</SelectItem>
                          <SelectItem value="fee">Fee</SelectItem>
                          <SelectItem value="distribution">Distribution</SelectItem>
                          <SelectItem value="trade">Trade</SelectItem>
                          <SelectItem value="unit_allocation">Unit Allocation</SelectItem>
                          <SelectItem value="adjustment">Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount ($) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                        placeholder="Use negative for withdrawals"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Units Delta</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.units_delta}
                        onChange={(e) => setFormData({...formData, units_delta: parseFloat(e.target.value)})}
                        placeholder="Change in units"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price at Entry</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={formData.unit_price_at_entry}
                        onChange={(e) => setFormData({...formData, unit_price_at_entry: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Memo</Label>
                      <Input
                        value={formData.memo}
                        onChange={(e) => setFormData({...formData, memo: e.target.value})}
                        placeholder="Description of transaction"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-blue-800">
                      Record Transaction
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="contribution">Contributions</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="fee">Fees</SelectItem>
                    <SelectItem value="distribution">Distributions</SelectItem>
                    <SelectItem value="trade">Trades</SelectItem>
                    <SelectItem value="unit_allocation">Unit Allocations</SelectItem>
                    <SelectItem value="adjustment">Adjustments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Units Δ</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Memo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map(entry => {
                      const account = accounts.find(a => a.id === entry.account_id);
                      return (
                        <TableRow key={entry.id} className="hover:bg-bg">
                          <TableCell className="font-medium">
                            {format(new Date(entry.entry_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {account?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {entry.entry_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-bold ${entry.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {entry.amount >= 0 ? '+' : ''}${Math.abs(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {entry.units_delta !== 0 ? (
                              <span className={entry.units_delta > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                {entry.units_delta > 0 ? '+' : ''}{entry.units_delta.toFixed(4)}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted">
                            {entry.unit_price_at_entry ? `$${entry.unit_price_at_entry.toFixed(4)}` : '-'}
                          </TableCell>
                          <TableCell className="text-muted max-w-xs truncate">
                            {entry.memo || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}