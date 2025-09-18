const fetch = require('node-fetch');

async function testFrontendAuth() {
  console.log('🌐 Тестирование авторизации фронтенда...');
  
  try {
    // 1. Логинимся и получаем cookies
    console.log('\n1. 🔐 Выполняем логин...');
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
    
    console.log('📊 Статус логина:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      console.log('❌ Ошибка логина:', error);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Логин успешен!');
    console.log('👤 Пользователь:', loginData.user?.email);
    
    // Получаем cookies из ответа
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies получены:', cookies ? 'Да' : 'Нет');
    
    if (!cookies) {
      console.log('❌ Cookies не получены!');
      return;
    }
    
    // 2. Создаем проект с cookies
    console.log('\n2. 🆕 Создаем проект с cookies...');
    const createResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        name: 'Frontend Test Project ' + Date.now(),
        description: 'Проект для тестирования фронтенда',
        icon: '🌐'
      })
    });
    
    console.log('📊 Статус создания:', createResponse.status);
    
    if (createResponse.ok) {
      const newProject = await createResponse.json();
      console.log('✅ Проект создан:', newProject.data?.name);
      console.log('🆔 ID проекта:', newProject.data?.id);
      
      // 3. Получаем список проектов с cookies
      console.log('\n3. 📋 Получаем список проектов с cookies...');
      const projectsResponse = await fetch('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('📊 Статус получения:', projectsResponse.status);
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        console.log('✅ Проекты получены!');
        console.log('📊 Количество проектов:', projectsData.data?.projects?.length || 0);
        
        if (projectsData.data?.projects?.length > 0) {
          console.log('📋 Список проектов:');
          projectsData.data.projects.forEach((project, index) => {
            console.log(`  ${index + 1}. ${project.name} (ID: ${project.id})`);
          });
          
          // Проверяем, есть ли наш созданный проект
          const foundProject = projectsData.data.projects.find(p => p.id === newProject.data?.id);
          if (foundProject) {
            console.log('✅ Созданный проект найден в списке!');
          } else {
            console.log('❌ Созданный проект НЕ найден в списке!');
          }
        } else {
          console.log('⚠️ Проекты не найдены');
        }
      } else {
        const error = await projectsResponse.text();
        console.log('❌ Ошибка получения проектов:', error);
      }
      
      // 4. Тестируем без cookies (имитация обновления страницы)
      console.log('\n4. 🔄 Тестируем без cookies (имитация обновления страницы)...');
      const noCookiesResponse = await fetch('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Статус без cookies:', noCookiesResponse.status);
      
      if (noCookiesResponse.status === 401) {
        console.log('❌ Без cookies доступ запрещен - это объясняет исчезновение проектов!');
      } else if (noCookiesResponse.ok) {
        const noCookiesData = await noCookiesResponse.json();
        console.log('⚠️ Неожиданно: доступ разрешен без cookies');
        console.log('📊 Количество проектов без cookies:', noCookiesData.data?.projects?.length || 0);
      }
      
    } else {
      const createError = await createResponse.text();
      console.log('❌ Ошибка создания проекта:', createError);
    }
    
  } catch (error) {
    console.error('💥 Ошибка:', error.message);
  }
}

testFrontendAuth();