# Batch refactor all JSX files in Pages directory to use semantic theme classes

$pagesDir = "c:\Users\AceGr\FFAinvestments\src\Pages"
$files = Get-ChildItem -Path $pagesDir -Filter "*.jsx" -Recurse -File

Write-Host "Found $($files.Count) JSX files to refactor`n" -ForegroundColor Cyan

$replacements = @(
    # App card classes
    @{ Pattern = 'className="app-card-header"'; Replacement = 'className="card-header"' }
    @{ Pattern = "className='app-card-header'"; Replacement = "className='card-header'" }
    @{ Pattern = 'className="app-card-content"'; Replacement = 'className="card-content"' }
    @{ Pattern = "className='app-card-content'"; Replacement = "className='card-content'" }
    @{ Pattern = 'className="app-card-title"'; Replacement = 'className="text-lg font-semibold text-default"' }
    @{ Pattern = "className='app-card-title'"; Replacement = "className='text-lg font-semibold text-default'" }
    @{ Pattern = 'className="app-card-subtitle"'; Replacement = 'className="text-sm text-muted"' }
    @{ Pattern = "className='app-card-subtitle'"; Replacement = "className='text-sm text-muted'" }
    @{ Pattern = 'className="app-card app-card-stat"'; Replacement = 'className="card text-center"' }
    @{ Pattern = "className='app-card app-card-stat'"; Replacement = "className='card text-center'" }
    @{ Pattern = 'className="app-card app-empty-state"'; Replacement = 'className="card text-center"' }
    @{ Pattern = "className='app-card app-empty-state'"; Replacement = "className='card text-center'" }
    @{ Pattern = 'className="app-card app-mb-lg"'; Replacement = 'className="card mb-8"' }
    @{ Pattern = "className='app-card app-mb-lg'"; Replacement = "className='card mb-8'" }
    @{ Pattern = 'className="app-card'; Replacement = 'className="card' }
    @{ Pattern = "className='app-card"; Replacement = "className='card" }
    
    # App button classes
    @{ Pattern = 'className="app-btn app-btn-primary app-btn-lg"'; Replacement = 'className="btn-primary text-lg px-8 py-3"' }
    @{ Pattern = "className='app-btn app-btn-primary app-btn-lg'"; Replacement = "className='btn-primary text-lg px-8 py-3'" }
    @{ Pattern = 'className="app-btn app-btn-primary app-btn-pill"'; Replacement = 'className="btn-primary rounded-full"' }
    @{ Pattern = "className='app-btn app-btn-primary app-btn-pill'"; Replacement = "className='btn-primary rounded-full'" }
    @{ Pattern = 'className="app-btn app-btn-primary app-btn-sm"'; Replacement = 'className="btn-primary text-sm px-3 py-1"' }
    @{ Pattern = "className='app-btn app-btn-primary app-btn-sm'"; Replacement = "className='btn-primary text-sm px-3 py-1'" }
    @{ Pattern = 'className="app-btn app-btn-primary"'; Replacement = 'className="btn-primary"' }
    @{ Pattern = "className='app-btn app-btn-primary'"; Replacement = "className='btn-primary'" }
    
    @{ Pattern = 'className="app-btn app-btn-outline app-btn-danger"'; Replacement = 'className="btn-primary-soft border border-red-500 text-red-500"' }
    @{ Pattern = "className='app-btn app-btn-outline app-btn-danger'"; Replacement = "className='btn-primary-soft border border-red-500 text-red-500'" }
    @{ Pattern = 'className="app-btn app-btn-outline app-btn-pill"'; Replacement = 'className="btn-primary-soft border border-border rounded-full"' }
    @{ Pattern = "className='app-btn app-btn-outline app-btn-pill'"; Replacement = "className='btn-primary-soft border border-border rounded-full'" }
    @{ Pattern = 'className="app-btn app-btn-outline app-btn-sm app-btn-pill"'; Replacement = 'className="btn-primary-soft border border-border text-sm px-3 py-1 rounded-full"' }
    @{ Pattern = "className='app-btn app-btn-outline app-btn-sm app-btn-pill'"; Replacement = "className='btn-primary-soft border border-border text-sm px-3 py-1 rounded-full'" }
    @{ Pattern = 'className="app-btn app-btn-outline app-btn-sm"'; Replacement = 'className="btn-primary-soft border border-border text-sm px-3 py-1"' }
    @{ Pattern = "className='app-btn app-btn-outline app-btn-sm'"; Replacement = "className='btn-primary-soft border border-border text-sm px-3 py-1'" }
    @{ Pattern = 'className="app-btn app-btn-outline app-btn-xs"'; Replacement = 'className="btn-primary-soft border border-border text-xs px-2 py-1"' }
    @{ Pattern = "className='app-btn app-btn-outline app-btn-xs'"; Replacement = "className='btn-primary-soft border border-border text-xs px-2 py-1'" }
    @{ Pattern = 'className="app-btn app-btn-outline"'; Replacement = 'className="btn-primary-soft border border-border"' }
    @{ Pattern = "className='app-btn app-btn-outline'"; Replacement = "className='btn-primary-soft border border-border'" }
    
    @{ Pattern = 'className="app-btn app-btn-success"'; Replacement = 'className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"' }
    @{ Pattern = "className='app-btn app-btn-success'"; Replacement = "className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700'" }
    @{ Pattern = 'className="app-btn app-btn-warning app-btn-pill"'; Replacement = 'className="bg-yellow-600 text-white px-4 py-2 rounded-full hover:bg-yellow-700"' }
    @{ Pattern = "className='app-btn app-btn-warning app-btn-pill'"; Replacement = "className='bg-yellow-600 text-white px-4 py-2 rounded-full hover:bg-yellow-700'" }
    
    # Form input classes
    @{ Pattern = 'className="app-input"'; Replacement = 'className="input"' }
    @{ Pattern = "className='app-input'"; Replacement = "className='input'" }
    
    # Alert classes
    @{ Pattern = 'className="app-alert app-alert-destructive"'; Replacement = 'className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg"' }
    @{ Pattern = "className='app-alert app-alert-destructive'"; Replacement = "className='bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg'" }
    @{ Pattern = 'className="app-alert app-alert-success"'; Replacement = 'className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg"' }
    @{ Pattern = "className='app-alert app-alert-success'"; Replacement = "className='bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg'" }
    
    # Typography classes
    @{ Pattern = 'className="app-heading-lg"'; Replacement = 'className="text-2xl font-bold text-default"' }
    @{ Pattern = "className='app-heading-lg'"; Replacement = "className='text-2xl font-bold text-default'" }
    @{ Pattern = 'className="app-heading-md"'; Replacement = 'className="text-xl font-semibold text-default"' }
    @{ Pattern = "className='app-heading-md'"; Replacement = "className='text-xl font-semibold text-default'" }
    @{ Pattern = 'className="app-text-muted"'; Replacement = 'className="text-muted"' }
    @{ Pattern = "className='app-text-muted'"; Replacement = "className='text-muted'" }
    
    # Table classes
    @{ Pattern = 'className="app-table'; Replacement = 'className="w-full border-collapse' }
    
    # Layout classes
    @{ Pattern = 'className="app-content"'; Replacement = 'className="space-y-6"' }
    @{ Pattern = "className='app-content'"; Replacement = "className='space-y-6'" }
    
    # Complex conditional alert patterns (for grep matches like app-alert with conditionals)
    @{ Pattern = 'className={`app-alert '; Replacement = 'className={`' }
)

$totalFiles = $files.Count
$processedCount = 0
$modifiedCount = 0

foreach ($file in $files) {
    $processedCount++
    $relativePath = $file.FullName.Replace($pagesDir + "\", "")
    Write-Host "[$processedCount/$totalFiles] Processing: $relativePath" -ForegroundColor Gray
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $changesMade = 0
    
    foreach ($replacement in $replacements) {
        $pattern = [regex]::Escape($replacement.Pattern)
        $regexMatches = ([regex]::Matches($content, $pattern)).Count
        if ($regexMatches -gt 0) {
            $content = $content -replace $pattern, $replacement.Replacement
            $changesMade += $regexMatches
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $modifiedCount++
        Write-Host "  ✓ Modified ($changesMade replacements)" -ForegroundColor Green
    } else {
        Write-Host "  - No changes needed" -ForegroundColor DarkGray
    }
}

Write-Host "`nRefactoring complete!" -ForegroundColor Green
Write-Host "Modified: $modifiedCount / $totalFiles files" -ForegroundColor Cyan
