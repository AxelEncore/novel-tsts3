const fetch = require('node-fetch');

// Простая проверка подключения к API
async function testAPIConnection() {
  console.log('🔍 Проверка подключения к API...');
  
  try {
    // Проверяем базовое подключение
    console.log('\n1. Проверка базового подключения к серверу...');
    const healthResponse = await fetch('http://localhost:3000', {
      method: 'GET'
    });
    
    console.log('Статус ответа сервера:', healthResponse.status);
    console.log('Заголовки ответа:', Object.fromEntries(healthResponse.headers.entries()));
    
    if (healthResponse.ok) {
      console.log('✅ Сервер доступен');
    } else {
      console.log('❌ Сервер недоступен');
      return;
    }
    
    // Проверяем API auth/me без токена
    console.log('\n2. Проверка API /auth/me без токена...');
    const meResponse = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Статус /auth/me:', meResponse.status);
    const meText = await meResponse.text();
    console.log('Ответ /auth/me:', meText);
    
    // Проверяем API login с неправильными данными
    console.log('\n3. Проверка API /auth/login с неправильными данными...');
    const badLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      })
    });
    
    console.log('Статус неправильного логина:', badLoginResponse.status);
    const badLoginText = await badLoginResponse.text();
    console.log('Ответ неправильного логина:', badLoginText);
    
    // Проверяем API login с правильными данными
    console.log('\n4. Проверка API /auth/login с правильными данными...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@encore-tasks.com',
        password: 'admin123'
      })
    });
    
    console.log('Статус правильного логина:', loginResponse.status);
    const loginText = await loginResponse.text();
    console.log('Ответ правильного логина:', loginText.substring(0, 500) + (loginText.length > 500 ? '...' : ''));
    
    if (loginResponse.ok) {
      try {
        const loginData = JSON.parse(loginText);
        if (loginData.token) {
          console.log('✅ Токен получен:', loginData.token.substring(0, 20) + '...');
          
          // Проверяем API с токеном
          console.log('\n5. Проверка API /auth/me с токеном...');
          const authMeResponse = await fetch('http://localhost:3000/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginData.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Статус /auth/me с токеном:', authMeResponse.status);
          const authMeText = await authMeResponse.text();
          console.log('Ответ /auth/me с токеном:', authMeText);
          
          // Проверяем API проектов
          console.log('\n6. Проверка API /projects...');
          const projectsResponse = await fetch('http://localhost:3000/api/projects', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${loginData.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Статус /projects:', projectsResponse.status);
          const projectsText = await projectsResponse.text();
          console.log('Ответ /projects:', projectsText.substring(0, 500) + (projectsText.length > 500 ? '...' : ''));
        }
      } catch (parseError) {
        console.log('❌ Ошибка парсинга ответа логина:', parseError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message);
    console.error('Стек ошибки:', error.stack);
  }
}

// Запуск тестов
if (require.main === module) {
  testAPIConnection();
}

module.exports = { testAPIConnection };