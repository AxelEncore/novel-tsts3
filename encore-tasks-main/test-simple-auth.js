const fetch = require('node-fetch');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Конфигурация базы данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function testSimpleAuth() {
  try {
    console.log('=== Простой тест аутентификации ===');
    
    // 1. Получаем существующую сессию из базы данных
    console.log('\n1. Получение существующей сессии:');
    const sessionResult = await pool.query(
      `SELECT s.token, s.user_id, u.email, u.role 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.expires_at > NOW() 
       ORDER BY s.created_at DESC 
       LIMIT 1`
    );
    
    if (sessionResult.rows.length === 0) {
      console.log('❌ Не найдено активных сессий');
      return;
    }
    
    const session = sessionResult.rows[0];
    console.log('Найдена активная сессия:', {
      user_id: session.user_id,
      email: session.email,
      role: session.role,
      token_preview: session.token.substring(0, 30) + '...'
    });
    
    // 2. Получаем проект
    console.log('\n2. Получение проекта:');
    const projectResult = await pool.query('SELECT id, name FROM projects LIMIT 1');
    
    if (projectResult.rows.length === 0) {
      console.log('❌ Не найдено проектов');
      return;
    }
    
    const project = projectResult.rows[0];
    console.log('Используется проект:', project);
    
    // 3. Тестируем разные способы передачи токена
    const boardData = {
      name: 'Test Auth Board',
      description: 'Тест аутентификации',
      color: '#9C27B0'
    };
    
    const apiUrl = `http://localhost:3000/api/projects/${project.id}/boards`;
    
    // Тест 1: Только Authorization header
    console.log('\n3.1. Тест с Authorization header:');
    const response1 = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify(boardData)
    });
    
    console.log('Статус:', response1.status);
    const text1 = await response1.text();
    console.log('Ответ:', text1);
    
    // Тест 2: Только Cookie auth-token
    console.log('\n3.2. Тест с Cookie auth-token:');
    const response2 = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${session.token}`
      },
      body: JSON.stringify({...boardData, name: 'Test Auth Board 2'})
    });
    
    console.log('Статус:', response2.status);
    const text2 = await response2.text();
    console.log('Ответ:', text2);
    
    // Тест 3: Cookie auth-token-client
    console.log('\n3.3. Тест с Cookie auth-token-client:');
    const response3 = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token-client=${session.token}`
      },
      body: JSON.stringify({...boardData, name: 'Test Auth Board 3'})
    });
    
    console.log('Статус:', response3.status);
    const text3 = await response3.text();
    console.log('Ответ:', text3);
    
    // Тест 4: И Authorization header, и Cookie
    console.log('\n3.4. Тест с Authorization header + Cookie:');
    const response4 = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`,
        'Cookie': `auth-token=${session.token}`
      },
      body: JSON.stringify({...boardData, name: 'Test Auth Board 4'})
    });
    
    console.log('Статус:', response4.status);
    const text4 = await response4.text();
    console.log('Ответ:', text4);
    
    // 4. Проверяем результат
    console.log('\n4. Результаты тестирования:');
    const results = [
      { method: 'Authorization header', status: response1.status, success: response1.status === 200 },
      { method: 'Cookie auth-token', status: response2.status, success: response2.status === 200 },
      { method: 'Cookie auth-token-client', status: response3.status, success: response3.status === 200 },
      { method: 'Authorization + Cookie', status: response4.status, success: response4.status === 200 }
    ];
    
    console.table(results);
    
    const successfulMethods = results.filter(r => r.success);
    if (successfulMethods.length > 0) {
      console.log('✅ Успешные методы аутентификации:', successfulMethods.map(r => r.method));
    } else {
      console.log('❌ Ни один метод аутентификации не сработал');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await pool.end();
  }
}

testSimpleAuth();