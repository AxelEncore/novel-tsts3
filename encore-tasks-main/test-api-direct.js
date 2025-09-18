const axios = require('axios');

(async () => {
  console.log('🚀 Прямое тестирование API...');
  
  const baseURL = 'http://localhost:3000';
  
  try {
    // 1. Проверка CSRF токена
    console.log('🔐 Получение CSRF токена...');
    const csrfResponse = await axios.get(`${baseURL}/api/csrf`);
    console.log('✅ CSRF токен получен:', csrfResponse.status);
    
    const csrfToken = csrfResponse.data.csrfToken;
    
    // 2. Авторизация
    console.log('🔑 Авторизация...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'axelencore@mail.ru',
      password: 'Ad580dc6axelencore'
    }, {
      headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('✅ Авторизация успешна:', loginResponse.status);
    
    // Получаем cookies из ответа
    const cookies = loginResponse.headers['set-cookie'];
    console.log('🍪 Получены cookies:', cookies ? 'Да' : 'Нет');
    
    // 3. Проверка текущего пользователя
    console.log('👤 Проверка текущего пользователя...');
    const userResponse = await axios.get(`${baseURL}/api/auth/me`, {
      headers: {
        'Cookie': cookies ? cookies.join('; ') : ''
      },
      withCredentials: true
    });
    
    console.log('✅ Пользователь получен:', userResponse.status);
    console.log('👤 Данные пользователя:', JSON.stringify(userResponse.data, null, 2));
    
    // 4. Получение проектов
    console.log('📂 Получение списка проектов...');
    const projectsResponse = await axios.get(`${baseURL}/api/projects`, {
      headers: {
        'Cookie': cookies ? cookies.join('; ') : ''
      },
      withCredentials: true
    });
    
    console.log('✅ Проекты получены:', projectsResponse.status);
    console.log('📊 Количество проектов:', projectsResponse.data.length);
    console.log('📋 Список проектов:', JSON.stringify(projectsResponse.data, null, 2));
    
    // 5. Создание тестового проекта
    console.log('➕ Создание тестового проекта...');
    const newProject = {
      name: `Тестовый проект API ${Date.now()}`,
      description: 'Проект создан через прямой API вызов для тестирования'
    };
    
    const createResponse = await axios.post(`${baseURL}/api/projects`, newProject, {
      headers: {
        'Cookie': cookies ? cookies.join('; ') : '',
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('✅ Проект создан:', createResponse.status);
    console.log('📝 Созданный проект:', JSON.stringify(createResponse.data, null, 2));
    
    // 6. Повторное получение проектов
    console.log('🔄 Повторное получение списка проектов...');
    const projectsAfterCreate = await axios.get(`${baseURL}/api/projects`, {
      headers: {
        'Cookie': cookies ? cookies.join('; ') : ''
      },
      withCredentials: true
    });
    
    console.log('✅ Проекты получены повторно:', projectsAfterCreate.status);
    console.log('📊 Количество проектов после создания:', projectsAfterCreate.data.length);
    
    // 7. Итоговый анализ
    console.log('\n🔍 ИТОГОВЫЙ АНАЛИЗ:');
    if (projectsAfterCreate.data.length > projectsResponse.data.length) {
      console.log('✅ ТЕСТ ПРОЙДЕН: Проект успешно создан и сохранен!');
      console.log('✅ API работает корректно');
      console.log('✅ Данные сохраняются в базе данных');
    } else {
      console.log('❌ ТЕСТ НЕ ПРОЙДЕН: Проект не был создан или не сохранился');
    }
    
    console.log('\n📡 СТАТИСТИКА API:');
    console.log(`- CSRF: ${csrfResponse.status}`);
    console.log(`- Авторизация: ${loginResponse.status}`);
    console.log(`- Пользователь: ${userResponse.status}`);
    console.log(`- Получение проектов: ${projectsResponse.status}`);
    console.log(`- Создание проекта: ${createResponse.status}`);
    console.log(`- Повторное получение: ${projectsAfterCreate.status}`);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании API:', error.message);
    if (error.response) {
      console.error('📊 Статус ошибки:', error.response.status);
      console.error('📋 Данные ошибки:', error.response.data);
    }
  }
})();