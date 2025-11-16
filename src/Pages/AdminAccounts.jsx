import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Plus, Search, Edit2, Wallet } from "lucide-react";
import { format } from "date-fns";

export default function AdminAccounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    account_type: "personal",
    status: "active",
    current_units: 0,
    cash_balance: 0,
    invested_value: 0,
    opening_date: new Date().toISOString().split('T')[0],
    notes: "",
    beneficiary_name: "",
  });

  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list('-created_date'),
  });

  const { data: unitPrice } = useQuery({
    queryKey: ['latest-unit-price'],
    queryFn: async () => {
      const prices = await base44.entities.UnitPrice.list('-price_date', 1);
      return prices[0];
    },
  });

  const createMutation = useMutation({
    mutationFn: (accountData) => base44.entities.Account.create(accountData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, accountData }) => base44.entities.Account.update(id, accountData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsDialogOpen(false);
      setEditingAccount(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      account_type: "personal",
      status: "active",
      current_units: 0,
      cash_balance: 0,
      invested_value: 0,
      opening_date: new Date().toISOString().split('T')[0],
      notes: "",
      beneficiary_name: "",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, accountData: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name || "",
      account_type: account.account_type || "personal",
      status: account.status || "active",
      current_units: account.current_units || 0,
      cash_balance: account.cash_balance || 0,
      invested_value: account.invested_value || 0,
      opening_date: account.opening_date || "",
      notes: account.notes || "",
      beneficiary_name: account.beneficiary_name || "",
    });
    setIsDialogOpen(true);
  };

  const filteredAccounts = accounts.filter(account =>
    account.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Management</h1>
            <p className="text-slate-600">Manage investment accounts and balances</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-900 hover:bg-blue-800 gap-2"
                onClick={() => {
                  setEditingAccount(null);
                  resetForm();
                }}
              >
                <Plus className="w-4 h-4" />
                Create Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingAccount ? 'Edit Account' : 'Create New Account'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Account Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Family Fund, College Fund"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => setFormData({...formData, account_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="joint">Joint</SelectItem>
                        <SelectItem value="529_college">529 College</SelectItem>
                        <SelectItem value="ira">IRA</SelectItem>
                        <SelectItem value="trust">Trust</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({...formData, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Current Units</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.current_units}
                      onChange={(e) => setFormData({...formData, current_units: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cash Balance</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cash_balance}
                      onChange={(e) => setFormData({...formData, cash_balance: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Invested Value</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.invested_value}
                      onChange={(e) => setFormData({...formData, invested_value: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Opening Date</Label>
                    <Input
                      type="date"
                      value={formData.opening_date}
                      onChange={(e) => setFormData({...formData, opening_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Beneficiary Name (if applicable)</Label>
                    <Input
                      value={formData.beneficiary_name}
                      onChange={(e) => setFormData({...formData, beneficiary_name: e.target.value})}
                      placeholder="For 529 or trust accounts"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Notes</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Internal notes about this account"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800">
                    {editingAccount ? 'Update Account' : 'Create Account'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map(account => {
                      const accountValue = account.current_units * (unitPrice?.price || 0);
                      return (
                        <TableRow key={account.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold">{account.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize text-slate-600">
                            {account.account_type?.replace('_', ' ')}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={account.status === 'active' ? 'default' : 'secondary'}
                              className={account.status === 'active' ? 'bg-emerald-600' : ''}
                            >
                              {account.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {account.current_units.toFixed(4)}
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">
                            ${accountValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {account.opening_date ? format(new Date(account.opening_date), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(account)}
                              className="gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </Button>
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