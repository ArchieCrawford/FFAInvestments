// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const finnhubApiKey = Deno.env.get("FINNHUB_API_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

serve(async (_req: Request): Promise<Response> => {
  try {
    const { data: rows, error: rowsError } = await supabase
      .from("schwab_positions")
      .select("symbol, description")
      .or("description.is.null,description.eq.('')")
      .not("symbol", "is", null)
      .limit(100);

    if (rowsError) throw rowsError;
    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ updated: 0, message: "No symbols to enrich" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const distinctSymbols = Array.from(
      new Set(rows.map((r: any) => r.symbol).filter(Boolean))
    );

    let updatedCount = 0;

    for (const symbol of distinctSymbols) {
      const { data: cached } = await supabase
        .from("security_master")
        .select("symbol, name")
        .eq("symbol", symbol)
        .maybeSingle();

      let name = cached?.name || null;

      if (!name) {
        const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(
          symbol
        )}`;
        const resp = await fetch(url, {
          headers: { "X-Finnhub-Token": finnhubApiKey },
        });

        if (resp.status === 429) {
          break;
        }

        if (!resp.ok) continue;

        const profile = await resp.json();
        name = profile.name || profile.ticker || null;
      }

      if (!name) continue;

      await supabase.from("security_master").upsert({
        symbol,
        name,
        last_checked_at: new Date().toISOString(),
      });

      const { error: updateError } = await supabase
        .from("schwab_positions")
        .update({ description: name })
        .eq("symbol", symbol)
        .or("description.is.null,description.eq.('')");

      if (!updateError) updatedCount++;
    }

    return new Response(JSON.stringify({ updated: updatedCount }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
