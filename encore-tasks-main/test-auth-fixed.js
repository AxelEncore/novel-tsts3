const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Конфигурация базы данных
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/encore_tasks'
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const API_BASE = 'http://localhost:3000/api';

async function testAuthenticationFlow() {
  console.log('🔧 Начинаем тестирование аутентификации...');
  
  try {
    // Подключение к базе данных
    await client.connect();
    console.log('✅ Подключение к PostgreSQL успешно');

    // 1. Ищем или создаем тестового администратора
    const adminEmail = 'axelencore@mail.ru';
    const adminPassword = 'Ad580dc6axelencore';
    
    // Проверяем, существует ли администратор
    let adminResult = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    let adminId;
    
    if (adminResult.rows.length > 0) {
      // Используем существующего администратора
      adminId = adminResult.rows[0].id;
      console.log('✅ Найден существующий администратор:', adminId);
      
      // Обновляем пароль если нужно
       const hashedPassword = await bcrypt.hash(adminPassword, 10);
       await client.query(`
         UPDATE users SET password_hash = $1, role = 'admin', approval_status = 'approved', updated_at = NOW()
         WHERE id = $2
       `, [hashedPassword, adminId]);
      console.log('✅ Пароль администратора обновлен');
    } else {
      // Создаем нового администратора
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminId = uuidv4();
      
      await client.query(`
         INSERT INTO users (id, email, password_hash, name, role, approval_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       `, [adminId, adminEmail, hashedPassword, 'Admin User', 'admin', 'approved']);
      
      console.log('✅ Администратор создан:', adminId);
    }

    // 2. Создаем JWT токен
    const jwtPayload = {
      userId: adminId,
      email: adminEmail,
      role: 'admin'
    };
    const jwtToken = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ JWT токен создан');

    // 3. Удаляем старые сессии пользователя
    await client.query('DELETE FROM sessions WHERE user_id = $1', [adminId]);
    
    // 4. Создаем сессию с JWT токеном
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
    
    await client.query(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
    `, [sessionId, adminId, jwtToken, expiresAt]);
    
    console.log('✅ Сессия создана с JWT токеном');

    // 5. Тестируем аутентификацию через API
    console.log('\n🧪 Тестируем API с правильной авторизацией...');
    
    // Тест 1: Проверка /api/auth/me
    const meResponse = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 /api/auth/me статус:', meResponse.status);
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ Пользователь получен:', meData.user?.email);
    } else {
      const errorData = await meResponse.text();
      console.log('❌ Ошибка /api/auth/me:', errorData);
    }

    // Тест 2: Создание проекта
    const projectResponse = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Тестовый проект',
        description: 'Проект для тестирования авторизации'
      })
    });
    
    console.log('📊 /api/projects POST статус:', projectResponse.status);
    if (projectResponse.ok) {
      const projectData = await projectResponse.json();
      console.log('✅ Проект создан:', projectData.project?.id);
      
      // Тест 3: Создание доски
      const boardResponse = await fetch(`${API_BASE}/boards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Тестовая доска',
          description: 'Доска для тестирования',
          project_id: projectData.project.id
        })
      });
      
      console.log('📊 /api/boards POST статус:', boardResponse.status);
      if (boardResponse.ok) {
        const boardData = await boardResponse.json();
        console.log('✅ Доска создана:', boardData.board?.id);
      } else {
        const errorData = await boardResponse.text();
        console.log('❌ Ошибка создания доски:', errorData);
      }
    } else {
      const errorData = await projectResponse.text();
      console.log('❌ Ошибка создания проекта:', errorData);
    }

    // Тест 4: Получение пользователей (админская функция)
    const usersResponse = await fetch(`${API_BASE}/users`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 /api/users GET статус:', usersResponse.status);
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Пользователи получены, количество:', usersData.users?.length || 0);
    } else {
      const errorData = await usersResponse.text();
      console.log('❌ Ошибка получения пользователей:', errorData);
    }

    console.log('\n🎉 Тестирование авторизации завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error);
  } finally {
    await client.end();
    console.log('🔌 Соединение с базой данных закрыто');
  }
}

// Запуск тестирования
testAuthenticationFlow().catch(console.error);