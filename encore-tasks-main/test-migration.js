const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

// Конфигурация
const DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/encore_tasks';
const JWT_SECRET = 'your-jwt-secret-key-development';
const API_BASE = 'http://localhost:3000/api';

// Данные для тестирования
const TEST_USER = {
  id: 'a18e90af-3374-464a-a020-d0492838eb45',
  email: 'axelencore@mail.ru',
  role: 'admin',
  name: 'Admin User'
};

class MigrationTester {
  constructor() {
    this.client = new Client({ connectionString: DATABASE_URL });
    this.token = null;
    this.testResults = [];
  }

  async connect() {
    await this.client.connect();
    console.log('✅ Подключение к базе данных установлено');
  }

  async disconnect() {
    await this.client.end();
    console.log('✅ Соединение с базой данных закрыто');
  }

  generateToken() {
    this.token = jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ JWT токен сгенерирован');
  }

  async createSession() {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
    
    // Сначала удаляем существующие сессии пользователя
    await this.client.query('DELETE FROM sessions WHERE user_id = $1', [TEST_USER.id]);
    
    // Затем создаем новую сессию с JWT токеном
    const query = `
      INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `;
    
    await this.client.query(query, [sessionId, TEST_USER.id, this.token, expiresAt]);
    console.log('✅ Сессия создана с JWT токеном');
  }

  async testDatabaseConnection() {
    try {
      const result = await this.client.query('SELECT NOW()');
      this.addResult('Database Connection', true, 'Подключение успешно');
      return true;
    } catch (error) {
      this.addResult('Database Connection', false, error.message);
      return false;
    }
  }

  async testDataIntegrity() {
    try {
      // Проверяем наличие основных таблиц
      const tables = ['users', 'projects', 'boards', 'columns', 'tasks', 'sessions'];
      for (const table of tables) {
        const result = await this.client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`📊 Таблица ${table}: ${result.rows[0].count} записей`);
      }
      
      // Проверяем пользователей
      const users = await this.client.query('SELECT id, email, role FROM users');
      console.log(`👥 Пользователи: ${users.rows.length}`);
      users.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
      
      this.addResult('Data Integrity', true, 'Все таблицы доступны, данные сохранены');
      return true;
    } catch (error) {
      this.addResult('Data Integrity', false, error.message);
      return false;
    }
  }

  async apiRequest(method, endpoint, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    return { status: response.status, data: result };
  }

  async testProjectManagement() {
    try {
      // Создание проекта
      const projectData = {
        name: 'Test Project ' + Date.now(),
        description: 'Тестовый проект для проверки миграции'
      };
      
      const createResponse = await this.apiRequest('POST', '/projects', projectData);
      
      if (createResponse.status === 201 && createResponse.data.success) {
        const projectId = createResponse.data.data.id;
        console.log(`✅ Проект создан: ${projectId}`);
        
        // Получение списка проектов
        const listResponse = await this.apiRequest('GET', '/projects');
        if (listResponse.status === 200) {
          console.log(`✅ Получен список проектов: ${listResponse.data.data.length} проектов`);
        }
        
        this.addResult('Project Management', true, 'Создание и получение проектов работает');
        return projectId;
      } else {
        throw new Error(`Ошибка создания проекта: ${JSON.stringify(createResponse.data)}`);
      }
    } catch (error) {
      this.addResult('Project Management', false, error.message);
      return null;
    }
  }

  async testBoardManagement(projectId) {
    if (!projectId) {
      this.addResult('Board Management', false, 'Нет проекта для тестирования');
      return null;
    }
    
    try {
      // Создание доски
      const boardData = {
        name: 'Test Board ' + Date.now(),
        description: 'Тестовая доска для проверки миграции',
        project_id: projectId
      };
      
      const createResponse = await this.apiRequest('POST', '/boards', boardData);
      
      if (createResponse.status === 201 && createResponse.data.success) {
        const boardId = createResponse.data.data.id;
        console.log(`✅ Доска создана: ${boardId}`);
        
        // Получение досок проекта
        const listResponse = await this.apiRequest('GET', `/projects/${projectId}/boards`);
        if (listResponse.status === 200) {
          console.log(`✅ Получен список досок: ${listResponse.data.data.length} досок`);
        }
        
        this.addResult('Board Management', true, 'Создание и получение досок работает');
        return boardId;
      } else {
        throw new Error(`Ошибка создания доски: ${JSON.stringify(createResponse.data)}`);
      }
    } catch (error) {
      this.addResult('Board Management', false, error.message);
      return null;
    }
  }

  async testColumnManagement(boardId) {
    if (!boardId) {
      this.addResult('Column Management', false, 'Нет доски для тестирования');
      return null;
    }
    
    try {
      // Создание колонки
      const columnData = {
        name: 'Test Column ' + Date.now(),
        board_id: boardId,
        position: 1
      };
      
      const createResponse = await this.apiRequest('POST', '/columns', columnData);
      
      if (createResponse.status === 201 && createResponse.data.success) {
        const columnId = createResponse.data.data.id;
        console.log(`✅ Колонка создана: ${columnId}`);
        
        this.addResult('Column Management', true, 'Создание колонок работает');
        return columnId;
      } else {
        throw new Error(`Ошибка создания колонки: ${JSON.stringify(createResponse.data)}`);
      }
    } catch (error) {
      this.addResult('Column Management', false, error.message);
      return null;
    }
  }

  async testTaskManagement(columnId) {
    if (!columnId) {
      this.addResult('Task Management', false, 'Нет колонки для тестирования');
      return null;
    }
    
    try {
      // Создание задачи
      const taskData = {
        title: 'Test Task ' + Date.now(),
        description: 'Тестовая задача для проверки миграции',
        column_id: columnId,
        position: 1,
        priority: 'medium'
      };
      
      const createResponse = await this.apiRequest('POST', '/tasks', taskData);
      
      if (createResponse.status === 201 && createResponse.data.success) {
        const taskId = createResponse.data.data.id;
        console.log(`✅ Задача создана: ${taskId}`);
        
        this.addResult('Task Management', true, 'Создание задач работает');
        return taskId;
      } else {
        throw new Error(`Ошибка создания задачи: ${JSON.stringify(createResponse.data)}`);
      }
    } catch (error) {
      this.addResult('Task Management', false, error.message);
      return null;
    }
  }

  async testUserManagement() {
    try {
      // Получение списка пользователей
      const listResponse = await this.apiRequest('GET', '/users');
      
      if (listResponse.status === 200) {
        console.log(`✅ Получен список пользователей: ${listResponse.data.data.length} пользователей`);
        this.addResult('User Management', true, 'Получение пользователей работает');
        return true;
      } else {
        throw new Error(`Ошибка получения пользователей: ${JSON.stringify(listResponse.data)}`);
      }
    } catch (error) {
      this.addResult('User Management', false, error.message);
      return false;
    }
  }

  addResult(test, success, message) {
    this.testResults.push({ test, success, message, timestamp: new Date() });
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ МИГРАЦИИ');
    console.log('='.repeat(60));
    
    let passed = 0;
    let failed = 0;
    
    this.testResults.forEach(result => {
      const status = result.success ? '✅ ПРОЙДЕН' : '❌ ПРОВАЛЕН';
      console.log(`${status} ${result.test}: ${result.message}`);
      
      if (result.success) passed++;
      else failed++;
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log(`📊 ИТОГО: ${passed} пройдено, ${failed} провалено`);
    
    if (failed === 0) {
      console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Миграция на PostgreSQL прошла успешно.');
    } else {
      console.log('⚠️  ЕСТЬ ПРОБЛЕМЫ! Требуется дополнительная проверка.');
    }
    
    console.log('='.repeat(60));
  }

  async runAllTests() {
    console.log('🚀 Запуск комплексного тестирования после миграции на PostgreSQL\n');
    
    try {
      await this.connect();
      this.generateToken();
      await this.createSession();
      
      // Тестирование базы данных
      await this.testDatabaseConnection();
      await this.testDataIntegrity();
      
      // Тестирование API
      const projectId = await this.testProjectManagement();
      const boardId = await this.testBoardManagement(projectId);
      const columnId = await this.testColumnManagement(boardId);
      const taskId = await this.testTaskManagement(columnId);
      
      await this.testUserManagement();
      
    } catch (error) {
      console.error('❌ Критическая ошибка:', error.message);
      this.addResult('Critical Error', false, error.message);
    } finally {
      await this.disconnect();
      this.printResults();
    }
  }
}

// Запуск тестирования
if (require.main === module) {
  const tester = new MigrationTester();
  tester.runAllTests().catch(console.error);
}

module.exports = MigrationTester;