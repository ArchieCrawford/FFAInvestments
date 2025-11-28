param(
    [string]$Url,
    [string]$AnonKey
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) {
    Write-Host "[INFO ] $msg"
}

function Write-ErrorLine($msg) {
    Write-Host "[ERROR] $msg" -ForegroundColor Red
}

try {
    Write-Host "============================================="
    Write-Host " Supabase Data Diagnostics"
    Write-Host "============================================="
    Write-Host ""

    Write-Info "Checking Node installation..."
    node --version | Write-Host
    if ($LASTEXITCODE -ne 0) {
        throw "Node is not available on PATH."
    }

    $envFile = ".env.local"
    if (-not $Url -or -not $AnonKey) {
        if (-not (Test-Path $envFile)) {
            throw "No Url/AnonKey provided and .env.local not found."
        }

        Write-Info "Loading credentials from .env.local ..."
        $envLines = Get-Content $envFile
        foreach ($line in $envLines) {
            if ($line -match "^\s*#") { continue }
            if ($line -match "^\s*$") { continue }

            $parts = $line -split "=", 2
            if ($parts.Count -ne 2) { continue }

            $key = $parts[0].Trim()
            $val = $parts[1].Trim()

            if (-not $Url -and $key -eq "VITE_SUPABASE_URL") {
                $Url = $val
            }
            if (-not $AnonKey -and $key -eq "VITE_SUPABASE_ANON_KEY") {
                $AnonKey = $val
            }
        }
    }

    if (-not $Url -or -not $AnonKey) {
        throw "Could not resolve Supabase URL or anon key. Pass them as parameters or ensure .env.local has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    }

    Write-Info "Using Supabase URL: $Url"
    Write-Info "Using anon key from env (hidden)"
    Write-Host ""

    $diagnosticScript = @"
import { createClient } from '@supabase/supabase-js';

const url = "$Url";
const anon = "$AnonKey";

if (!url || !anon) {
  console.error('[TEST] Missing URL or anon key.');
  process.exit(1);
}

console.log('[TEST] URL:', url);

const supabase = createClient(url, anon);

async function checkTable(table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error(\`[TEST] \${table}: ERROR \${error.message}\`);
  } else {
    console.log(\`[TEST] \${table}: \${count} rows\`);
  }
}

async function run() {
  const tables = [
    'member_accounts',
    'member_monthly_balances',
    'club_unit_valuations',
    'ffa_timeline',
    'unit_prices'
  ];

  for (const t of tables) {
    await checkTable(t);
  }

  process.exit(0);
}

run().catch(err => {
  console.error('[TEST] Unexpected error:', err);
  process.exit(1);
});
"@

    $diagnosticFile = "supabase-data-diagnose.mjs"
    Write-Info "Writing diagnostic script to $diagnosticFile ..."
    $diagnosticScript | Set-Content -Path $diagnosticFile -Encoding UTF8

    Write-Info "Running Node diagnostic script..."
    node $diagnosticFile
    $exit = $LASTEXITCODE

    if ($exit -ne 0) {
        throw "Diagnostic script failed with exit code $exit."
    }

    Write-Host ""
    Write-Host "============================================="
    Write-Host " Supabase data diagnostics completed."
    Write-Host " Check the [TEST] lines above for row counts."
    Write-Host "============================================="

} catch {
    Write-ErrorLine $_.Exception.Message
    Write-Host ""
    Write-Host "Diagnostics failed. Fix the issue above and re-run:"
    Write-Host "  pwsh -File .\scripts\diagnose-supabase-data.ps1"
    exit 1
}
