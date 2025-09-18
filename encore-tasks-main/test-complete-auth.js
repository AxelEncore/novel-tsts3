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

class CompleteAuthTest {
  constructor() {
    this.csrfToken = null;
    this.authCookie = null;
    this.adminId = null;
  }

  async setup() {
    try {
      await client.connect();
      console.log('✅ Подключение к PostgreSQL успешно');
      
      // Найдем или создадим администратора
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
        console.log('✅ Пароль администратора обновлен');
      } else {
        this.adminId = uuidv4();
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await client.query(`
          INSERT INTO users (id, email, password_hash, name, role, approval_status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [this.adminId, adminEmail, hashedPassword, 'Admin User', 'admin', 'approved']);
        console.log('✅ Администратор создан:', this.adminId);
      }
      
    } catch (error) {
      console.error('❌ Ошибка настройки:', error.message);
      throw error;
    }
  }

  async getCSRFToken() {
    try {
      console.log('\n🔒 Получаем CSRF токен...');
      const response = await fetch(`${BASE_URL}/api/csrf`);
      
      if (!response.ok) {
        throw new Error(`CSRF request failed: ${response.status}`);
      }
      
      const data = await response.json();
      this.csrfToken = data.csrfToken;
      
      // Извлекаем cookie из ответа
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        console.log('✅ CSRF токен получен:', this.csrfToken.substring(0, 10) + '...');
        console.log('✅ CSRF cookie установлен');
        return setCookieHeader;
      } else {
        throw new Error('CSRF cookie не установлен');
      }
    } catch (error) {
      console.error('❌ Ошибка получения CSRF токена:', error.message);
      throw error;
    }
  }

  async login() {
    try {
      console.log('\n🔐 Выполняем вход через API...');
      
      const csrfCookie = await this.getCSRFToken();
      
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
      
      console.log('📊 Login статус:', loginResponse.status);
      
      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.log('❌ Ошибка входа:', errorText);
        throw new Error(`Login failed: ${loginResponse.status}`);
      }
      
      const loginData = await loginResponse.json();
      console.log('✅ Успешный вход:', loginData.user?.email);
      
      // Извлекаем auth cookie
      const authCookieHeader = loginResponse.headers.get('set-cookie');
      if (authCookieHeader) {
        this.authCookie = authCookieHeader;
        console.log('✅ Auth cookie получен');
      }
      
      return loginData;
    } catch (error) {
      console.error('❌ Ошибка входа:', error.message);
      throw error;
    }
  }

  async testAuthenticatedAPI() {
    try {
      console.log('\n🧪 Тестируем аутентифицированные API...');
      
      // Тест 1: Проверка профиля
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Cookie': this.authCookie
        }
      });
      
      console.log('📊 /api/auth/me статус:', meResponse.status);
      if (meResponse.ok) {
        const meData = await meResponse.json();
        console.log('✅ Профиль получен:', meData.email);
      } else {
        const errorText = await meResponse.text();
        console.log('❌ Ошибка профиля:', errorText);
      }
      
      // Тест 2: Создание проекта
      const projectResponse = await fetch(`${BASE_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': this.csrfToken,
          'Cookie': this.authCookie
        },
        body: JSON.stringify({
          name: 'Тестовый проект',
          description: 'Проект для тестирования после миграции'
        })
      });
      
      console.log('📊 /api/projects POST статус:', projectResponse.status);
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        console.log('✅ Проект создан:', projectData.name);
        return projectData.id;
      } else {
        const errorText = await projectResponse.text();
        console.log('❌ Ошибка создания проекта:', errorText);
      }
      
      // Тест 3: Получение пользователей
      const usersResponse = await fetch(`${BASE_URL}/api/users`, {
        headers: {
          'Cookie': this.authCookie
        }
      });
      
      console.log('📊 /api/users GET статус:', usersResponse.status);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('✅ Пользователи получены:', usersData.length, 'пользователей');
      } else {
        const errorText = await usersResponse.text();
        console.log('❌ Ошибка получения пользователей:', errorText);
      }
      
    } catch (error) {
      console.error('❌ Ошибка тестирования API:', error.message);
    }
  }

  async cleanup() {
    try {
      await client.end();
      console.log('\n🔌 Соединение с базой данных закрыто');
    } catch (error) {
      console.error('❌ Ошибка закрытия соединения:', error.message);
    }
  }
}

async function runCompleteTest() {
  const test = new CompleteAuthTest();
  
  try {
    console.log('🚀 Начинаем полное тестирование аутентификации...');
    
    await test.setup();
    await test.login();
    await test.testAuthenticatedAPI();
    
    console.log('\n🎉 Тестирование завершено!');
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
  } finally {
    await test.cleanup();
  }
}

runCompleteTest();