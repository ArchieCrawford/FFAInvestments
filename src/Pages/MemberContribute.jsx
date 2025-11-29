import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { useCurrentMember } from "@/lib/authHooks";
import { createMemberUnitTransaction, getLatestUnitValuation } from "@/lib/ffaApi";
import { supabase } from "@/lib/supabase";
import { Page } from "../components/Page";

export default function MemberContribute() {
  const navigate = useNavigate();
  const { member, loading: memberLoading } = useCurrentMember();

  const [formData, setFormData] = useState({
    account_id: "",
    amount: "",
    payment_method: "bank_transfer",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!memberLoading && !member) {
      navigate("/login", { replace: true });
    }
  }, [memberLoading, member, navigate]);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["member-accounts", member?.member_id],
    enabled: !!member,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_accounts")
        .select("*")
  .eq("member_id", member ? member.member_id : null);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: latestValuation } = useQuery({
    queryKey: ["latest-unit-valuation"],
    queryFn: getLatestUnitValuation,
  });

  const createContribution = useMutation({
    mutationFn: async (contributionData) => {
      try {
        const latest = latestValuation || (await getLatestUnitValuation());
        const unitValue = latest?.unit_value ?? null;

        if (member?.member_id) {
          await createMemberUnitTransaction({
            member_id: member.member_id,
            tx_date: new Date().toISOString().split("T")[0],
            tx_type: "contribution",
            cash_amount: Number(contributionData.amount),
            unit_value_at_tx: unitValue,
            units_delta: 0,
            notes: `${contributionData.payment_method} contribution - Pending unit allocation`,
          });
        }
      } catch (e) {
        console.warn("Failed to write member_unit_transactions row", e);
        throw e;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger-entries"] });
      queryClient.invalidateQueries({ queryKey: ["member-accounts"] });
      setSuccess("Contribution submitted successfully! Units will be allocated by admin.");
      setFormData({
        account_id: "",
        amount: "",
        payment_method: "bank_transfer",
      });
    },
    onError: (err) => {
      setError((err && err.message) ? err.message : "Failed to submit contribution");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.account_id) {
      setError("Please select an account");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    try {
      await createContribution.mutateAsync({
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const estimatedUnits =
    formData.amount && latestValuation?.unit_value
      ? parseFloat(formData.amount) / latestValuation.unit_value
      : 0;

  if (memberLoading) {
    return (
      <Page title="Make a Contribution">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-muted mt-4">Loading...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <Page title="Make a Contribution" subtitle="Add funds to your investment account">
      <div className="max-w-3xl mx-auto space-y-6">
        {error && (
          <div className="card p-4 border-l-4 border-red-500 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="card p-4 border-l-4 border-green-500 flex items-start gap-3 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
            <p className="text-green-600">{success}</p>
          </div>
        )}

        <div className="card">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-default flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Contribution Details
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-default">Select Account *</label>
                <Select
                  value={formData.account_id}
                  onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                  required
                  disabled={accountsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={accountsLoading ? "Loading accounts..." : "Choose an account"} />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No accounts available
                      </SelectItem>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.nickname || account.account_name || account.member_name || "Account"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-default">Contribution Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="input pl-8"
                    required
                  />
                </div>
                {formData.amount && latestValuation?.unit_value && (
                  <p className="text-sm text-muted">
                    ≈ {estimatedUnits.toFixed(4)} units at current value of $
                    {latestValuation.unit_value.toFixed(4)}/unit
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-default">Payment Method *</label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
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

              <div className="bg-primary-soft border border-border rounded-lg p-4">
                <h4 className="font-semibold text-default mb-2">Payment Instructions</h4>
                {formData.payment_method === "bank_transfer" && (
                  <div className="text-sm text-default space-y-1">
                    <p>
                      <strong>Account Name:</strong> FFA Investment Club
                    </p>
                    <p>
                      <strong>Routing Number:</strong> 123456789
                    </p>
                    <p>
                      <strong>Account Number:</strong> 987654321
                    </p>
                    <p className="mt-2 text-xs">Please include your name in the transfer memo.</p>
                  </div>
                )}
                {formData.payment_method === "check" && (
                  <div className="text-sm text-default space-y-1">
                    <p>
                      Make check payable to: <strong>FFA Investment Club</strong>
                    </p>
                    <p className="mt-2">Mail to:</p>
                    <p>
                      FFA Investment Club
                      <br />
                      123 Main Street
                      <br />
                      Anytown, ST 12345
                    </p>
                  </div>
                )}
                {formData.payment_method === "wire" && (
                  <div className="text-sm text-default space-y-1">
                    <p>
                      <strong>Bank Name:</strong> First National Bank
                    </p>
                    <p>
                      <strong>SWIFT Code:</strong> FIRSTUS33
                    </p>
                    <p>
                      <strong>Account Number:</strong> 987654321
                    </p>
                    <p className="mt-2 text-xs">Contact admin for additional wire instructions.</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isProcessing || accounts.length === 0}
                className="btn-primary w-full text-lg py-4 rounded-lg"
              >
                {isProcessing
                  ? "Processing..."
                  : `Submit $${formData.amount || "0.00"} Contribution`}
              </button>
            </form>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-default mb-3">How it works:</h3>
          <ol className="space-y-2 text-sm text-default">
            <li className="flex gap-2">
              <span className="font-semibold text-primary">1.</span>
              Submit your contribution request through this form
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">2.</span>
              Transfer funds using the provided payment instructions
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">3.</span>
              Admin will verify receipt and allocate units to your account
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-primary">4.</span>
              Your updated balance will appear in your dashboard within 1–2 business days
            </li>
          </ol>
        </div>
      </div>
    </Page>
  );
}
