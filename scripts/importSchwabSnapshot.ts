// scripts/importSchwabSnapshot.ts
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: ts-node importSchwabSnapshot.ts <json-file>");
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);
  const rawText = fs.readFileSync(fullPath, "utf8");
  const payload = JSON.parse(rawText);

  const snapshotTs: string = payload.timestamp;
  const accounts = payload.data;

  const accountRows: { account_number: string; account_type: string | null; display_name: string | null }[] = [];
  const snapshotRows: any[] = [];
  const positionRows: any[] = [];

  for (const acct of accounts) {
    const sa = acct.securitiesAccount;
    const acctNumber = sa.accountNumber as string;
    const acctType = sa.type || null;
    const displayName = sa.accountNickname || null;

    accountRows.push({
      account_number: acctNumber,
      account_type: acctType,
      display_name: displayName
    });

    const curr = sa.currentBalances || {};
    const agg = acct.aggregatedBalance || {};

    snapshotRows.push({
      snapshot_date: snapshotTs.slice(0, 10),
      account_number: acctNumber,
      cash_balance: curr.cashBalance ?? null,
      money_market_fund: curr.moneyMarketFund ?? null,
      long_stock_value: curr.longStockValue ?? null,
      long_option_value: curr.longOptionMarketValue ?? null,
      mutual_fund_value: curr.mutualFundValue ?? null,
      long_marginable_value: curr.longMarginValue ?? null,
      long_non_marginable_value: curr.longNonMarginableMarketValue ?? null,
      total_cash: curr.totalCash ?? null,
      current_liquidation_value: agg.currentLiquidationValue ?? null,
      liquidation_value: agg.liquidationValue ?? null
    });

    const positions = sa.positions || [];
    for (const p of positions) {
      const instr = p.instrument || {};
      positionRows.push({
        snapshot_date: snapshotTs,
        account_number: acctNumber,
        symbol: instr.symbol || null,
        description: instr.description || null,
        long_quantity: p.longQuantity ?? null,
        short_quantity: p.shortQuantity ?? null,
        average_price: p.averagePrice ?? null,
        market_value: p.marketValue ?? null,
        current_day_pl: p.currentDayProfitLoss ?? null,
        current_day_pl_pct: p.currentDayProfitLossPercentage ?? null
      });
    }
  }

  const { error: acctErr } = await supabase
    .from("schwab_accounts")
    .upsert(accountRows, { onConflict: "account_number" });
  if (acctErr) throw acctErr;

  const { error: snapErr } = await supabase
    .from("schwab_account_snapshots")
    .insert(snapshotRows);
  if (snapErr) throw snapErr;

  const { error: posErr } = await supabase
    .from("schwab_positions")
    .insert(positionRows);
  if (posErr) throw posErr;

  console.log("Imported Schwab snapshot:", snapshotTs);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
