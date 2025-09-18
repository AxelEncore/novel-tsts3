const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const db = new Database('./database.sqlite');

// Создаем таблицы
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id TEXT NOT NULL,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT NOT NULL,
    icon TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    visibility TEXT DEFAULT 'private',
    color TEXT DEFAULT '#3b82f6',
    settings TEXT DEFAULT '{}',
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    board_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT DEFAULT '#6b7280',
    settings TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    assignee_id TEXT,
    column_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    due_date DATETIME,
    estimated_hours INTEGER,
    tags TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (column_id) REFERENCES columns(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(project_id, user_id)
  );
`);

// Создаем тестовые данные
const userId = 'a7395264-ae97-466d-8dd3-65410a7266aa';
const projectId = '48d2ead8-a39b-4050-8179-8860f747f2dc';

// Вставляем тестовый проект
try {
  db.prepare('INSERT OR IGNORE INTO projects (id, name, description, creator_id) VALUES (?, ?, ?, ?)').run(
    projectId, 
    'Test Project', 
    'Test project for boards functionality', 
    userId
  );
  console.log('✅ Test project created successfully');
} catch (error) {
  console.log('❌ Error creating project:', error.message);
}

// Проверяем созданные таблицы
console.log('\n📊 Database tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(table => console.log(`  - ${table.name}`));

console.log('\n📋 Projects:');
const projects = db.prepare('SELECT * FROM projects').all();
console.log(projects);

db.close();
console.log('\n✅ Database initialization completed!');