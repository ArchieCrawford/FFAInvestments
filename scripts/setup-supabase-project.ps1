param(
    # Your Supabase project ref (from the dashboard URL / project settings)
    [string]$ProjectRef = "wynbgrgmrygkodcdumii",

    # Schema to generate types for
    [string]$Schema = "public"
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) {
    Write-Host "[INFO ] $msg"
}

function Write-ErrorLine($msg) {
    Write-Host "[ERROR] $msg" -ForegroundColor Red
}

function Run-Step {
    param(
        [string]$Title,
        [string]$Exe,
        [string[]]$Args
    )

    Write-Info "$Title"
    Write-Host "       > $Exe $($Args -join ' ')"

    & $Exe @Args
    $exit = $LASTEXITCODE

    if ($exit -ne 0) {
        throw "$Title failed with exit code $exit"
    }

    Write-Info "$Title completed successfully."
    Write-Host ""
}

try {
    Write-Host "============================================="
    Write-Host " Supabase Project Setup"
    Write-Host " Project Ref: $ProjectRef"
    Write-Host "============================================="
    Write-Host ""

    # 1) Sanity checks: Node & npx (explicit, so we can see exactly what runs)
    Write-Info "Checking Node installation"
    Write-Host "       > node --version"
    node --version
    if ($LASTEXITCODE -ne 0) {
        throw "Node is not installed or not available on PATH."
    }
    Write-Host ""

    Write-Info "Checking npx availability"
    Write-Host "       > npx --version"
    npx --version
    if ($LASTEXITCODE -ne 0) {
        throw "npx is not installed or not available on PATH."
    }
    Write-Host ""


    # 2) Initialize Supabase in this repo (creates supabase/ folder if missing)
    #    Safe to re-run; Supabase CLI will just reuse existing config.
    Run-Step "Initializing Supabase project (supabase init)" "npx" @("supabase", "init")

    # 3) Link this local repo to your specific remote project
    #    This will prompt you to sign in / use an access token if not already authed.
    Run-Step "Linking to remote project ($ProjectRef)" "npx" @("supabase", "link", "--project-ref", $ProjectRef)

    # 4) Pull the live DB schema down into supabase/db (migrations & schema)
    Run-Step "Pulling database schema from Supabase (db pull)" "npx" @("supabase", "db", "pull")

    # 5) Generate TypeScript types for this project & schema
    Write-Info "Generating TypeScript types for schema '$Schema'..."
    $typesOutput = & npx supabase gen types typescript --project-id $ProjectRef --schema $Schema 2>&1
    $exit = $LASTEXITCODE

    if ($exit -ne 0) {
        $typesOutput | Out-String | Write-ErrorLine
        throw "Type generation failed with exit code $exit"
    }

    # Ensure destination folder exists
    $typesPath = "src/lib"
    if (-not (Test-Path $typesPath)) {
        New-Item -ItemType Directory -Path $typesPath | Out-Null
    }

    $typesFile = Join-Path $typesPath "supabase.types.ts"
    $typesOutput | Set-Content -Path $typesFile -Encoding UTF8

    Write-Info "TypeScript types written to: $typesFile"
    Write-Host ""

    Write-Host "============================================="
    Write-Host " ✅ Supabase setup completed successfully."
    Write-Host "    - Project Ref: $ProjectRef"
    Write-Host "    - Schema:      $Schema"
    Write-Host "============================================="

} catch {
    Write-ErrorLine $_.Exception.Message
    Write-Host ""
    Write-Host "Something went wrong during Supabase setup."
    Write-Host "Check the error above, fix it, and re-run:"
    Write-Host "  pwsh -File .\scripts\setup-supabase-project.ps1"
    exit 1
}
