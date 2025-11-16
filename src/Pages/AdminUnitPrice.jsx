
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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
import { Plus, Lock, TrendingUp, DollarSign, Calculator, Building, Users } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import PortfolioBuilder from "./PortfolioBuilder.jsx";

export default function AdminUnitPrice() {
  const [activeTab, setActiveTab] = useState('unit-price');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    price_date: new Date().toISOString().split('T')[0],
    price: 0,
    total_aum: 0,
    total_units_outstanding: 0,
    cash_balance: 0,
    invested_value: 0,
    notes: "",
  });

  const queryClient = useQueryClient();

  const { data: unitPrices = [], isLoading } = useQuery({
    queryKey: ['unit-prices'],
    queryFn: () => base44.entities.UnitPrice.list('-price_date'),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => base44.entities.Account.list(),
  });

  const createMutation = useMutation({
    mutationFn: async (priceData) => {
      const user = await base44.auth.me();
      return base44.entities.UnitPrice.create({
        ...priceData,
        finalized_by_email: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-prices'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async (priceId) => {
      const user = await base44.auth.me();
      return base44.entities.UnitPrice.update(priceId, {
        is_finalized: true,
        finalized_by_email: user.email,
        finalized_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-prices'] });
    },
  });

  const resetForm = () => {
    setFormData({
      price_date: new Date().toISOString().split('T')[0],
      price: 0,
      total_aum: 0,
      total_units_outstanding: 0,
      cash_balance: 0,
      invested_value: 0,
      notes: "",
    });
  };

  const handleCalculate = () => {
    const totalUnits = accounts.reduce((sum, acc) => sum + acc.current_units, 0);
    const totalCash = accounts.reduce((sum, acc) => sum + acc.cash_balance, 0);
    const totalInvested = accounts.reduce((sum, acc) => sum + acc.invested_value, 0);
    const totalAUM = totalCash + totalInvested;
    const calculatedPrice = totalUnits > 0 ? totalAUM / totalUnits : 0;

    setFormData({
      ...formData,
      total_units_outstanding: totalUnits,
      cash_balance: totalCash,
      invested_value: totalInvested,
      total_aum: totalAUM,
      price: calculatedPrice,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const latestPrice = unitPrices[0];
  const chartData = unitPrices.slice(0, 90).reverse().map(up => ({
    date: format(new Date(up.price_date), 'MMM dd'),
    price: up.price,
  }));

  // If Portfolio Builder tab is active, render it directly
  if (activeTab === 'portfolio-builder') {
    return <PortfolioBuilder />;
  }

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Unit Price Management</h1>
            <p className="text-slate-600">Calculate and track NAV per unit</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <Card>
          <CardContent className="p-0">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('unit-price')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'unit-price'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calculator className="w-4 h-4" />
                Unit Price Tracking
              </button>
              <button
                onClick={() => setActiveTab('portfolio-builder')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'portfolio-builder'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Portfolio Builder
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div></div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-900 hover:bg-blue-800 gap-2"
                onClick={() => {
                  resetForm();
                  handleCalculate();
                }}
              >
                <Plus className="w-4 h-4" />
                Add Unit Price
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Unit Price</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-end">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleCalculate}
                    className="gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Auto-Calculate from Accounts
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price Date *</Label>
                    <Input
                      type="date"
                      value={formData.price_date}
                      onChange={(e) => setFormData({...formData, price_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price *</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total AUM</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.total_aum}
                      onChange={(e) => setFormData({...formData, total_aum: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Units Outstanding</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={formData.total_units_outstanding}
                      onChange={(e) => setFormData({...formData, total_units_outstanding: parseFloat(e.target.value)})}
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
                  <div className="space-y-2 col-span-2">
                    <Label>Notes</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Notes about this calculation"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800">
                    Add Unit Price
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Unit Price */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-900 to-blue-800 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">Current Unit Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-2">
                ${latestPrice?.price?.toFixed(4) || '0.0000'}
              </div>
              <p className="text-sm opacity-75">
                {latestPrice?.price_date ? format(new Date(latestPrice.price_date), 'MMMM dd, yyyy') : '-'}
              </p>
              <Badge 
                variant={latestPrice?.is_finalized ? "default" : "outline"}
                className="mt-3 bg-white/20 border-white/30"
              >
                {latestPrice?.is_finalized ? '🔒 Finalized' : '⏱️ Pending'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600">Total AUM</CardTitle>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                ${latestPrice?.total_aum?.toLocaleString('en-US', { minimumFractionDigits: 0 }) || '0'}
              </div>
              <p className="text-sm text-slate-500">
                ${latestPrice?.cash_balance?.toLocaleString() || '0'} cash + ${latestPrice?.invested_value?.toLocaleString() || '0'} invested
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-slate-600">Units Outstanding</CardTitle>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {latestPrice?.total_units_outstanding?.toFixed(4) || '0.0000'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Chart */}
        {chartData.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Unit Price History (90 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`$${value.toFixed(4)}`, 'Unit Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#1e40af" 
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price History Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Unit Price History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total AUM</TableHead>
                    <TableHead>Units Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : unitPrices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        No unit prices recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    unitPrices.slice(0, 30).map(price => (
                      <TableRow key={price.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          {format(new Date(price.price_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="font-bold text-blue-900">
                          ${price.price.toFixed(4)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${price.total_aum?.toLocaleString('en-US', { minimumFractionDigits: 0 }) || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {price.total_units_outstanding?.toFixed(4) || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={price.is_finalized ? "default" : "outline"}>
                            {price.is_finalized ? 'Finalized' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!price.is_finalized && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => finalizeMutation.mutate(price.id)}
                              className="gap-2"
                            >
                              <Lock className="w-4 h-4" />
                              Finalize
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
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