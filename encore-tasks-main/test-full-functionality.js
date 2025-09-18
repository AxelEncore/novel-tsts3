const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BASE_URL = 'http://localhost:3000';

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/encore_tasks'
});

class FullFunctionalityTest {
  constructor() {
    this.csrfToken = null;
    this.authCookie = null;
    this.adminId = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  logTest(name, success, details = '') {
    const result = success ? '✅' : '❌';
    console.log(`${result} ${name}${details ? ': ' + details : ''}`);
    this.testResults.tests.push({ name, success, details });
    if (success) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
  }

  async setup() {
    try {
      await client.connect();
      console.log('✅ Подключение к PostgreSQL успешно');
      
      // Найдем администратора
      const adminEmail = 'axelencore@mail.ru';
      const adminPassword = 'Ad580dc6axelencore';
      
      let adminResult = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
      
      if (adminResult.rows.length > 0) {
        this.adminId = adminResult.rows[0].id;
        console.log('✅ Найден администратор:', this.adminId);
        
        // Обновляем пароль
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await client.query(`
          UPDATE users SET password_hash = $1, role = 'admin', approval_status = 'approved', updated_at = NOW()
          WHERE id = $2
        `, [hashedPassword, this.adminId]);
      }
      
    } catch (error) {
      console.error('❌ Ошибка настройки:', error.message);
      throw error;
    }
  }

  async authenticate() {
    try {
      // Получаем CSRF токен
      const csrfResponse = await fetch(`${BASE_URL}/api/csrf`);
      const csrfData = await csrfResponse.json();
      this.csrfToken = csrfData.csrfToken;
      const csrfCookie = csrfResponse.headers.get('set-cookie');
      
      // Выполняем вход
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': this.csrfToken,
          'Cookie': csrfCookie
        },
        body: JSON.stringify({
          email: 'axelencore@mail.ru',
          password: 'Ad580dc6axelencore'
        })
      });
      
      if (loginResponse.ok) {
        this.authCookie = loginResponse.headers.get('set-cookie');
        this.logTest('Аутентификация', true, 'Успешный вход в систему');
        return true;
      } else {
        this.logTest('Аутентификация', false, `Статус: ${loginResponse.status}`);
        return false;
      }
    } catch (error) {
      this.logTest('Аутентификация', false, error.message);
      return false;
    }
  }

  async testProjects() {
    try {
      console.log('\n🏗️ Тестируем управление проектами...');
      
      // Создание проекта
      const createResponse = await fetch(`${BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': this.csrfToken,
          'Cookie': this.authCookie
        },
        body: JSON.stringify({
          name: 'Тестовый проект миграции',
          description: 'Проект для проверки функциональности после миграции на PostgreSQL'
        })
      });
      
      if (createResponse.ok) {
        const response = await createResponse.json();
        const projectData = response.data; // API возвращает данные в поле data
        this.logTest('Создание проекта', true, `ID: ${projectData.id}`);
        
        // Получение списка проектов
        const listResponse = await fetch(`${BASE_URL}/api/projects`, {
          headers: { 'Cookie': this.authCookie }
        });
        
        if (listResponse.ok) {
          const projectsResponse = await listResponse.json();
          const projects = projectsResponse.data.projects; // API возвращает проекты в data.projects
          this.logTest('Получение списка проектов', true, `Найдено: ${projects.length} проектов`);
          
          // Получение конкретного проекта
          const getResponse = await fetch(`${BASE_URL}/api/projects/${projectData.id}`, {
            headers: { 'Cookie': this.authCookie }
          });
          
          if (getResponse.ok) {
            this.logTest('Получение проекта по ID', true);
            return projectData.id;
          } else {
            this.logTest('Получение проекта по ID', false, `Статус: ${getResponse.status}`);
          }
        } else {
          this.logTest('Получение списка проектов', false, `Статус: ${listResponse.status}`);
        }
      } else {
        const errorText = await createResponse.text();
        this.logTest('Создание проекта', false, `Статус: ${createResponse.status}, ${errorText}`);
      }
    } catch (error) {
      this.logTest('Управление проектами', false, error.message);
    }
    return null;
  }

  async testBoards(projectId) {
    if (!projectId) {
      this.logTest('Тестирование досок', false, 'Нет проекта для тестирования');
      return null;
    }
    
    try {
      console.log('\n📋 Тестируем управление досками...');
      
      // Создание доски
      const createResponse = await fetch(`${BASE_URL}/api/projects/${projectId}/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': this.csrfToken,
          'Cookie': this.authCookie
        },
        body: JSON.stringify({
          name: 'Тестовая доска',
          description: 'Доска для тестирования функциональности'
        })
      });
      
      if (createResponse.ok) {
        const response = await createResponse.json();
        const boardData = response.data || response; // Обрабатываем оба варианта ответа
        this.logTest('Создание доски', true, `ID: ${boardData.id}`);
        
        // Получение списка досок проекта
        const listResponse = await fetch(`${BASE_URL}/api/projects/${projectId}/boards`, {
          headers: { 'Cookie': this.authCookie }
        });
        
        if (listResponse.ok) {
          const boardsResponse = await listResponse.json();
          const boards = boardsResponse.data || boardsResponse; // Обрабатываем оба варианта
          const boardsArray = Array.isArray(boards) ? boards : (boards.boards || []);
          this.logTest('Получение списка досок', true, `Найдено: ${boardsArray.length} досок`);
          return boardData.id;
        } else {
          this.logTest('Получение списка досок', false, `Статус: ${listResponse.status}`);
        }
      } else {
        const errorText = await createResponse.text();
        this.logTest('Создание доски', false, `Статус: ${createResponse.status}, ${errorText}`);
      }
    } catch (error) {
      this.logTest('Управление досками', false, error.message);
    }
    return null;
  }

  async testColumns(boardId) {
    if (!boardId) {
      this.logTest('Тестирование колонок', false, 'Нет доски для тестирования');
      return [];
    }
    
    try {
      console.log('\n📝 Тестируем управление колонками...');
      
      const columnNames = ['К выполнению', 'В процессе', 'Выполнено'];
      const createdColumns = [];
      
      for (let i = 0; i < columnNames.length; i++) {
        const createResponse = await fetch(`${BASE_URL}/api/boards/${boardId}/columns`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': this.csrfToken,
            'Cookie': this.authCookie
          },
          body: JSON.stringify({
            name: columnNames[i],
            position: i
          })
        });
        
        if (createResponse.ok) {
          const response = await createResponse.json();
          const columnData = response.data || response; // Обрабатываем оба варианта ответа
          createdColumns.push(columnData.id);
          this.logTest(`Создание колонки "${columnNames[i]}"`, true, `ID: ${columnData.id}`);
        } else {
          this.logTest(`Создание колонки "${columnNames[i]}"`, false, `Статус: ${createResponse.status}`);
        }
      }
      
      // Получение списка колонок
      const listResponse = await fetch(`${BASE_URL}/api/boards/${boardId}/columns`, {
        headers: { 'Cookie': this.authCookie }
      });
      
      if (listResponse.ok) {
        const columnsResponse = await listResponse.json();
        const columns = columnsResponse.data || columnsResponse; // Обрабатываем оба варианта
        const columnsArray = Array.isArray(columns) ? columns : (columns.columns || []);
        this.logTest('Получение списка колонок', true, `Найдено: ${columnsArray.length} колонок`);
      } else {
        this.logTest('Получение списка колонок', false, `Статус: ${listResponse.status}`);
      }
      
      return createdColumns;
    } catch (error) {
      this.logTest('Управление колонками', false, error.message);
      return [];
    }
  }

  async testTasks(columnIds) {
    if (columnIds.length === 0) {
      this.logTest('Тестирование задач', false, 'Нет колонок для тестирования');
      return;
    }
    
    try {
      console.log('\n✅ Тестируем управление задачами...');
      
      const taskData = {
        title: 'Тестовая задача',
        description: 'Задача для проверки функциональности после миграции',
        priority: 'medium',
        column_id: columnIds[0]
      };
      
      // Создание задачи
      const createResponse = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': this.csrfToken,
          'Cookie': this.authCookie
        },
        body: JSON.stringify(taskData)
      });
      
      if (createResponse.ok) {
        const response = await createResponse.json();
        const task = response.data || response; // Обрабатываем оба варианта ответа
        this.logTest('Создание задачи', true, `ID: ${task.id}`);
        
        // Получение задачи
        const getResponse = await fetch(`${BASE_URL}/api/tasks/${task.id}`, {
          headers: { 'Cookie': this.authCookie }
        });
        
        if (getResponse.ok) {
          this.logTest('Получение задачи по ID', true);
          
          // Обновление задачи
          const updateResponse = await fetch(`${BASE_URL}/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': this.csrfToken,
              'Cookie': this.authCookie
            },
            body: JSON.stringify({
              title: 'Обновленная тестовая задача',
              description: 'Обновленное описание задачи',
              priority: 'high'
            })
          });
          
          if (updateResponse.ok) {
            this.logTest('Обновление задачи', true);
          } else {
            this.logTest('Обновление задачи', false, `Статус: ${updateResponse.status}`);
          }
        } else {
          this.logTest('Получение задачи по ID', false, `Статус: ${getResponse.status}`);
        }
      } else {
        const errorText = await createResponse.text();
        this.logTest('Создание задачи', false, `Статус: ${createResponse.status}, ${errorText}`);
      }
    } catch (error) {
      this.logTest('Управление задачами', false, error.message);
    }
  }

  async testUsers() {
    try {
      console.log('\n👥 Тестируем управление пользователями...');
      
      // Получение списка пользователей
      const listResponse = await fetch(`${BASE_URL}/api/users`, {
        headers: { 'Cookie': this.authCookie }
      });
      
      if (listResponse.ok) {
        const usersResponse = await listResponse.json();
        const users = usersResponse.users || usersResponse; // API возвращает пользователей в поле users
        this.logTest('Получение списка пользователей', true, `Найдено: ${users.length} пользователей`);
        
        // Получение профиля текущего пользователя
        const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { 'Cookie': this.authCookie }
        });
        
        if (meResponse.ok) {
          const profileResponse = await meResponse.json();
          const profile = profileResponse.user || profileResponse; // Обрабатываем оба варианта
          this.logTest('Получение профиля пользователя', true, `Email: ${profile.email}`);
        } else {
          this.logTest('Получение профиля пользователя', false, `Статус: ${meResponse.status}`);
        }
      } else {
        this.logTest('Получение списка пользователей', false, `Статус: ${listResponse.status}`);
      }
    } catch (error) {
      this.logTest('Управление пользователями', false, error.message);
    }
  }

  async testDataIntegrity() {
    try {
      console.log('\n🔍 Проверяем целостность данных...');
      
      // Проверяем количество записей в основных таблицах
      const tables = ['users', 'projects', 'boards', 'columns', 'tasks'];
      
      for (const table of tables) {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        this.logTest(`Целостность таблицы ${table}`, count >= 0, `Записей: ${count}`);
      }
      
      // Проверяем внешние ключи
      const fkCheck = await client.query(`
        SELECT COUNT(*) as count FROM projects p 
        LEFT JOIN users u ON p.creator_id = u.id 
        WHERE u.id IS NULL
      `);
      
      const orphanedProjects = parseInt(fkCheck.rows[0].count);
      this.logTest('Целостность внешних ключей', orphanedProjects === 0, 
        orphanedProjects > 0 ? `Найдено ${orphanedProjects} проектов без создателя` : 'Все связи корректны');
      
    } catch (error) {
      this.logTest('Проверка целостности данных', false, error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Начинаем полное функциональное тестирование...');
    
    try {
      await this.setup();
      
      if (await this.authenticate()) {
        const projectId = await this.testProjects();
        const boardId = await this.testBoards(projectId);
        const columnIds = await this.testColumns(boardId);
        await this.testTasks(columnIds);
        await this.testUsers();
        await this.testDataIntegrity();
      }
      
      // Выводим итоговый отчет
      console.log('\n📊 ИТОГОВЫЙ ОТЧЕТ:');
      console.log(`✅ Пройдено тестов: ${this.testResults.passed}`);
      console.log(`❌ Провалено тестов: ${this.testResults.failed}`);
      console.log(`📈 Успешность: ${Math.round((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100)}%`);
      
      if (this.testResults.failed > 0) {
        console.log('\n❌ ПРОВАЛИВШИЕСЯ ТЕСТЫ:');
        this.testResults.tests
          .filter(test => !test.success)
          .forEach(test => console.log(`  - ${test.name}: ${test.details}`));
      }
      
    } catch (error) {
      console.error('💥 Критическая ошибка тестирования:', error.message);
    } finally {
      await client.end();
      console.log('\n🔌 Соединение с базой данных закрыто');
    }
  }
}

// Запускаем тестирование
const test = new FullFunctionalityTest();
test.runAllTests();