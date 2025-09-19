const fetch = require('node-fetch');

async function debugProjectsAPI() {
  const baseUrl = 'http://localhost:3000';
  let authToken = null;
  
  try {
    console.log('🔐 Шаг 1: Авторизация...');
    
    // Авторизация
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'axelencore@mail.ru',
        password: 'Ad580dc6axelencore'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('🔐 Авторизация статус:', loginResponse.status);
    console.log('🔐 Авторизация данные:', loginData);
    
    if (!loginData.user || !loginData.token) {
      throw new Error('Авторизация не удалась: ' + JSON.stringify(loginData));
    }
    
    // Получаем cookies для дальнейших запросов
    const setCookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Set-Cookie header:', setCookies);
    
    const cookies = setCookies || '';
    
    console.log('\n📂 Шаг 2: Создание тестового проекта...');
    
    // Создание проекта
    const createProjectResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        name: 'Тест API Debug Project',
        description: 'Проект для отладки API',
        color: '#FF5733',
        isPrivate: false
      })
    });
    
    const createProjectData = await createProjectResponse.json();
    console.log('📂 Создание проекта статус:', createProjectResponse.status);
    console.log('📂 Создание проекта данные:', JSON.stringify(createProjectData, null, 2));
    
    console.log('\n📋 Шаг 3: Получение всех проектов...');
    
    // Получение всех проектов
    const getProjectsResponse = await fetch(`${baseUrl}/api/projects`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    const getProjectsData = await getProjectsResponse.json();
    console.log('📋 Получение проектов статус:', getProjectsResponse.status);
    console.log('📋 Получение проектов данные:', JSON.stringify(getProjectsData, null, 2));
    
    if (getProjectsData.success && getProjectsData.data && getProjectsData.data.projects) {
      console.log('\n✅ Анализ полученных проектов:');
      console.log(`📊 Количество проектов: ${getProjectsData.data.projects.length}`);
      
      getProjectsData.data.projects.forEach((project, index) => {
        console.log(`📂 Проект ${index + 1}:`, {
          id: project.id ? project.id.substring(0, 8) + '...' : 'НЕТ ID',
          name: project.name || 'БЕЗ НАЗВАНИЯ',
          created_at: project.created_at || 'НЕТ ДАТЫ'
        });
      });
      
      // Ищем созданный проект
      const createdProject = getProjectsData.data.projects.find(p => 
        p.name === 'Тест API Debug Project'
      );
      
      if (createdProject) {
        console.log('✅ Созданный проект найден в списке!');
        console.log('📊 Детали найденного проекта:', {
          id: createdProject.id,
          name: createdProject.name,
          description: createdProject.description,
          created_at: createdProject.created_at
        });
      } else {
        console.log('❌ Созданный проект НЕ найден в списке!');
        console.log('🔍 Проверяем названия всех проектов:');
        getProjectsData.data.projects.forEach(p => {
          console.log(`  - "${p.name}"`);
        });
      }
    } else {
      console.log('❌ Неправильный формат ответа от API /projects');
      console.log('🔍 Структура ответа:', {
        success: getProjectsData.success,
        hasData: !!getProjectsData.data,
        hasProjects: !!(getProjectsData.data && getProjectsData.data.projects),
        dataKeys: getProjectsData.data ? Object.keys(getProjectsData.data) : 'нет data'
      });
    }
    
    console.log('\n🎯 Тест завершен');
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Убедитесь что сервер запущен: npm run dev');
    }
    return false;
  }
}

debugProjectsAPI().then(() => {
  console.log('\n🏁 Тест API проектов завершен');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});