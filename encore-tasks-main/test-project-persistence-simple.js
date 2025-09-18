const axios = require('axios');

async function testProjectPersistence() {
  try {
    console.log('🚀 Тестирование сохранения проектов...');
    
    // 1. Авторизация
    console.log('🔑 Авторизация...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'axelencore@mail.ru',
      password: 'Ad580dc6axelencore'
    });
    
    if (!loginResponse.data.token) {
      throw new Error('Не удалось получить токен авторизации');
    }
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // 2. Получаем список проектов ДО создания
    console.log('📊 Получение списка проектов ДО создания...');
    const projectsBeforeResponse = await axios.get('http://localhost:3000/api/projects', { headers });
    const projectsBefore = projectsBeforeResponse.data.data.projects;
    console.log(`📈 Проектов ДО создания: ${projectsBefore.length}`);
    
    // 3. Создаем новый проект
    console.log('➕ Создание нового проекта...');
    const projectName = `Persistence Test ${Date.now()}`;
    const createResponse = await axios.post('http://localhost:3000/api/projects', {
      name: projectName,
      description: 'Тест сохранения проектов',
      color: '#3B82F6',
      icon: '📋'
    }, { headers });
    
    if (createResponse.status !== 201) {
      throw new Error(`Ошибка создания проекта: ${createResponse.status}`);
    }
    
    const createdProject = createResponse.data.data;
    console.log(`✅ Проект "${projectName}" создан с ID: ${createdProject.id}`);
    
    // 4. Получаем список проектов ПОСЛЕ создания
    console.log('📊 Получение списка проектов ПОСЛЕ создания...');
    const projectsAfterResponse = await axios.get('http://localhost:3000/api/projects', { headers });
    const projectsAfter = projectsAfterResponse.data.data.projects;
    console.log(`📈 Проектов ПОСЛЕ создания: ${projectsAfter.length}`);
    
    // 5. Проверяем, что проект есть в списке
    const foundProject = projectsAfter.find(p => p.id === createdProject.id);
    if (foundProject) {
      console.log('✅ Созданный проект найден в списке');
    } else {
      console.log('❌ Созданный проект НЕ найден в списке!');
      return;
    }
    
    // 6. Имитируем "обновление страницы" - повторный запрос списка проектов
    console.log('🔄 Имитация обновления страницы (повторный запрос)...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Небольшая задержка
    
    const projectsAfterReloadResponse = await axios.get('http://localhost:3000/api/projects', { headers });
    const projectsAfterReload = projectsAfterReloadResponse.data.data.projects;
    console.log(`📈 Проектов ПОСЛЕ "обновления": ${projectsAfterReload.length}`);
    
    // 7. Проверяем, что проект все еще есть
    const foundProjectAfterReload = projectsAfterReload.find(p => p.id === createdProject.id);
    if (foundProjectAfterReload) {
      console.log('✅ Проект сохраняется после "обновления страницы"');
      console.log('🎉 ТЕСТ ПРОЙДЕН: Проекты корректно сохраняются!');
    } else {
      console.log('❌ Проект исчезает после "обновления страницы"!');
      console.log('💥 ТЕСТ НЕ ПРОЙДЕН: Проблема с сохранением проектов!');
    }
    
    // 8. Дополнительная проверка - новая авторизация
    console.log('🔄 Тест с новой авторизацией...');
    const newLoginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'axelencore@mail.ru',
      password: 'Ad580dc6axelencore'
    });
    
    const newToken = newLoginResponse.data.token;
    const newHeaders = { Authorization: `Bearer ${newToken}` };
    
    const projectsWithNewTokenResponse = await axios.get('http://localhost:3000/api/projects', { headers: newHeaders });
    const projectsWithNewToken = projectsWithNewTokenResponse.data.data.projects;
    console.log(`📈 Проектов с новым токеном: ${projectsWithNewToken.length}`);
    
    const foundProjectWithNewToken = projectsWithNewToken.find(p => p.id === createdProject.id);
    if (foundProjectWithNewToken) {
      console.log('✅ Проект доступен с новым токеном авторизации');
    } else {
      console.log('❌ Проект НЕ доступен с новым токеном авторизации!');
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    if (error.response) {
      console.error('📝 Ответ сервера:', error.response.data);
    }
  }
}

testProjectPersistence();