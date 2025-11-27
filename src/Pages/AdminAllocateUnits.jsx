import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calculator, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { getLatestUnitValuation, createMemberUnitTransaction, getMembers } from "@/lib/ffaApi";

export default function AdminAllocateUnits() {
  const [formData, setFormData] = useState({
    member_id: "",
    tx_date: new Date().toISOString().split('T')[0],
    cash_amount: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [computedUnits, setComputedUnits] = useState(null);

  const queryClient = useQueryClient();

  // Fetch members list
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });

  // Fetch latest unit valuation for display
  const { data: latestValuation } = useQuery({
    queryKey: ['latest-unit-valuation'],
    queryFn: getLatestUnitValuation,
  });

  // Mutation to create allocation transaction
  const allocateMutation = useMutation({
    mutationFn: async (allocationData) => {
      // Fetch latest unit valuation at time of allocation
      const latest = await getLatestUnitValuation();
      
      if (!latest || !latest.unit_value) {
        throw new Error('No unit valuation available. Please ensure club_unit_valuations has at least one record.');
      }

      const unitValue = latest.unit_value;
      const units = Number(allocationData.cash_amount) / unitValue;

      // Create allocation transaction
      await createMemberUnitTransaction({
        member_id: allocationData.member_id,
        tx_date: allocationData.tx_date,
        tx_type: 'allocation',
        cash_amount: 0, // Allocation doesn't represent new cash
        unit_value_at_tx: unitValue,
        units_delta: units,
        notes: `Unit allocation: ${units.toFixed(4)} units at $${unitValue.toFixed(4)}/unit for $${Number(allocationData.cash_amount).toFixed(2)} contribution`
      });

      return { units, unitValue };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['member-transactions'] });
      setSuccess(`Successfully allocated ${data.units.toFixed(4)} units at $${data.unitValue.toFixed(4)}/unit`);
      setComputedUnits(data.units);
      setFormData({
        member_id: "",
        tx_date: new Date().toISOString().split('T')[0],
        cash_amount: "",
      });
      setIsProcessing(false);
    },
    onError: (err) => {
      setError(err.message || 'Failed to allocate units');
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setComputedUnits(null);

    if (!formData.member_id) {
      setError('Please select a member');
      return;
    }

    if (!formData.cash_amount || parseFloat(formData.cash_amount) <= 0) {
      setError('Please enter a valid cash amount');
      return;
    }

    setIsProcessing(true);
    allocateMutation.mutate(formData);
  };

  // Calculate estimated units when cash amount changes
  React.useEffect(() => {
    if (formData.cash_amount && latestValuation?.unit_value) {
      const estimated = parseFloat(formData.cash_amount) / latestValuation.unit_value;
      setComputedUnits(estimated);
    } else {
      setComputedUnits(null);
    }
  }, [formData.cash_amount, latestValuation]);

  return (
    <div className="p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold text-default mb-2">Allocate Units to Member</h1>
          <p className="text-muted">Assign units to members based on their contributions</p>
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
              <Calculator className="w-5 h-5 text-blue-900" />
              Unit Allocation Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Current Unit Price Display */}
              {latestValuation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Current Unit Value</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ${latestValuation.unit_value?.toFixed(4) || '0.0000'}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    As of {latestValuation.valuation_date ? new Date(latestValuation.valuation_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              )}

              {/* Member Selection */}
              <div className="space-y-2">
                <Label>Select Member *</Label>
                <Select
                  value={formData.member_id}
                  onValueChange={(value) => setFormData({...formData, member_id: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {membersLoading ? (
                      <SelectItem value="loading" disabled>Loading members...</SelectItem>
                    ) : members.length === 0 ? (
                      <SelectItem value="none" disabled>No members available</SelectItem>
                    ) : (
                      members.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.member_name || member.email || `Member ${member.id.substring(0, 8)}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Date */}
              <div className="space-y-2">
                <Label>Transaction Date *</Label>
                <Input
                  type="date"
                  value={formData.tx_date}
                  onChange={(e) => setFormData({...formData, tx_date: e.target.value})}
                  required
                />
              </div>

              {/* Cash Amount */}
              <div className="space-y-2">
                <Label>Cash Amount (Contribution) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.cash_amount}
                    onChange={(e) => setFormData({...formData, cash_amount: e.target.value})}
                    placeholder="0.00"
                    className="pl-8"
                    required
                  />
                </div>
                {computedUnits && latestValuation && (
                  <p className="text-sm text-muted">
                    Will allocate <span className="font-semibold text-default">{computedUnits.toFixed(4)} units</span> at ${latestValuation.unit_value.toFixed(4)}/unit
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isProcessing || membersLoading || members.length === 0 || !latestValuation}
                className="w-full bg-primary hover:bg-blue-800 text-lg py-6"
              >
                {isProcessing ? 'Processing...' : 'Allocate Units'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="border-none shadow-lg bg-bg">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-default mb-3">How unit allocation works:</h3>
            <ol className="space-y-2 text-sm text-default">
              <li className="flex gap-2">
                <span className="font-semibold text-blue-900">1.</span>
                Member makes a contribution (recorded separately via MemberContribute page)
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-900">2.</span>
                Admin verifies the contribution cash amount
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-900">3.</span>
                Admin uses this tool to allocate units: units = cash_amount / current_unit_value
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-900">4.</span>
                The allocation is recorded in member_unit_transactions with tx_type='allocation'
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-blue-900">5.</span>
                Member's unit balance is updated automatically
              </li>
            </ol>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
