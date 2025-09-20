# PowerShell script to fix syntax errors in TypeScript files
# Fixes $1, $2, $3, $4 patterns to proper ternary operators

$files = @(
    "src\components\BoardList.tsx",
    "src\components\ProjectList.tsx",
    "src\components\CreateProjectWithBoardsModal.tsx",
    "src\components\IconPicker.tsx",
    "src\components\Calendar.tsx",
    "src\components\TaskModal.tsx",
    "src\components\ArchivedTasksModal.tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path (Get-Location) $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing $file..." -ForegroundColor Green
        
        # Read file content
        $content = Get-Content $fullPath -Raw
        
        # Replace patterns $1, $2, $3, $4 with proper ? : syntax
        # Pattern: something $1 value1 : value2
        $content = $content -replace '([\s\(])?\$1(\s+)', '$1? '
        $content = $content -replace '([\s\(])?\$2(\s+)', '$1? '
        $content = $content -replace '([\s\(])?\$3(\s+)', '$1? '
        $content = $content -replace '([\s\(])?\$4(\s+)', '$1? '
        
        # Special case for direct property access
        $content = $content -replace '\.description\$1:', '.description?:'
        $content = $content -replace '\.selectedProjectId\$1:', '.selectedProjectId?:'
        
        # Write back
        Set-Content $fullPath $content -NoNewline
        Write-Host "  Fixed $file" -ForegroundColor Yellow
    } else {
        Write-Host "  File not found: $fullPath" -ForegroundColor Red
    }
}

Write-Host "`nAll files processed!" -ForegroundColor Green