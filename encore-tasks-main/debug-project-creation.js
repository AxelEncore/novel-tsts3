const { Pool } = require('pg');
const fetch = require('node-fetch');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function debugProjectCreation() {
  try {
    console.log('🔌 Подключение к PostgreSQL...');
    
    // Проверяем количество проектов до создания
    console.log('\n📊 Проекты ДО создания:');
    const beforeResult = await pool.query('SELECT id, name, creator_id, created_at FROM projects ORDER BY created_at DESC LIMIT 5');
    console.log(`Всего проектов: ${beforeResult.rows.length}`);
    beforeResult.rows.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (ID: ${project.id}, Creator: ${project.creator_id})`);
    });
    
    // Читаем токен из файла
    const fs = require('fs');
    let authToken = '';
    try {
      authToken = fs.readFileSync('auth-token.txt', 'utf8').trim();
      console.log(`\n🔑 Токен найден, длина: ${authToken.length}`);
    } catch (error) {
      console.log('❌ Токен не найден, выполняем авторизацию...');
      
      // Авторизация
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'axelencore@mail.ru',
          password: 'Ad580dc6axelencore'
        })
      });
      
      console.log(`📥 POST /api/auth/login - Статус: ${loginResponse.status}`);
      const loginData = await loginResponse.json();
      console.log('📝 Ответ авторизации:', JSON.stringify(loginData, null, 2));
      
      if (loginData.token) {
        authToken = loginData.token;
        fs.writeFileSync('auth-token.txt', authToken);
        console.log('✅ Авторизация успешна');
      } else {
        throw new Error(`Ошибка авторизации: ${JSON.stringify(loginData)}`);
      }
    }
    
    // Создаем проект через API
    console.log('\n➕ Создание проекта через API...');
    const createResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: `Debug Test Project ${Date.now()}`,
        description: 'Проект для отладки создания'
      })
    });
    
    console.log(`📥 POST /api/projects - Статус: ${createResponse.status}`);
    const createData = await createResponse.json();
    console.log('📝 Ответ API:', JSON.stringify(createData, null, 2));
    
    // Проверяем количество проектов после создания
    console.log('\n📊 Проекты ПОСЛЕ создания через API:');
    const afterApiResult = await pool.query('SELECT id, name, creator_id, created_at FROM projects ORDER BY created_at DESC LIMIT 5');
    console.log(`Всего проектов: ${afterApiResult.rows.length}`);
    afterApiResult.rows.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (ID: ${project.id}, Creator: ${project.creator_id})`);
    });
    
    // Получаем проекты через API
    console.log('\n📋 Получение проектов через API...');
    const getResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log(`📥 GET /api/projects - Статус: ${getResponse.status}`);
    const getData = await getResponse.json();
    console.log('📝 Ответ API:', JSON.stringify(getData, null, 2));
    
    // Проверяем пользователя из токена
    console.log('\n👤 Проверка пользователя из токена...');
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.decode(authToken);
      console.log('🔍 Данные из токена:', JSON.stringify(decoded, null, 2));
      
      // Проверяем пользователя в базе
      const userResult = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
      if (userResult.rows.length > 0) {
        console.log('✅ Пользователь найден в базе:', userResult.rows[0]);
      } else {
        console.log('❌ Пользователь НЕ найден в базе!');
      }
    } catch (error) {
      console.log('❌ Ошибка декодирования токена:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
    console.log('\n🔌 Соединение закрыто');
  }
}

debugProjectCreation();