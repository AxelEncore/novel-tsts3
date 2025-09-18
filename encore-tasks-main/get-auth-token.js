const fetch = require('node-fetch');

async function getAuthToken() {
  try {
    console.log('Авторизуемся для получения токена...');
    
    const loginData = {
      email: 'admin@example.com',
      password: 'admin123'
    };
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('Статус ответа:', response.status);
    
    const data = await response.json();
    console.log('Статус ответа:', response.status);
    console.log('Тело ответа:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.token) {
      console.log('✅ Успешная авторизация!');
      console.log('Токен:', data.token);
      return data.token;
    } else {
      console.log('❌ Ошибка авторизации:', data.message || 'Неизвестная ошибка');
      return null;
    }
    
  } catch (error) {
    console.error('❌ ОШИБКА при получении токена:', error.message);
    console.error('Полная ошибка:', error);
    return null;
  }
}

getAuthToken();