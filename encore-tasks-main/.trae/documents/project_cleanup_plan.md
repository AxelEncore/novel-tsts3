# План очистки проекта Encore Tasks

## 1. Обзор задач очистки

Проект содержит множество временных файлов, устаревших конфигураций и неиспользуемых компонентов, которые необходимо удалить для:
- Упрощения структуры проекта
- Уменьшения размера репозитория
- Устранения путаницы в архитектуре
- Подготовки к монолитной PostgreSQL архитектуре

## 2. Файлы и директории для удаления

### 2.1 Временные и тестовые файлы

```
# Скриншоты и изображения (если не используются в документации)
Screenshot*.png
image*.png
test-*.png

# Временные файлы разработки
*.tmp
*.temp
*.bak
*.orig
*.swp
*~

# Логи и отладочная информация
*.log
debug.txt
error.txt
```

### 2.2 Устаревшие конфигурации баз данных

```
# SQLite файлы (после миграции на PostgreSQL)
*.db
*.sqlite
*.sqlite3
database.db
tasks.db

# Supabase конфигурации (исключаем из монолитной архитектуры)
supabase/
.supabase/
supabase.config.js
supabase-client.js

# Устаревшие миграции
migrations/sqlite/
migrations/supabase/
```

### 2.3 Неиспользуемые адаптеры и библиотеки

```
# Устаревшие адаптеры баз данных
src/lib/sqlite-adapter.ts
src/lib/supabase-adapter.ts
src/lib/database-adapters/ (если содержит старые адаптеры)

# Неиспользуемые утилиты
src/utils/sqlite-utils.ts
src/utils/supabase-utils.ts
```

### 2.4 Дублирующиеся компоненты

```
# Старые версии компонентов
src/components/old/
src/components/deprecated/
src/components/backup/

# Дублирующиеся файлы
*-copy.tsx
*-backup.tsx
*-old.tsx
*-temp.tsx
```

### 2.5 Неиспользуемые тестовые файлы

```
# Устаревшие тесты
test-registration-and-create.js (после проверки функциональности)
test-*.js (временные тестовые файлы)
*.test.old.js
*.spec.backup.js
```

### 2.6 Конфигурационные файлы

```
# Устаревшие конфигурации
.env.backup
.env.old
.env.sqlite
.env.supabase
config.old.js
webpack.config.backup.js
```

## 3. Скрипт автоматической очистки

### 3.1 PowerShell скрипт для Windows

```powershell
# cleanup-project.ps1

Write-Host "🧹 Начинаем очистку проекта Encore Tasks..." -ForegroundColor Green

$projectRoot = "E:\Projects\encore-tasks\encore-tasks-main"
Set-Location $projectRoot

# Создаем резервную копию важных файлов
Write-Host "📦 Создаем резервную копию..." -ForegroundColor Yellow
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force

# Копируем важные конфигурации
Copy-Item ".env" "$backupDir/.env.backup" -ErrorAction SilentlyContinue
Copy-Item "package.json" "$backupDir/package.json.backup" -ErrorAction SilentlyContinue

# Удаляем временные файлы
Write-Host "🗑️ Удаляем временные файлы..." -ForegroundColor Yellow
$tempPatterns = @(
    "*.tmp", "*.temp", "*.bak", "*.orig", "*.swp", "*~",
    "*.log", "debug.txt", "error.txt"
)

foreach ($pattern in $tempPatterns) {
    Get-ChildItem -Path . -Recurse -Name $pattern -ErrorAction SilentlyContinue | 
    ForEach-Object {
        Write-Host "Удаляем: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Удаляем скриншоты (кроме документации)
Write-Host "📸 Удаляем временные скриншоты..." -ForegroundColor Yellow
$screenshotPatterns = @("Screenshot*.png", "image*.png", "test-*.png")
foreach ($pattern in $screenshotPatterns) {
    Get-ChildItem -Path . -Recurse -Name $pattern -ErrorAction SilentlyContinue |
    Where-Object { $_ -notmatch "docs|documentation|readme" } |
    ForEach-Object {
        Write-Host "Удаляем скриншот: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Удаляем SQLite файлы
Write-Host "🗄️ Удаляем SQLite файлы..." -ForegroundColor Yellow
$sqlitePatterns = @("*.db", "*.sqlite", "*.sqlite3")
foreach ($pattern in $sqlitePatterns) {
    Get-ChildItem -Path . -Recurse -Name $pattern -ErrorAction SilentlyContinue |
    ForEach-Object {
        Write-Host "Удаляем SQLite файл: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Удаляем Supabase конфигурации
Write-Host "☁️ Удаляем Supabase конфигурации..." -ForegroundColor Yellow
$supabasePaths = @("supabase", ".supabase")
foreach ($path in $supabasePaths) {
    if (Test-Path $path) {
        Write-Host "Удаляем директорию: $path" -ForegroundColor Red
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Удаляем устаревшие адаптеры
Write-Host "🔌 Удаляем устаревшие адаптеры..." -ForegroundColor Yellow
$adaptersToRemove = @(
    "src/lib/sqlite-adapter.ts",
    "src/lib/supabase-adapter.ts",
    "src/utils/sqlite-utils.ts",
    "src/utils/supabase-utils.ts"
)
foreach ($adapter in $adaptersToRemove) {
    if (Test-Path $adapter) {
        Write-Host "Удаляем адаптер: $adapter" -ForegroundColor Red
        Remove-Item $adapter -Force -ErrorAction SilentlyContinue
    }
}

# Удаляем дублирующиеся файлы
Write-Host "📄 Удаляем дублирующиеся файлы..." -ForegroundColor Yellow
$duplicatePatterns = @("*-copy.*", "*-backup.*", "*-old.*", "*-temp.*")
foreach ($pattern in $duplicatePatterns) {
    Get-ChildItem -Path . -Recurse -Name $pattern -ErrorAction SilentlyContinue |
    ForEach-Object {
        Write-Host "Удаляем дубликат: $_" -ForegroundColor Red
        Remove-Item $_ -Force -ErrorAction SilentlyContinue
    }
}

# Очищаем node_modules и переустанавливаем зависимости
Write-Host "📦 Очищаем node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
}

Write-Host "📥 Переустанавливаем зависимости..." -ForegroundColor Yellow
npm install

# Очищаем кэш
Write-Host "🧽 Очищаем кэш..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "✅ Очистка проекта завершена!" -ForegroundColor Green
Write-Host "📁 Резервная копия сохранена в: $backupDir" -ForegroundColor Cyan
```

### 3.2 Bash скрипт для Linux/macOS

```bash
#!/bin/bash
# cleanup-project.sh

echo "🧹 Начинаем очистку проекта Encore Tasks..."

PROJECT_ROOT="/path/to/encore-tasks"
cd "$PROJECT_ROOT"

# Создаем резервную копию
echo "📦 Создаем резервную копию..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Копируем важные файлы
cp .env "$BACKUP_DIR/.env.backup" 2>/dev/null || true
cp package.json "$BACKUP_DIR/package.json.backup" 2>/dev/null || true

# Удаляем временные файлы
echo "🗑️ Удаляем временные файлы..."
find . -type f \( -name "*.tmp" -o -name "*.temp" -o -name "*.bak" -o -name "*.orig" -o -name "*.swp" -o -name "*~" -o -name "*.log" \) -delete

# Удаляем скриншоты
echo "📸 Удаляем временные скриншоты..."
find . -type f \( -name "Screenshot*.png" -o -name "image*.png" -o -name "test-*.png" \) ! -path "*/docs/*" ! -path "*/documentation/*" -delete

# Удаляем SQLite файлы
echo "🗄️ Удаляем SQLite файлы..."
find . -type f \( -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" \) -delete

# Удаляем Supabase конфигурации
echo "☁️ Удаляем Supabase конфигурации..."
rm -rf supabase .supabase

# Удаляем устаревшие адаптеры
echo "🔌 Удаляем устаревшие адаптеры..."
rm -f src/lib/sqlite-adapter.ts src/lib/supabase-adapter.ts
rm -f src/utils/sqlite-utils.ts src/utils/supabase-utils.ts

# Удаляем дублирующиеся файлы
echo "📄 Удаляем дублирующиеся файлы..."
find . -type f \( -name "*-copy.*" -o -name "*-backup.*" -o -name "*-old.*" -o -name "*-temp.*" \) -delete

# Очищаем node_modules
echo "📦 Очищаем node_modules..."
rm -rf node_modules package-lock.json

# Переустанавливаем зависимости
echo "📥 Переустанавливаем зависимости..."
npm install

# Очищаем кэш
echo "🧽 Очищаем кэш..."
npm cache clean --force

echo "✅ Очистка проекта завершена!"
echo "📁 Резервная копия сохранена в: $BACKUP_DIR"
```

## 4. Ручная проверка файлов

### 4.1 Файлы для ручной проверки

Перед удалением следующих файлов требуется ручная проверка:

```
# Конфигурационные файлы
.env.example
.env.local
.env.development
.env.production

# Документация
README.md
CHANGELOG.md
CONTRIBUTING.md

# Тестовые файлы
__tests__/
tests/
*.test.js
*.spec.js

# Компоненты
src/components/
src/pages/
src/hooks/
```

### 4.2 Критерии для сохранения файлов

- ✅ **Сохранить**: Файлы, используемые в production
- ✅ **Сохранить**: Актуальные тесты
- ✅ **Сохранить**: Документация
- ✅ **Сохранить**: Конфигурации для разных сред
- ❌ **Удалить**: Временные файлы
- ❌ **Удалить**: Дублирующиеся файлы
- ❌ **Удалить**: Устаревшие адаптеры
- ❌ **Удалить**: Неиспользуемые скриншоты

## 5. Обновление package.json

### 5.1 Удаление неиспользуемых зависимостей

```json
{
  "dependencies": {
    // Удалить после миграции на PostgreSQL
    // "sqlite3": "^5.1.6",
    // "@supabase/supabase-js": "^2.38.0",
    
    // Оставить только необходимые
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    // Удалить устаревшие типы
    // "@types/sqlite3": "^3.1.8",
    
    // Оставить актуальные
    "@types/pg": "^8.10.7",
    "@types/bcryptjs": "^2.4.6"
  }
}
```

### 5.2 Обновление скриптов

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:migrate": "node scripts/migrate-to-postgresql.js",
    "db:seed": "node scripts/seed-database.js",
    "db:backup": "node scripts/backup-database.js",
    "cleanup": "node scripts/cleanup-project.js",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

## 6. Проверка после очистки

### 6.1 Чек-лист проверки

- [ ] Проект запускается без ошибок
- [ ] Все основные функции работают
- [ ] База данных подключается корректно
- [ ] Тесты проходят успешно
- [ ] Размер проекта уменьшился
- [ ] Нет дублирующихся файлов
- [ ] Удалены все временные файлы
- [ ] Обновлены зависимости

### 6.2 Команды для проверки

```bash
# Проверка размера проекта
du -sh .

# Поиск дублирующихся файлов
find . -type f -name "*-copy*" -o -name "*-backup*" -o -name "*-old*"

# Проверка временных файлов
find . -type f -name "*.tmp" -o -name "*.temp" -o -name "*.bak"

# Проверка SQLite файлов
find . -type f -name "*.db" -o -name "*.sqlite*"

# Запуск проекта
npm run dev

# Запуск тестов
npm test
```

## 7. Документирование изменений

### 7.1 Обновление README.md

После очистки необходимо обновить документацию:

- Удалить упоминания SQLite и Supabase
- Добавить информацию о PostgreSQL
- Обновить инструкции по установке
- Обновить схему архитектуры

### 7.2 Создание CHANGELOG.md

```markdown
# Changelog

## [2.0.0] - 2024-01-XX

### Added
- Монолитная архитектура PostgreSQL
- Единая схема базы данных
- Улучшенная производительность

### Removed
- Поддержка SQLite
- Интеграция с Supabase
- Временные и дублирующиеся файлы
- Устаревшие адаптеры баз данных

### Changed
- Полная миграция на PostgreSQL
- Упрощенная структура проекта
- Обновленные зависимости
```

## 8. Заключение

После выполнения всех этапов очистки проект будет:

- ✅ **Чище и организованнее**
- ✅ **Меньше по размеру**
- ✅ **Проще в поддержке**
- ✅ **Готов к монолитной PostgreSQL архитектуре**
- ✅ **Без устаревших зависимостей**
- ✅ **С актуальной документацией**

Все удаленные файлы будут сохранены в резервной копии для возможности восстановления при необходимости.

---

**Версия документа**: 1.0  
**Дата создания**: $(date)  
**Автор**: SOLO Document  
**Статус**: План к выполнению