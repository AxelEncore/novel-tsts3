const fetch = require('node-fetch');

async function testProjectAPI() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🔐 Авторизация...');
    
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
    console.log('🔐 Авторизация результат:', loginResponse.status, loginData);
    
    if (!loginData.success) {
      throw new Error('Авторизация не удалась');
    }
    
    const authCookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Получены cookies:', authCookies ? authCookies.length : 0);
    
    // Создание проекта
    console.log('\n📂 Создание проекта...');
    const projectResponse = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies || ''
      },
      body: JSON.stringify({
        name: 'Тестовый проект API',
        description: 'Проект для проверки API',
        color: '#3B82F6'
      })
    });
    
    const projectData = await projectResponse.json();
    console.log('📂 Создание проекта результат:', projectResponse.status, projectData);
    
    if (projectData.success && projectData.data) {
      const projectId = projectData.data.id;
      console.log('✅ Проект создан с ID:', projectId);
      
      // Проверка получения проектов
      console.log('\n📋 Получение списка проектов...');
      const getProjectsResponse = await fetch(`${baseUrl}/api/projects`, {
        headers: {
          'Cookie': authCookies || ''
        }
      });
      
      const projectsData = await getProjectsResponse.json();
      console.log('📋 Получение проектов результат:', getProjectsResponse.status);
      console.log('📋 Количество проектов:', Array.isArray(projectsData) ? projectsData.length : 'не массив');
      
      if (Array.isArray(projectsData)) {
        const createdProject = projectsData.find(p => p.id === projectId);
        console.log('✅ Проект найден в списке:', !!createdProject);
        if (createdProject) {
          console.log('📂 Данные проекта:', {
            id: createdProject.id,
            name: createdProject.name,
            description: createdProject.description
          });
        }
      }
      
      return true;
    } else {
      console.log('❌ Проект не создан');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
    return false;
  }
}

testProjectAPI().then(success => {
  console.log(`\n🎯 Результат теста: ${success ? 'УСПЕХ' : 'НЕУДАЧА'}`);
  process.exit(success ? 0 : 1);
});