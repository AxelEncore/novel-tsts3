# Монолитная архитектура PostgreSQL для Encore Tasks

## 1. Обзор архитектуры

### 1.1 Принципы архитектуры
- **Единая структура**: Строго одна база данных PostgreSQL для всех компонентов системы
- **Отказоустойчивость**: Использование транзакций, индексов и ограничений целостности
- **Стабильность**: Проверенные паттерны проектирования и оптимизированные запросы
- **VDS совместимость**: Архитектура адаптирована для развертывания на виртуальных серверах
- **Многопользовательский режим**: Полная поддержка concurrent операций и синхронизации данных

### 1.2 Архитектурная диаграмма

```mermaid
graph TD
    A[Frontend Application] --> B[API Layer]
    B --> C[Business Logic Layer]
    C --> D[Data Access Layer]
    D --> E[PostgreSQL Database]
    
    subgraph "Application Layers"
        B
        C
        D
    end
    
    subgraph "Database Layer"
        E --> F[Users & Auth]
        E --> G[Projects & Teams]
        E --> H[Boards & Columns]
        E --> I[Tasks & Comments]
        E --> J[Files & Attachments]
        E --> K[Sessions & Logs]
    end
```

## 2. Структура базы данных

### 2.1 Основные таблицы

#### Пользователи и аутентификация
- `users` - Основная таблица пользователей
- `sessions` - Активные сессии пользователей
- `user_permissions` - Права доступа пользователей

#### Проекты и команды
- `projects` - Проекты в системе
- `project_members` - Участники проектов
- `teams` - Команды пользователей
- `team_members` - Участники команд

#### Доски и колонки
- `boards` - Kanban доски
- `columns` - Колонки досок
- `board_templates` - Шаблоны досок

#### Задачи и контент
- `tasks` - Основная таблица задач
- `task_assignees` - Назначенные исполнители
- `task_dependencies` - Зависимости между задачами
- `comments` - Комментарии к задачам
- `attachments` - Файловые вложения

#### Теги и метаданные
- `tags` - Теги для категоризации
- `task_tags` - Связь задач и тегов
- `custom_fields` - Пользовательские поля

### 2.2 Полная схема базы данных

```sql
-- Включаем необходимые расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ТАБЛИЦА СЕССИЙ
-- =====================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(512) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ТАБЛИЦА ПРОЕКТОВ
-- =====================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'team')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    settings JSONB DEFAULT '{}',
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ТАБЛИЦА УЧАСТНИКОВ ПРОЕКТОВ
-- =====================================================
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- =====================================================
-- ТАБЛИЦА ДОСОК
-- =====================================================
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    color VARCHAR(7) DEFAULT '#3B82F6',
    settings JSONB DEFAULT '{}',
    template_id UUID,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ТАБЛИЦА КОЛОНОК
-- =====================================================
CREATE TABLE columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    color VARCHAR(7) DEFAULT '#6B7280',
    task_limit INTEGER,
    settings JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ТАБЛИЦА ЗАДАЧ
-- =====================================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
    column_id UUID REFERENCES columns(id) ON DELETE SET NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    position INTEGER DEFAULT 0,
    story_points INTEGER,
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2),
    deadline TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ТАБЛИЦА НАЗНАЧЕНИЙ ЗАДАЧ
-- =====================================================
CREATE TABLE task_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, user_id)
);

-- =====================================================
-- ТАБЛИЦА ТЕГОВ
-- =====================================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, project_id)
);

-- =====================================================
-- ТАБЛИЦА СВЯЗИ ЗАДАЧ И ТЕГОВ
-- =====================================================
CREATE TABLE task_tags (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

-- =====================================================
-- ТАБЛИЦА КОММЕНТАРИЕВ
-- =====================================================
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ТАБЛИЦА ВЛОЖЕНИЙ
-- =====================================================
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK ((task_id IS NOT NULL) OR (comment_id IS NOT NULL))
);

-- =====================================================
-- ТАБЛИЦА ЗАВИСИМОСТЕЙ ЗАДАЧ
-- =====================================================
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'relates_to')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, depends_on_task_id),
    CHECK (task_id != depends_on_task_id)
);

-- =====================================================
-- ТАБЛИЦА УВЕДОМЛЕНИЙ
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ТАБЛИЦА АКТИВНОСТИ
-- =====================================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Индексы и оптимизация

### 3.1 Основные индексы

```sql
-- Индексы для пользователей
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_approval_status ON users(approval_status);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Индексы для сессий
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Индексы для проектов
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_visibility ON projects(visibility);

-- Индексы для участников проектов
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role);

-- Индексы для досок
CREATE INDEX idx_boards_project_id ON boards(project_id);
CREATE INDEX idx_boards_is_active ON boards(is_active);
CREATE INDEX idx_boards_position ON boards(position);

-- Индексы для колонок
CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_columns_position ON columns(position);
CREATE INDEX idx_columns_is_active ON columns(is_active);

-- Индексы для задач
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_board_id ON tasks(board_id);
CREATE INDEX idx_tasks_column_id ON tasks(column_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_reporter_id ON tasks(reporter_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_is_active ON tasks(is_active);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Индексы для назначений
CREATE INDEX idx_task_assignees_task_id ON task_assignees(task_id);
CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);

-- Индексы для тегов
CREATE INDEX idx_tags_project_id ON tags(project_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);

-- Индексы для комментариев
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_comment_id ON comments(parent_comment_id);

-- Индексы для вложений
CREATE INDEX idx_attachments_task_id ON attachments(task_id);
CREATE INDEX idx_attachments_comment_id ON attachments(comment_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);

-- Индексы для зависимостей
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- Индексы для уведомлений
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Индексы для логов активности
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Полнотекстовый поиск
CREATE INDEX idx_tasks_title_search ON tasks USING gin(to_tsvector('russian', title));
CREATE INDEX idx_tasks_description_search ON tasks USING gin(to_tsvector('russian', description));
CREATE INDEX idx_projects_name_search ON projects USING gin(to_tsvector('russian', name));
```

### 3.2 Триггеры для автоматического обновления

```sql
-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_columns_updated_at BEFORE UPDATE ON columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Конфигурация подключения

### 4.1 Переменные окружения

```env
# PostgreSQL Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/encore_tasks
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=encore_tasks
POSTGRES_USER=encore_user
POSTGRES_PASSWORD=secure_password
POSTGRES_SSL=false

# Connection Pool Settings
POSTGRES_MAX_CONNECTIONS=20
POSTGRES_IDLE_TIMEOUT=30000
POSTGRES_CONNECTION_TIMEOUT=2000

# Application Settings
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here
NODE_ENV=production
```

### 4.2 Конфигурация для VDS

```javascript
// database/config.js
const config = {
  production: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB || 'encore_tasks',
    user: process.env.POSTGRES_USER || 'encore_user',
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_SSL === 'true' ? {
      rejectUnauthorized: false
    } : false,
    max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS) || 20,
    idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT) || 2000,
  }
};

module.exports = config;
```

## 5. Стратегия миграции

### 5.1 Этапы миграции

1. **Подготовка**
   - Создание новой PostgreSQL базы данных
   - Применение схемы
   - Настройка индексов

2. **Миграция данных**
   - Экспорт данных из SQLite
   - Трансформация данных
   - Импорт в PostgreSQL

3. **Обновление кода**
   - Замена адаптеров базы данных
   - Обновление SQL запросов
   - Тестирование функциональности

4. **Валидация**
   - Проверка целостности данных
   - Тестирование производительности
   - Проверка всех функций

### 5.2 Скрипт миграции

```javascript
// scripts/migrate-to-postgresql.js
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3');

class DatabaseMigrator {
  constructor(sqliteDbPath, postgresConfig) {
    this.sqliteDbPath = sqliteDbPath;
    this.pgPool = new Pool(postgresConfig);
  }

  async migrate() {
    console.log('🚀 Начинаем миграцию данных...');
    
    try {
      // 1. Создаем схему PostgreSQL
      await this.createSchema();
      
      // 2. Мигрируем данные
      await this.migrateUsers();
      await this.migrateProjects();
      await this.migrateBoards();
      await this.migrateColumns();
      await this.migrateTasks();
      await this.migrateComments();
      
      console.log('✅ Миграция завершена успешно!');
    } catch (error) {
      console.error('❌ Ошибка миграции:', error);
      throw error;
    }
  }

  async createSchema() {
    const schemaPath = path.join(__dirname, '../database/postgresql_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await this.pgPool.query(schema);
    console.log('✅ Схема PostgreSQL создана');
  }

  async migrateUsers() {
    // Логика миграции пользователей
    console.log('📦 Мигрируем пользователей...');
  }

  // Другие методы миграции...
}

module.exports = DatabaseMigrator;
```

## 6. Развертывание на VDS

### 6.1 Требования к серверу

- **ОС**: Ubuntu 20.04+ или CentOS 8+
- **RAM**: Минимум 2GB, рекомендуется 4GB+
- **Диск**: Минимум 20GB SSD
- **CPU**: 2+ ядра
- **PostgreSQL**: Версия 13+
- **Node.js**: Версия 18+

### 6.2 Установка PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Создание пользователя и базы данных
sudo -u postgres psql
CREATE USER encore_user WITH PASSWORD 'secure_password';
CREATE DATABASE encore_tasks OWNER encore_user;
GRANT ALL PRIVILEGES ON DATABASE encore_tasks TO encore_user;
\q
```

### 6.3 Конфигурация PostgreSQL

```bash
# Редактируем postgresql.conf
sudo nano /etc/postgresql/13/main/postgresql.conf

# Основные настройки
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Редактируем pg_hba.conf
sudo nano /etc/postgresql/13/main/pg_hba.conf

# Добавляем строку для локального подключения
local   encore_tasks    encore_user                     md5
host    encore_tasks    encore_user     127.0.0.1/32    md5

# Перезапускаем PostgreSQL
sudo systemctl restart postgresql
```

### 6.4 Мониторинг и обслуживание

```sql
-- Скрипт для мониторинга производительности
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Анализ размера таблиц
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Регулярное обслуживание
VACUUM ANALYZE;
REINDEX DATABASE encore_tasks;
```

## 7. Безопасность и резервное копирование

### 7.1 Настройки безопасности

```sql
-- Создание ролей с ограниченными правами
CREATE ROLE app_read;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read;

CREATE ROLE app_write;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_write;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_write;

-- Политики безопасности на уровне строк (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_access_policy ON projects
    FOR ALL TO app_write
    USING (owner_id = current_setting('app.current_user_id')::UUID
           OR EXISTS (
               SELECT 1 FROM project_members 
               WHERE project_id = projects.id 
               AND user_id = current_setting('app.current_user_id')::UUID
           ));
```

### 7.2 Резервное копирование

```bash
#!/bin/bash
# backup.sh - Скрипт резервного копирования

BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="encore_tasks_backup_$DATE.sql"

# Создаем директорию если не существует
mkdir -p $BACKUP_DIR

# Создаем резервную копию
pg_dump -h localhost -U encore_user -d encore_tasks > $BACKUP_DIR/$BACKUP_FILE

# Сжимаем архив
gzip $BACKUP_DIR/$BACKUP_FILE

# Удаляем старые копии (старше 30 дней)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Резервная копия создана: $BACKUP_DIR/$BACKUP_FILE.gz"
```

## 8. Производительность и масштабирование

### 8.1 Оптимизация запросов

```sql
-- Примеры оптимизированных запросов

-- Получение задач проекта с пагинацией
SELECT 
    t.*,
    u.name as assignee_name,
    u.avatar_url as assignee_avatar,
    c.title as column_title,
    b.name as board_name
FROM tasks t
LEFT JOIN users u ON t.assignee_id = u.id
LEFT JOIN columns c ON t.column_id = c.id
LEFT JOIN boards b ON t.board_id = b.id
WHERE t.project_id = $1 AND t.is_active = true
ORDER BY t.position, t.created_at
LIMIT $2 OFFSET $3;

-- Получение статистики проекта
WITH project_stats AS (
    SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
        COUNT(*) FILTER (WHERE deadline < CURRENT_TIMESTAMP AND status != 'done') as overdue_tasks
    FROM tasks 
    WHERE project_id = $1 AND is_active = true
)
SELECT 
    p.*,
    ps.total_tasks,
    ps.completed_tasks,
    ps.in_progress_tasks,
    ps.overdue_tasks,
    CASE 
        WHEN ps.total_tasks > 0 
        THEN ROUND((ps.completed_tasks::DECIMAL / ps.total_tasks) * 100, 2)
        ELSE 0 
    END as completion_percentage
FROM projects p
CROSS JOIN project_stats ps
WHERE p.id = $1;
```

### 8.2 Кэширование

```javascript
// lib/cache.js
const Redis = require('redis');

class CacheManager {
  constructor() {
    this.client = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
  }

  async get(key) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, ttl = 3600) {
    await this.client.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern) {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}

module.exports = new CacheManager();
```

## 9. Заключение

Данная архитектура обеспечивает:

- ✅ **Единую структуру данных** без фрагментации
- ✅ **Высокую производительность** благодаря оптимизированным индексам
- ✅ **Отказоустойчивость** через транзакции и ограничения целостности
- ✅ **Масштабируемость** для роста пользовательской базы
- ✅ **Простоту развертывания** на VDS серверах
- ✅ **Безопасность** данных и доступа

Все изменения в архитектуре должны вноситься только после обновления данного документа и согласования с командой разработки.

---

**Версия документа**: 1.0  
**Дата создания**: $(date)  
**Автор**: SOLO Document  
**Статус**: Эталонная архитектура