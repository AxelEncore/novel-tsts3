const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Путь к базе данных
const dbPath = path.join(__dirname, 'database.db');

console.log('🗑️ Удаление старой базы данных...');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Старая база данных удалена');
}

console.log('🔨 Создание новой базы данных...');
const db = new Database(dbPath);

// Создаем таблицы согласно исправленному SQLite адаптеру
console.log('📋 Создание таблиц...');

// Таблица users
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Таблица users создана');

// Таблица user_sessions (правильная таблица с session_token)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT,
    ip_address TEXT,
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Таблица user_sessions создана');

// Создаем индексы для производительности
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
`);
console.log('✅ Индексы созданы');

// Создаем остальные таблицы для полноты
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    project_id TEXT NOT NULL,
    visibility TEXT DEFAULT 'private',
    color TEXT DEFAULT '#3B82F6',
    settings TEXT DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  )
`);

console.log('✅ Остальные таблицы созданы');

// Проверяем структуру созданных таблиц
console.log('\n🔍 Проверка структуры таблиц...');

const userSessionsStructure = db.prepare("PRAGMA table_info(user_sessions)").all();
console.log('\n📋 Структура таблицы user_sessions:');
console.table(userSessionsStructure);

const sessionsExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'").get();
if (sessionsExists) {
  console.log('\n⚠️ Таблица sessions все еще существует');
  const sessionsStructure = db.prepare("PRAGMA table_info(sessions)").all();
  console.table(sessionsStructure);
} else {
  console.log('\n✅ Таблица sessions не существует (это правильно)');
}

// Создаем тестового пользователя
console.log('\n👤 Создание тестового пользователя...');
const testUserId = 'test-user-' + Date.now();
const insertUser = db.prepare(`
  INSERT INTO users (id, email, name) 
  VALUES (?, ?, ?)
`);
insertUser.run(testUserId, 'test@example.com', 'Test User');
console.log('✅ Тестовый пользователь создан:', testUserId);

// Создаем тестовую сессию
console.log('\n🔑 Создание тестовой сессии...');
const testToken = 'test-token-' + Date.now();
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 часа

const insertSession = db.prepare(`
  INSERT INTO user_sessions (user_id, session_token, expires_at) 
  VALUES (?, ?, ?)
`);
const result = insertSession.run(testUserId, testToken, expiresAt);
console.log('✅ Тестовая сессия создана:', {
  token: testToken,
  userId: testUserId,
  expiresAt: expiresAt,
  changes: result.changes
});

// Проверяем поиск сессии
console.log('\n🔍 Тестирование поиска сессии...');
const findSession = db.prepare(`
  SELECT s.*, u.email, u.name
  FROM user_sessions s
  JOIN users u ON s.user_id = u.id
  WHERE s.session_token = ? AND s.expires_at > datetime('now')
`);
const foundSession = findSession.get(testToken);

if (foundSession) {
  console.log('✅ Сессия найдена:', foundSession);
} else {
  console.log('❌ Сессия НЕ найдена');
}

// Статистика
console.log('\n📊 Статистика базы данных:');
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
const sessionCount = db.prepare('SELECT COUNT(*) as count FROM user_sessions').get();
console.log('Пользователей:', userCount.count);
console.log('Сессий:', sessionCount.count);

db.close();
console.log('\n🔌 База данных закрыта');
console.log('\n✅ Пересоздание базы данных завершено!');