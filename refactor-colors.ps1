# Refactor raw Tailwind color classes to semantic theme classes

$pagesDir = "c:\Users\AceGr\FFAinvestments\src\Pages"
$files = Get-ChildItem -Path $pagesDir -Filter "*.jsx" -Recurse -File

Write-Host "Found $($files.Count) JSX files to refactor color classes`n" -ForegroundColor Cyan

$colorReplacements = @(
    # Background colors
    @{ Pattern = 'bg-slate-50'; Replacement = 'bg-bg' }
    @{ Pattern = 'bg-slate-100'; Replacement = 'bg-bg' }
    @{ Pattern = 'bg-slate-200'; Replacement = 'bg-surface' }
    @{ Pattern = 'bg-slate-800'; Replacement = 'bg-surface' }
    @{ Pattern = 'bg-slate-900'; Replacement = 'bg-surface' }
    @{ Pattern = 'bg-blue-600'; Replacement = 'bg-primary' }
    @{ Pattern = 'bg-blue-700'; Replacement = 'bg-primary hover:bg-primary/90' }
    @{ Pattern = 'bg-blue-50'; Replacement = 'bg-primary-soft' }
    @{ Pattern = 'bg-blue-900'; Replacement = 'bg-primary' }
    @{ Pattern = 'bg-indigo-600'; Replacement = 'bg-primary' }
    @{ Pattern = 'bg-indigo-700'; Replacement = 'bg-primary hover:bg-primary/90' }
    
    # Text colors
    @{ Pattern = 'text-slate-900'; Replacement = 'text-default' }
    @{ Pattern = 'text-slate-800'; Replacement = 'text-default' }
    @{ Pattern = 'text-slate-700'; Replacement = 'text-default' }
    @{ Pattern = 'text-slate-600'; Replacement = 'text-muted' }
    @{ Pattern = 'text-slate-500'; Replacement = 'text-muted' }
    @{ Pattern = 'text-slate-400'; Replacement = 'text-muted' }
    @{ Pattern = 'text-slate-200'; Replacement = 'text-muted' }
    
    # Border colors
    @{ Pattern = 'border-slate-200'; Replacement = 'border-border' }
    @{ Pattern = 'border-slate-300'; Replacement = 'border-border' }
    @{ Pattern = 'border-slate-700'; Replacement = 'border-border' }
    
    # Hover colors (need to be more specific)
    @{ Pattern = 'hover:bg-blue-700'; Replacement = 'hover:bg-primary/90' }
    @{ Pattern = 'hover:bg-blue-600'; Replacement = 'hover:bg-primary/90' }
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
    
    foreach ($replacement in $colorReplacements) {
        $pattern = [regex]::Escape($replacement.Pattern)
        $matchCount = ([regex]::Matches($content, $pattern)).Count
        if ($matchCount -gt 0) {
            $content = $content -replace $pattern, $replacement.Replacement
            $changesMade += $matchCount
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

Write-Host "`nColor refactoring complete!" -ForegroundColor Green
Write-Host "Modified: $modifiedCount / $totalFiles files" -ForegroundColor Cyan
