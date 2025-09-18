# cleanup-project.ps1
# Script for cleaning Encore Tasks project from temporary files

Write-Host "Cleaning Encore Tasks project..." -ForegroundColor Green

$projectRoot = "E:\Projects\encore-tasks\encore-tasks-main"
Set-Location $projectRoot

# Create backup
Write-Host "Creating backup..." -ForegroundColor Yellow
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force

# Backup important files
Copy-Item ".env" "$backupDir\.env.backup" -ErrorAction SilentlyContinue
Copy-Item "package.json" "$backupDir\package.json.backup" -ErrorAction SilentlyContinue

# Remove temporary files
Write-Host "Removing temporary files..." -ForegroundColor Yellow
$tempPatterns = @("*.tmp", "*.temp", "*.bak", "*.orig", "*.swp", "*~", "*.log", "debug*.txt", "error*.txt", "*.tsbuildinfo")

foreach ($pattern in $tempPatterns) {
    Get-ChildItem -Path . -Recurse -Name $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Removing: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Remove screenshots
Write-Host "Removing screenshots..." -ForegroundColor Yellow
$screenshotPatterns = @("*.png", "*.jpg", "*.jpeg", "*.gif", "*.html")
foreach ($pattern in $screenshotPatterns) {
    Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue | Where-Object { $_ -notmatch "public|docs|documentation|readme" } | ForEach-Object {
        Write-Host "Removing screenshot: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Remove SQLite files
Write-Host "Removing SQLite files..." -ForegroundColor Yellow
$sqlitePatterns = @("*.db", "*.sqlite", "*.sqlite3")
foreach ($pattern in $sqlitePatterns) {
    Get-ChildItem -Path . -Recurse -Name $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Removing SQLite file: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Remove test scripts
Write-Host "Removing test files..." -ForegroundColor Yellow
$testPatterns = @("test-*.js", "test-*.mjs", "test-*.ps1", "debug-*.js", "check-*.js", "check-*.mjs", "create-*.js", "fix-*.js", "apply-*.js", "analyze-*.js", "simple-*.js", "final-*.js", "comprehensive-*.js", "manual-*.js")
foreach ($pattern in $testPatterns) {
    Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Removing test file: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Remove old configs
Write-Host "Removing old configs..." -ForegroundColor Yellow
$configsToRemove = @(".env.mysql.example", ".env.sqlite", "tsconfig.refactored.json", "docker-compose.postgresql.yml")
foreach ($config in $configsToRemove) {
    if (Test-Path $config) {
        Write-Host "Removing config: $config" -ForegroundColor Red
        Remove-Item $config -Force -ErrorAction SilentlyContinue
    }
}

# Remove old documentation
Write-Host "Removing old documentation..." -ForegroundColor Yellow
$docsToRemove = @("MYSQL_*.md", "COOKIE_CACHE_FIXES.md", "FINAL_REPORT.md", "NEW_ARCHITECTURE_PLAN.md", "NEXT_STEPS.md", "POSTGRESQL_SETUP.md", "final-report.md")
foreach ($doc in $docsToRemove) {
    Get-ChildItem -Path . -Name $doc -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Removing doc: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Remove temporary SQL files
Write-Host "Removing temporary SQL files..." -ForegroundColor Yellow
Get-ChildItem -Path . -Name "*.sql" -ErrorAction SilentlyContinue | Where-Object { $_ -notmatch "postgresql_schema|schema" } | ForEach-Object {
    Write-Host "Removing SQL file: $_" -ForegroundColor Red
    Remove-Item $_ -Force -ErrorAction SilentlyContinue
}

# Remove duplicates
Write-Host "Removing duplicates..." -ForegroundColor Yellow
$duplicatePatterns = @("*-copy.*", "*-backup.*", "*-old.*", "*-temp.*")
foreach ($pattern in $duplicatePatterns) {
    Get-ChildItem -Path . -Recurse -Name $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Removing duplicate: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Clean scripts directory
if (Test-Path "scripts") {
    Get-ChildItem -Path "scripts" -Name "test-*" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Removing from scripts: $_" -ForegroundColor Red
        Remove-Item "scripts\$_" -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Project cleanup completed!" -ForegroundColor Green
Write-Host "Backup created in: $backupDir" -ForegroundColor Cyan
Write-Host "Project ready for PostgreSQL migration" -ForegroundColor Green

# Show statistics
Write-Host "\nCleanup statistics:" -ForegroundColor Yellow
$remainingFiles = (Get-ChildItem -Path . -Recurse -File | Measure-Object).Count
Write-Host "Remaining files: $remainingFiles" -ForegroundColor Cyan

Write-Host "\nNext steps:" -ForegroundColor Yellow
Write-Host "1. Setup PostgreSQL connection" -ForegroundColor White
Write-Host "2. Create database schema" -ForegroundColor White
Write-Host "3. Update database-adapter.ts" -ForegroundColor White
Write-Host "4. Test functionality" -ForegroundColor White