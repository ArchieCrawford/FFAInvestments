Param(
    [string]$EnvFilePath = ".env.local",
    [switch]$WriteEnv
)

# ===============================
# Utility: Structured logging
# ===============================
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO ] $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN ] $Message" -ForegroundColor Yellow
}

function Write-ErrorLog {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# ===============================
# Step 0: Basic environment checks
# ===============================
Write-Info "Starting Supabase connection diagnostics..."

try {
    $nodeVersion = node -v 2>$null
    if (-not $nodeVersion) {
        throw "Node.js not found in PATH. Install Node and restart VS Code."
    }
    Write-Info "Node detected: $nodeVersion"
} catch {
    Write-ErrorLog $_
    exit 1
}

try {
    $npmVersion = npm -v 2>$null
    if (-not $npmVersion) {
        throw "npm not found in PATH. Ensure Node.js installed with npm."
    }
    Write-Info "npm detected: $npmVersion"
} catch {
    Write-ErrorLog $_
    exit 1
}

# ===============================
# Step 1: Ensure supabase-js is installed locally
# ===============================
Write-Info "Checking for local supabase-js dependency..."

$pkgJsonPath = Join-Path (Get-Location) "package.json"
if (-not (Test-Path $pkgJsonPath)) {
    Write-Warn "package.json not found in this folder. Are you in the project root?"
} else {
    $pkgJson = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
    $hasSupabase = $false

    if ($pkgJson.dependencies -and $pkgJson.dependencies."@supabase/supabase-js") {
        $hasSupabase = $true
    }
    if ($pkgJson.devDependencies -and $pkgJson.devDependencies."@supabase/supabase-js") {
        $hasSupabase = $true
    }

    if (-not $hasSupabase) {
        Write-Warn "@supabase/supabase-js not found in package.json. Installing locally..."
        try {
            npm install @supabase/supabase-js --save-dev
            Write-Info "Installed @supabase/supabase-js as devDependency."
        } catch {
            Write-ErrorLog "Failed to install @supabase/supabase-js. Details:"
            Write-ErrorLog $_
            exit 1
        }
    } else {
        Write-Info "@supabase/supabase-js already present."
    }
}

# ===============================
# Step 2: Prompt for Supabase credentials
# ===============================
Write-Host ""
Write-Info "Enter your Supabase project details."

# If env vars are set, use them as defaults
$defaultUrl = $env:SUPABASE_URL
$defaultAnon = $env:SUPABASE_ANON_KEY

if ($defaultUrl) {
    Write-Info "Found existing SUPABASE_URL in environment. Using as default."
}
if ($defaultAnon) {
    Write-Info "Found existing SUPABASE_ANON_KEY in environment. Using as default."
}

$SupabaseUrl = Read-Host "Supabase URL (e.g. https://xyzcompany.supabase.co) [`$defaultUrl: $defaultUrl`]"
if (-not $SupabaseUrl -and $defaultUrl) {
    $SupabaseUrl = $defaultUrl
}

$SupabaseAnonKey = Read-Host "Supabase anon key (from Settings → API) [`$defaultAnon: (hidden)`]"
if (-not $SupabaseAnonKey -and $defaultAnon) {
    $SupabaseAnonKey = $defaultAnon
}

if (-not $SupabaseUrl -or -not $SupabaseAnonKey) {
    Write-ErrorLog "Supabase URL or anon key missing. Cannot continue."
    exit 1
}

# Optional: service role key (not required)
$SupabaseServiceKey = Read-Host "Supabase service role key (optional, press Enter to skip)"

# ===============================
# Step 3: Optional .env.local write
# ===============================
if ($WriteEnv) {
    Write-Info "Writing to $EnvFilePath ..."
    try {
        $lines = @()
        if (Test-Path $EnvFilePath) {
            $lines = Get-Content $EnvFilePath
        }

        # Remove old lines if they exist
        $lines = $lines | Where-Object { 
            ($_ -notmatch "^SUPABASE_URL=") -and 
            ($_ -notmatch "^SUPABASE_ANON_KEY=") -and
            ($_ -notmatch "^SUPABASE_SERVICE_ROLE_KEY=")
        }

        $lines += "SUPABASE_URL=$SupabaseUrl"
        $lines += "SUPABASE_ANON_KEY=$SupabaseAnonKey"

        if ($SupabaseServiceKey) {
            $lines += "SUPABASE_SERVICE_ROLE_KEY=$SupabaseServiceKey"
        }

        $lines | Set-Content $EnvFilePath -Encoding UTF8
        Write-Info "Updated $EnvFilePath with Supabase credentials."
    } catch {
        Write-ErrorLog "Failed to write $EnvFilePath = ".env.local""
        Write-ErrorLog $_
    }
} else {
    Write-Warn "Skipping .env.local write (run with -WriteEnv to enable)."
}

# ===============================
# Step 4: Node test script to validate connection
# ===============================
Write-Info "Running live Supabase connectivity test using node..."

$testScript = @"
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '$SupabaseUrl';
const anonKey = process.env.SUPABASE_ANON_KEY || '$SupabaseAnonKey';

function log(section, msg) {
  console.log(`[TEST] [\${section}] \${msg}`);
}

async function main() {
  try {
    if (!url || !anonKey) {
      throw new Error('Missing Supabase URL or anon key inside test script.');
    }

    log('init', 'Creating Supabase client...');
    const supabase = createClient(url, anonKey);

    // 1) Simple auth ping: whoami (if auth enabled)
    try {
      log('auth', 'Testing current session (should be null for anon)...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        log('auth', 'Auth getSession error: ' + sessionError.message);
      } else {
        log('auth', 'Session OK (likely null for anon key).');
      }
    } catch (e) {
      log('auth', 'Auth test threw: ' + e.message);
    }

    // 2) Test a simple table query: member_accounts (read-only)
    try {
      log('db', 'Testing select from member_accounts (limit 3)...');
      const { data, error } = await supabase
        .from('member_accounts')
        .select('member_id, member_name, current_units, current_value')
        .limit(3);

      if (error) {
        log('db', 'ERROR selecting member_accounts: ' + error.message);
      } else {
        log('db', 'member_accounts sample rows:');
        log('db', JSON.stringify(data, null, 2));
      }
    } catch (e) {
      log('db', 'member_accounts test threw: ' + e.message);
    }

    // 3) Test RPC api_get_member_timeline with a dummy UUID (will probably 0 rows, but should not 500)
    try {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      log('rpc', 'Calling rpc(\"api_get_member_timeline\", { member_id_in: ' + fakeId + ' })...');
      const { data, error } = await supabase.rpc('api_get_member_timeline', { member_id_in: fakeId });
      if (error) {
        log('rpc', 'ERROR from api_get_member_timeline: ' + error.message);
      } else {
        log('rpc', 'api_get_member_timeline returned:');
        log('rpc', JSON.stringify(data, null, 2));
      }
    } catch (e) {
      log('rpc', 'RPC test threw: ' + e.message);
    }

    log('done', 'Supabase connectivity test finished.');
  } catch (err) {
    console.error('[TEST] [fatal] ' + err.message);
    process.exit(1);
  }
}

main();
"@

# Write to a temp file
$testFile = Join-Path (Get-Location) "supabase-connection-test.mjs"
try {
    $testScript | Set-Content $testFile -Encoding UTF8
    Write-Info "Wrote connection test script to $testFile"
} catch {
    Write-ErrorLog "Failed to write test script file:"
    Write-ErrorLog $_
    exit 1
}

# Run the test script
try {
    node $testFile
    Write-Info "Supabase test script completed. Review [TEST] logs above for details."
} catch {
    Write-ErrorLog "Node test script crashed:"
    Write-ErrorLog $_
    exit 1
} finally {
    # Optional: clean up the file; comment this out if you want to keep it
    # Remove-Item $testFile -ErrorAction SilentlyContinue
}

Write-Info "Diagnostics finished."
