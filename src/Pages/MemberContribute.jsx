import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Wallet, CreditCard, DollarSign, CheckCircle, AlertCircle } from "lucide-react";

export default function MemberContribute() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    account_id: "",
    amount: "",
    payment_method: "bank_transfer",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: accountUsers = [] } = useQuery({
    queryKey: ['my-accounts', user?.email],
    queryFn: () => base44.entities.AccountUser.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts-detail', accountUsers],
    queryFn: async () => {
      const accountIds = accountUsers.map(au => au.account_id);
      if (accountIds.length === 0) return [];
      const allAccounts = await base44.entities.Account.list();
      return allAccounts.filter(acc => accountIds.includes(acc.id));
    },
    enabled: accountUsers.length > 0,
  });

  const { data: unitPrice } = useQuery({
    queryKey: ['latest-unit-price'],
    queryFn: async () => {
      const prices = await base44.entities.UnitPrice.list('-price_date', 1);
      return prices[0];
    },
  });

  const createContribution = useMutation({
    mutationFn: async (contributionData) => {
      // Create ledger entry for the contribution
      await base44.entities.LedgerEntry.create({
        account_id: contributionData.account_id,
        entry_date: new Date().toISOString().split('T')[0],
        entry_type: 'contribution',
        amount: contributionData.amount,
        units_delta: 0, // Admin will allocate units later
        memo: `${contributionData.payment_method} contribution - Pending unit allocation`,
        created_by_email: user.email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-detail'] });
      setSuccess('Contribution submitted successfully! Units will be allocated by admin.');
      setFormData({
        account_id: "",
        amount: "",
        payment_method: "bank_transfer",
      });
    },
    onError: (err) => {
      setError(err.message || 'Failed to submit contribution');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.account_id) {
      setError('Please select an account');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      await createContribution.mutateAsync({
        account_id: formData.account_id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const estimatedUnits = formData.amount && unitPrice?.price 
    ? parseFloat(formData.amount) / unitPrice.price 
    : 0;

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Make a Contribution</h1>
          <p className="text-slate-600">Add funds to your investment account</p>
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

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-900" />
              Contribution Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Select Account *</Label>
                <Select
                  value={formData.account_id}
                  onValueChange={(value) => setFormData({...formData, account_id: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0 ? (
                      <SelectItem value="none" disabled>No accounts available</SelectItem>
                    ) : (
                      accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contribution Amount *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                </div>
                {formData.amount && unitPrice && (
                  <p className="text-sm text-slate-600">
                    ≈ {estimatedUnits.toFixed(4)} units at current price of ${unitPrice.price.toFixed(4)}/unit
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({...formData, payment_method: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer (ACH)</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="wire">Wire Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Payment Instructions</h4>
                {formData.payment_method === 'bank_transfer' && (
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Account Name:</strong> FFA Investment Club</p>
                    <p><strong>Routing Number:</strong> 123456789</p>
                    <p><strong>Account Number:</strong> 987654321</p>
                    <p className="mt-2 text-xs">Please include your name in the transfer memo.</p>
                  </div>
                )}
                {formData.payment_method === 'check' && (
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>Make check payable to: <strong>FFA Investment Club</strong></p>
                    <p className="mt-2">Mail to:</p>
                    <p>FFA Investment Club<br/>123 Main Street<br/>Anytown, ST 12345</p>
                  </div>
                )}
                {formData.payment_method === 'wire' && (
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Bank Name:</strong> First National Bank</p>
                    <p><strong>SWIFT Code:</strong> FIRSTUS33</p>
                    <p><strong>Account Number:</strong> 987654321</p>
                    <p className="mt-2 text-xs">Contact admin for additional wire instructions.</p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isProcessing || accounts.length === 0}
                className="w-full bg-blue-900 hover:bg-blue-800 text-lg py-6"
              >
                {isProcessing ? 'Processing...' : `Submit $${formData.amount || '0.00'} Contribution`}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-slate-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-slate-900 mb-3">How it works:</h3>
            <ol className="space-y-2 text-sm text-slate-700">
              <li className="flex gap-2">
                <span className="font-semibold text-blue-900">1.</span>
                Submit your contribution request through this form
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-900">2.</span>
                Transfer funds using the provided payment instructions
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-900">3.</span>
                Admin will verify receipt and allocate units to your account
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-900">4.</span>
                Your updated balance will appear in your dashboard within 1-2 business days
              </li>
            </ol>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}