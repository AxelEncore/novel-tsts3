# Техническое руководство по реализации PostgreSQL архитектуры

## 1. Пошаговый план реализации

### 1.1 Этапы внедрения

1. **Подготовка** (1-2 дня)
   - Анализ текущего состояния
   - Создание резервных копий
   - Настройка PostgreSQL

2. **Миграция данных** (2-3 дня)
   - Создание новой схемы
   - Перенос данных из SQLite
   - Валидация целостности

3. **Обновление кода** (3-4 дня)
   - Замена адаптеров
   - Обновление API
   - Тестирование функций

4. **Оптимизация** (1-2 дня)
   - Настройка индексов
   - Оптимизация запросов
   - Мониторинг производительности

5. **Развертывание** (1 день)
   - Подготовка production
   - Финальная миграция
   - Проверка работоспособности

## 2. Детальная реализация

### 2.1 Настройка PostgreSQL

#### Установка и конфигурация

```bash
# Windows (через Chocolatey)
choco install postgresql

# Или скачать с официального сайта
# https://www.postgresql.org/download/windows/

# Создание пользователя и базы данных
psql -U postgres
CREATE USER encore_user WITH PASSWORD 'secure_password_2024';
CREATE DATABASE encore_tasks OWNER encore_user;
GRANT ALL PRIVILEGES ON DATABASE encore_tasks TO encore_user;
\q
```

#### Конфигурация подключения

```env
# .env
DATABASE_URL=postgresql://encore_user:secure_password_2024@localhost:5432/encore_tasks
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=encore_tasks
POSTGRES_USER=encore_user
POSTGRES_PASSWORD=secure_password_2024
POSTGRES_SSL=false
POSTGRES_MAX_CONNECTIONS=20
```

### 2.2 Создание схемы базы данных

#### Скрипт создания схемы

```javascript
// scripts/create-schema.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class SchemaCreator {
  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });
  }

  async createSchema() {
    console.log('🏗️ Создаем схему PostgreSQL...');
    
    try {
      // Читаем SQL файл схемы
      const schemaPath = path.join(__dirname, '../database/postgresql_schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Выполняем создание схемы
      await this.pool.query(schemaSql);
      
      console.log('✅ Схема PostgreSQL создана успешно');
      
      // Проверяем созданные таблицы
      await this.verifyTables();
      
    } catch (error) {
      console.error('❌ Ошибка создания схемы:', error);
      throw error;
    }
  }

  async verifyTables() {
    console.log('🔍 Проверяем созданные таблицы...');
    
    const result = await this.pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Созданные таблицы:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
  }

  async close() {
    await this.pool.end();
  }
}

// Запуск создания схемы
if (require.main === module) {
  require('dotenv').config();
  
  const creator = new SchemaCreator();
  creator.createSchema()
    .then(() => {
      console.log('🎉 Схема готова к использованию!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    })
    .finally(() => {
      creator.close();
    });
}

module.exports = SchemaCreator;
```

### 2.3 Миграция данных

#### Скрипт миграции из SQLite

```javascript
// scripts/migrate-data.js
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class DataMigrator {
  constructor(sqliteDbPath) {
    this.sqliteDbPath = sqliteDbPath;
    this.pgPool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    });
    this.sqliteDb = null;
  }

  async migrate() {
    console.log('🚀 Начинаем миграцию данных из SQLite в PostgreSQL...');
    
    try {
      // Подключаемся к SQLite
      await this.connectSQLite();
      
      // Мигрируем данные по порядку (учитывая зависимости)
      await this.migrateUsers();
      await this.migrateSessions();
      await this.migrateProjects();
      await this.migrateProjectMembers();
      await this.migrateBoards();
      await this.migrateColumns();
      await this.migrateTasks();
      await this.migrateComments();
      await this.migrateAttachments();
      
      console.log('✅ Миграция данных завершена успешно!');
      
      // Проверяем результаты
      await this.verifyMigration();
      
    } catch (error) {
      console.error('❌ Ошибка миграции:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async connectSQLite() {
    return new Promise((resolve, reject) => {
      this.sqliteDb = new sqlite3.Database(this.sqliteDbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📂 Подключились к SQLite базе данных');
          resolve();
        }
      });
    });
  }

  async migrateUsers() {
    console.log('👥 Мигрируем пользователей...');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM users', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          for (const row of rows) {
            // Хешируем пароль если он не захеширован
            let passwordHash = row.password;
            if (!passwordHash.startsWith('$2')) {
              passwordHash = await bcrypt.hash(passwordHash, 10);
            }
            
            await this.pgPool.query(`
              INSERT INTO users (
                id, email, password_hash, name, avatar_url, role, 
                approval_status, is_active, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (email) DO NOTHING
            `, [
              row.id || this.generateUUID(),
              row.email,
              passwordHash,
              row.name,
              row.avatar_url,
              row.role || 'user',
              row.approval_status || 'approved',
              row.is_active !== false,
              row.created_at || new Date(),
              row.updated_at || new Date()
            ]);
          }
          
          console.log(`✅ Мигрировано ${rows.length} пользователей`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateProjects() {
    console.log('📁 Мигрируем проекты...');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM projects', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          for (const row of rows) {
            await this.pgPool.query(`
              INSERT INTO projects (
                id, name, description, color, icon, owner_id, 
                visibility, status, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (id) DO NOTHING
            `, [
              row.id || this.generateUUID(),
              row.name,
              row.description,
              row.color || '#3B82F6',
              row.icon,
              row.owner_id,
              row.visibility || 'private',
              row.status || 'active',
              row.created_at || new Date(),
              row.updated_at || new Date()
            ]);
          }
          
          console.log(`✅ Мигрировано ${rows.length} проектов`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateBoards() {
    console.log('📋 Мигрируем доски...');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM boards', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          for (const row of rows) {
            await this.pgPool.query(`
              INSERT INTO boards (
                id, name, description, project_id, position, 
                visibility, color, created_by, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (id) DO NOTHING
            `, [
              row.id || this.generateUUID(),
              row.name,
              row.description,
              row.project_id,
              row.position || 0,
              row.visibility || 'private',
              row.color || '#3B82F6',
              row.created_by,
              row.created_at || new Date(),
              row.updated_at || new Date()
            ]);
          }
          
          console.log(`✅ Мигрировано ${rows.length} досок`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateColumns() {
    console.log('📊 Мигрируем колонки...');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM columns', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          for (const row of rows) {
            await this.pgPool.query(`
              INSERT INTO columns (
                id, title, board_id, position, color, 
                task_limit, created_by, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (id) DO NOTHING
            `, [
              row.id || this.generateUUID(),
              row.title,
              row.board_id,
              row.position || 0,
              row.color || '#6B7280',
              row.task_limit,
              row.created_by,
              row.created_at || new Date(),
              row.updated_at || new Date()
            ]);
          }
          
          console.log(`✅ Мигрировано ${rows.length} колонок`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateTasks() {
    console.log('✅ Мигрируем задачи...');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM tasks', async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          for (const row of rows) {
            await this.pgPool.query(`
              INSERT INTO tasks (
                id, title, description, status, priority, project_id, 
                board_id, column_id, assignee_id, reporter_id, 
                position, deadline, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
              ON CONFLICT (id) DO NOTHING
            `, [
              row.id || this.generateUUID(),
              row.title,
              row.description,
              row.status || 'todo',
              row.priority || 'medium',
              row.project_id,
              row.board_id,
              row.column_id,
              row.assignee_id,
              row.reporter_id,
              row.position || 0,
              row.deadline,
              row.created_at || new Date(),
              row.updated_at || new Date()
            ]);
          }
          
          console.log(`✅ Мигрировано ${rows.length} задач`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateComments() {
    console.log('💬 Мигрируем комментарии...');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM comments', async (err, rows) => {
        if (err) {
          // Если таблица не существует, пропускаем
          console.log('ℹ️ Таблица комментариев не найдена, пропускаем...');
          resolve();
          return;
        }
        
        try {
          for (const row of rows) {
            await this.pgPool.query(`
              INSERT INTO comments (
                id, content, task_id, author_id, 
                parent_comment_id, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (id) DO NOTHING
            `, [
              row.id || this.generateUUID(),
              row.content,
              row.task_id,
              row.author_id,
              row.parent_comment_id,
              row.created_at || new Date(),
              row.updated_at || new Date()
            ]);
          }
          
          console.log(`✅ Мигрировано ${rows.length} комментариев`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateAttachments() {
    console.log('📎 Мигрируем вложения...');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM attachments', async (err, rows) => {
        if (err) {
          // Если таблица не существует, пропускаем
          console.log('ℹ️ Таблица вложений не найдена, пропускаем...');
          resolve();
          return;
        }
        
        try {
          for (const row of rows) {
            await this.pgPool.query(`
              INSERT INTO attachments (
                id, filename, original_name, file_size, mime_type, 
                file_path, task_id, uploaded_by, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (id) DO NOTHING
            `, [
              row.id || this.generateUUID(),
              row.filename,
              row.original_name,
              row.file_size,
              row.mime_type,
              row.file_path,
              row.task_id,
              row.uploaded_by,
              row.created_at || new Date()
            ]);
          }
          
          console.log(`✅ Мигрировано ${rows.length} вложений`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateSessions() {
    console.log('🔐 Мигрируем сессии...');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM sessions', async (err, rows) => {
        if (err) {
          console.log('ℹ️ Таблица сессий не найдена, пропускаем...');
          resolve();
          return;
        }
        
        try {
          for (const row of rows) {
            // Проверяем, не истекла ли сессия
            const expiresAt = new Date(row.expires_at);
            if (expiresAt > new Date()) {
              await this.pgPool.query(`
                INSERT INTO sessions (
                  id, session_token, user_id, expires_at, 
                  ip_address, user_agent, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (session_token) DO NOTHING
              `, [
                row.id || this.generateUUID(),
                row.session_token,
                row.user_id,
                row.expires_at,
                row.ip_address,
                row.user_agent,
                row.created_at || new Date()
              ]);
            }
          }
          
          console.log(`✅ Мигрировано активных сессий`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async migrateProjectMembers() {
    console.log('👥 Мигрируем участников проектов...');
    
    return new Promise((resolve, reject) => {
      this.sqliteDb.all('SELECT * FROM project_members', async (err, rows) => {
        if (err) {
          console.log('ℹ️ Таблица участников проектов не найдена, пропускаем...');
          resolve();
          return;
        }
        
        try {
          for (const row of rows) {
            await this.pgPool.query(`
              INSERT INTO project_members (
                id, project_id, user_id, role, joined_at
              ) VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (project_id, user_id) DO NOTHING
            `, [
              row.id || this.generateUUID(),
              row.project_id,
              row.user_id,
              row.role || 'member',
              row.joined_at || new Date()
            ]);
          }
          
          console.log(`✅ Мигрировано ${rows.length} участников проектов`);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async verifyMigration() {
    console.log('🔍 Проверяем результаты миграции...');
    
    const tables = [
      'users', 'sessions', 'projects', 'project_members',
      'boards', 'columns', 'tasks', 'comments', 'attachments'
    ];
    
    for (const table of tables) {
      try {
        const result = await this.pgPool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`📊 ${table}: ${result.rows[0].count} записей`);
      } catch (error) {
        console.log(`⚠️ Таблица ${table} не найдена или пуста`);
      }
    }
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async cleanup() {
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
    await this.pgPool.end();
  }
}

// Запуск миграции
if (require.main === module) {
  require('dotenv').config();
  
  const sqliteDbPath = process.argv[2] || './database.db';
  const migrator = new DataMigrator(sqliteDbPath);
  
  migrator.migrate()
    .then(() => {
      console.log('🎉 Миграция данных завершена успешно!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Критическая ошибка миграции:', error);
      process.exit(1);
    });
}

module.exports = DataMigrator;
```

### 2.4 Обновление адаптера базы данных

#### Новый PostgreSQL адаптер

```javascript
// src/lib/postgresql-adapter.ts
import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  max?: number;
}

export class PostgreSQLAdapter {
  private pool: Pool;
  private isInitialized: boolean = false;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.max || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Проверяем подключение
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      this.isInitialized = true;
      console.log('✅ PostgreSQL адаптер инициализирован');
    } catch (error) {
      console.error('❌ Ошибка инициализации PostgreSQL:', error);
      throw error;
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // =====================================================
  // МЕТОДЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ
  // =====================================================

  async createUser(userData: any): Promise<any> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const result = await this.query(`
      INSERT INTO users (email, password_hash, name, role, approval_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role, approval_status, created_at
    `, [
      userData.email,
      hashedPassword,
      userData.name,
      userData.role || 'user',
      userData.approval_status || 'pending'
    ]);
    
    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    return result.rows[0];
  }

  async getUserById(id: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0];
  }

  async updateUser(id: string, updates: any): Promise<any> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'password') {
        fields.push(`password_hash = $${paramIndex}`);
        values.push(await bcrypt.hash(value as string, 10));
      } else {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }

    values.push(id);
    
    const result = await this.query(`
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);
    
    return result.rows[0];
  }

  // =====================================================
  // МЕТОДЫ ДЛЯ ПРОЕКТОВ
  // =====================================================

  async createProject(projectData: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO projects (name, description, color, icon, owner_id, visibility)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      projectData.name,
      projectData.description,
      projectData.color || '#3B82F6',
      projectData.icon,
      projectData.owner_id,
      projectData.visibility || 'private'
    ]);
    
    return result.rows[0];
  }

  async getProjectsByUserId(userId: string): Promise<any[]> {
    const result = await this.query(`
      SELECT DISTINCT p.* 
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE p.owner_id = $1 OR pm.user_id = $1
      AND p.status = 'active'
      ORDER BY p.updated_at DESC
    `, [userId]);
    
    return result.rows;
  }

  async getProjectById(id: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM projects WHERE id = $1 AND status = \'active\'',
      [id]
    );
    return result.rows[0];
  }

  // =====================================================
  // МЕТОДЫ ДЛЯ ДОСОК
  // =====================================================

  async createBoard(boardData: any): Promise<any> {
    return this.transaction(async (client) => {
      // Создаем доску
      const boardResult = await client.query(`
        INSERT INTO boards (name, description, project_id, created_by, color)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        boardData.name,
        boardData.description,
        boardData.project_id,
        boardData.created_by,
        boardData.color || '#3B82F6'
      ]);
      
      const board = boardResult.rows[0];
      
      // Создаем стандартные колонки
      const defaultColumns = [
        { title: 'К выполнению', position: 0, color: '#6B7280' },
        { title: 'В работе', position: 1, color: '#F59E0B' },
        { title: 'На проверке', position: 2, color: '#3B82F6' },
        { title: 'Выполнено', position: 3, color: '#10B981' }
      ];
      
      for (const column of defaultColumns) {
        await client.query(`
          INSERT INTO columns (title, board_id, position, color, created_by)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          column.title,
          board.id,
          column.position,
          column.color,
          boardData.created_by
        ]);
      }
      
      return board;
    });
  }

  async getBoardsByProjectId(projectId: string): Promise<any[]> {
    const result = await this.query(`
      SELECT * FROM boards 
      WHERE project_id = $1 AND is_active = true
      ORDER BY position, created_at
    `, [projectId]);
    
    return result.rows;
  }

  // =====================================================
  // МЕТОДЫ ДЛЯ КОЛОНОК
  // =====================================================

  async getColumnsByBoardId(boardId: string): Promise<any[]> {
    const result = await this.query(`
      SELECT * FROM columns 
      WHERE board_id = $1 AND is_active = true
      ORDER BY position
    `, [boardId]);
    
    return result.rows;
  }

  // =====================================================
  // МЕТОДЫ ДЛЯ ЗАДАЧ
  // =====================================================

  async createTask(taskData: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO tasks (
        title, description, status, priority, project_id, 
        board_id, column_id, assignee_id, reporter_id, position
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      taskData.title,
      taskData.description,
      taskData.status || 'todo',
      taskData.priority || 'medium',
      taskData.project_id,
      taskData.board_id,
      taskData.column_id,
      taskData.assignee_id,
      taskData.reporter_id,
      taskData.position || 0
    ]);
    
    return result.rows[0];
  }

  async getTasksByProjectId(projectId: string, limit?: number, offset?: number): Promise<any[]> {
    let query = `
      SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar,
             c.title as column_title, b.name as board_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN columns c ON t.column_id = c.id
      LEFT JOIN boards b ON t.board_id = b.id
      WHERE t.project_id = $1 AND t.is_active = true
      ORDER BY t.position, t.created_at
    `;
    
    const params = [projectId];
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }
    
    if (offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }
    
    const result = await this.query(query, params);
    return result.rows;
  }

  async getTasksByColumnId(columnId: string): Promise<any[]> {
    const result = await this.query(`
      SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.column_id = $1 AND t.is_active = true
      ORDER BY t.position, t.created_at
    `, [columnId]);
    
    return result.rows;
  }

  // =====================================================
  // МЕТОДЫ ДЛЯ СЕССИЙ
  // =====================================================

  async createSession(sessionData: any): Promise<any> {
    const result = await this.query(`
      INSERT INTO sessions (session_token, user_id, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      sessionData.session_token,
      sessionData.user_id,
      sessionData.expires_at,
      sessionData.ip_address,
      sessionData.user_agent
    ]);
    
    return result.rows[0];
  }

  async getSessionByToken(token: string): Promise<any> {
    const result = await this.query(`
      SELECT s.*, u.id as user_id, u.email, u.name, u.role
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = $1 AND s.expires_at > CURRENT_TIMESTAMP AND s.is_active = true
    `, [token]);
    
    return result.rows[0];
  }

  async deleteSession(token: string): Promise<void> {
    await this.query(
      'UPDATE sessions SET is_active = false WHERE session_token = $1',
      [token]
    );
  }

  // =====================================================
  // УТИЛИТЫ
  // =====================================================

  async close(): Promise<void> {
    await this.pool.end();
  }

  async getStats(): Promise<any> {
    const result = await this.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(*) FROM projects WHERE status = 'active') as total_projects,
        (SELECT COUNT(*) FROM boards WHERE is_active = true) as total_boards,
        (SELECT COUNT(*) FROM tasks WHERE is_active = true) as total_tasks
    `);
    
    return result.rows[0];
  }
}
```

### 2.5 Обновление основного адаптера

```javascript
// src/lib/database-adapter.ts
import { PostgreSQLAdapter } from './postgresql-adapter';

class DatabaseAdapter {
  private static instance: DatabaseAdapter;
  private adapter: PostgreSQLAdapter;
  private isInitialized: boolean = false;

  private constructor() {
    // Инициализируем только PostgreSQL адаптер
    this.adapter = new PostgreSQLAdapter({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'encore_tasks',
      user: process.env.POSTGRES_USER || 'encore_user',
      password: process.env.POSTGRES_PASSWORD || '',
      ssl: process.env.POSTGRES_SSL === 'true',
      max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20')
    });
  }

  static getInstance(): DatabaseAdapter {
    if (!DatabaseAdapter.instance) {
      DatabaseAdapter.instance = new DatabaseAdapter();
    }
    return DatabaseAdapter.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    await this.adapter.initialize();
    this.isInitialized = true;
    console.log('✅ DatabaseAdapter инициализирован с PostgreSQL');
  }

  getDatabaseType(): string {
    return 'postgresql';
  }

  isConnected(): boolean {
    return this.isInitialized;
  }

  // Проксируем все методы к PostgreSQL адаптеру
  async createUser(userData: any) {
    return this.adapter.createUser(userData);
  }

  async getUserByEmail(email: string) {
    return this.adapter.getUserByEmail(email);
  }

  async getUserById(id: string) {
    return this.adapter.getUserById(id);
  }

  async updateUser(id: string, updates: any) {
    return this.adapter.updateUser(id, updates);
  }

  async createProject(projectData: any) {
    return this.adapter.createProject(projectData);
  }

  async getProjectsByUserId(userId: string) {
    return this.adapter.getProjectsByUserId(userId);
  }

  async getProjectById(id: string) {
    return this.adapter.getProjectById(id);
  }

  async createBoard(boardData: any) {
    return this.adapter.createBoard(boardData);
  }

  async getBoardsByProjectId(projectId: string) {
    return this.adapter.getBoardsByProjectId(projectId);
  }

  async getColumnsByBoardId(boardId: string) {
    return this.adapter.getColumnsByBoardId(boardId);
  }

  async createTask(taskData: any) {
    return this.adapter.createTask(taskData);
  }

  async getTasksByProjectId(projectId: string, limit?: number, offset?: number) {
    return this.adapter.getTasksByProjectId(projectId, limit, offset);
  }

  async getTasksByColumnId(columnId: string) {
    return this.adapter.getTasksByColumnId(columnId);
  }

  async createSession(sessionData: any) {
    return this.adapter.createSession(sessionData);
  }

  async getSessionByToken(token: string) {
    return this.adapter.getSessionByToken(token);
  }

  async deleteSession(token: string) {
    return this.adapter.deleteSession(token);
  }

  async getStats() {
    return this.adapter.getStats();
  }

  async close() {
    return this.adapter.close();
  }
}

export default DatabaseAdapter;
```

## 3. Тестирование и валидация

### 3.1 Скрипт тестирования

```javascript
// scripts/test-postgresql.js
const DatabaseAdapter = require('../src/lib/database-adapter').default;

class PostgreSQLTester {
  constructor() {
    this.adapter = DatabaseAdapter.getInstance();
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Запускаем тесты PostgreSQL...');
    
    try {
      await this.adapter.initialize();
      
      await this.testConnection();
      await this.testUserOperations();
      await this.testProjectOperations();
      await this.testBoardOperations();
      await this.testTaskOperations();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Критическая ошибка тестирования:', error);
    } finally {
      await this.adapter.close();
    }
  }

  async testConnection() {
    try {
      const stats = await this.adapter.getStats();
      this.addResult('Подключение к базе данных', true, `Статистика получена: ${JSON.stringify(stats)}`);
    } catch (error) {
      this.addResult('Подключение к базе данных', false, error.message);
    }
  }

  async testUserOperations() {
    try {
      // Создание пользователя
      const userData = {
        email: `test_${Date.now()}@example.com`,
        password: 'test123',
        name: 'Test User'
      };
      
      const user = await this.adapter.createUser(userData);
      this.addResult('Создание пользователя', !!user.id, `ID: ${user.id}`);
      
      // Получение пользователя по email
      const foundUser = await this.adapter.getUserByEmail(userData.email);
      this.addResult('Поиск пользователя по email', !!foundUser, `Найден: ${foundUser?.name}`);
      
      // Обновление пользователя
      const updatedUser = await this.adapter.updateUser(user.id, { name: 'Updated Test User' });
      this.addResult('Обновление пользователя', updatedUser.name === 'Updated Test User', `Новое имя: ${updatedUser.name}`);
      
    } catch (error) {
      this.addResult('Операции с пользователями', false, error.message);
    }
  }

  async testProjectOperations() {
    try {
      // Создаем тестового пользователя для проекта
      const user = await this.adapter.createUser({
        email: `project_owner_${Date.now()}@example.com`,
        password: 'test123',
        name: 'Project Owner'
      });
      
      // Создание проекта
      const projectData = {
        name: `Test Project ${Date.now()}`,
        description: 'Test project description',
        owner_id: user.id
      };
      
      const project = await this.adapter.createProject(projectData);
      this.addResult('Создание проекта', !!project.id, `ID: ${project.id}`);
      
      // Получение проектов пользователя
      const projects = await this.adapter.getProjectsByUserId(user.id);
      this.addResult('Получение проектов пользователя', projects.length > 0, `Найдено проектов: ${projects.length}`);
      
    } catch (error) {
      this.addResult('Операции с проектами', false, error.message);
    }
  }

  async testBoardOperations() {
    try {
      // Создаем пользователя и проект для доски
      const user = await this.adapter.createUser({
        email: `board_creator_${Date.now()}@example.com`,
        password: 'test123',
        name: 'Board Creator'
      });
      
      const project = await this.adapter.createProject({
        name: `Board Test Project ${Date.now()}`,
        owner_id: user.id
      });
      
      // Создание доски
      const boardData = {
        name: `Test Board ${Date.now()}`,
        description: 'Test board description',
        project_id: project.id,
        created_by: user.id
      };
      
      const board = await this.adapter.createBoard(boardData);
      this.addResult('Создание доски', !!board.id, `ID: ${board.id}`);
      
      // Получение досок проекта
      const boards = await this.adapter.getBoardsByProjectId(project.id);
      this.addResult('Получение досок проекта', boards.length > 0, `Найдено досок: ${boards.length}`);
      
      // Получение колонок доски
      const columns = await this.adapter.getColumnsByBoardId(board.id);
      this.addResult('Получение колонок доски', columns.length >= 4, `Найдено колонок: ${columns.length}`);
      
    } catch (error) {
      this.addResult('Операции с досками', false, error.message);
    }
  }

  async testTaskOperations() {
    try {
      // Создаем полную структуру для задачи
      const user = await this.adapter.createUser({
        email: `task_creator_${Date.now()}@example.com`,
        password: 'test123',
        name: 'Task Creator'
      });
      
      const project = await this.adapter.createProject({
        name: `Task Test Project ${Date.now()}`,
        owner_id: user.id
      });
      
      const board = await this.adapter.createBoard({
        name: `Task Test Board ${Date.now()}`,
        project_id: project.id,
        created_by: user.id
      });
      
      const columns = await this.adapter.getColumnsByBoardId(board.id);
      const firstColumn = columns[0];
      
      // Создание задачи
      const taskData = {
        title: `Test Task ${Date.now()}`,
        description: 'Test task description',
        project_id: project.id,
        board_id: board.id,
        column_id: firstColumn.id,
        reporter_id: user.id
      };
      
      const task = await this.adapter.createTask(taskData);
      this.addResult('Создание задачи', !!task.id, `ID: ${task.id}`);
      
      // Получение задач проекта
      const tasks = await this.adapter.getTasksByProjectId(project.id);
      this.addResult('Получение задач проекта', tasks.length > 0, `Найдено задач: ${tasks.length}`);
      
      // Получение задач колонки
      const columnTasks = await this.adapter.getTasksByColumnId(firstColumn.id);
      this.addResult('Получение задач колонки', columnTasks.length > 0, `Найдено задач в колонке: ${columnTasks.length}`);
      
    } catch (error) {
      this.addResult('Операции с задачами', false, error.message);
    }
  }

  addResult(testName, success, details) {
    this.testResults.push({ testName, success, details });
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  printResults() {
    console.log('\n📊 Результаты тестирования:');
    console.log('=' .repeat(50));
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    
    console.log(`Пройдено тестов: ${passed}/${total}`);
    console.log(`Процент успеха: ${Math.round((passed / total) * 100)}%`);
    
    if (passed === total) {
      console.log('🎉 Все тесты пройдены успешно!');
    } else {
      console.log('⚠️ Некоторые тесты не прошли. Проверьте детали выше.');
    }
  }
}

// Запуск тестов
if (require.main === module) {
  require('dotenv').config();
  
  const tester = new PostgreSQLTester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🏁 Тестирование завершено');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Критическая ошибка:', error);
      process.exit(1);
    });
}

module.exports = PostgreSQLTester;
```

## 4. Команды для выполнения

### 4.1 Последовательность команд

```bash
# 1. Установка зависимостей PostgreSQL
npm install pg @types/pg
npm uninstall sqlite3 @types/sqlite3 @supabase/supabase-js

# 2. Создание схемы базы данных
node scripts/create-schema.js

# 3. Миграция данных (если есть SQLite база)
node scripts/migrate-data.js ./database.db

# 4. Тестирование функциональности
node scripts/test-postgresql.js

# 5. Очистка проекта
powershell -ExecutionPolicy Bypass -File cleanup-project.ps1

# 6. Запуск приложения
npm run dev
```

### 4.2 Проверка результатов

```bash
# Проверка подключения к PostgreSQL
psql -h localhost -U encore_user -d encore_tasks -c "\dt"

# Проверка данных
psql -h localhost -U encore_user -d encore_tasks -c "SELECT COUNT(*) FROM users;"
psql -h localhost -U encore_user -d encore_tasks -c "SELECT COUNT(*) FROM projects;"
psql -h localhost -U encore_user -d encore_tasks -c "SELECT COUNT(*) FROM tasks;"

# Проверка индексов
psql -h localhost -U encore_user -d encore_tasks -c "\di"
```

## 5. Заключение

После выполнения всех этапов:

- ✅ **Создана единая PostgreSQL база данных**
- ✅ **Мигрированы все данные из SQLite**
- ✅ **Обновлены все адаптеры и API**
- ✅ **Протестирована функциональность**
- ✅ **Очищен проект от временных файлов**
- ✅ **Готова к развертыванию на VDS**

Система готова к production использованию с монолитной PostgreSQL архитектурой.

---

**Версия документа**: 1.0  
**Дата создания**: $(date)  
**Автор**: SOLO Document  
**Статус**: Руководство к выполнению