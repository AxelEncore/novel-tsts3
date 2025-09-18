const fetch = require('node-fetch');
const fs = require('fs');

// Читаем токен из файла
const authToken = fs.readFileSync('auth_token.txt', 'utf8').trim();

async function testAuthenticatedAPI() {
  console.log('🔐 Тестирование API с авторизацией...');
  console.log('📋 Токен:', authToken.substring(0, 50) + '...');
  
  try {
    // Тестируем GET /api/projects с авторизацией
    console.log('\n📡 Запрос GET /api/projects с токеном...');
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Статус ответа:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Успешный ответ!');
      console.log('📊 Количество проектов:', data.length || 'N/A');
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('📋 Первые 3 проекта:');
        data.slice(0, 3).forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.name} (ID: ${project.id})`);
        });
      } else {
        console.log('⚠️ Проекты не найдены или пустой массив');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Ошибка:', errorText);
    }
    
    // Тестируем создание проекта
    console.log('\n🆕 Создание тестового проекта...');
    const createResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Auth Project ' + Date.now(),
        description: 'Проект для тестирования авторизации',
        icon: '🔐'
      })
    });
    
    console.log('📊 Статус создания:', createResponse.status);
    
    if (createResponse.ok) {
      const newProject = await createResponse.json();
      console.log('✅ Проект создан:', newProject.data?.name);
      
      // Повторно запрашиваем список проектов
      console.log('\n🔄 Повторный запрос списка проектов...');
      const secondResponse = await fetch('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (secondResponse.ok) {
        const updatedData = await secondResponse.json();
        console.log('📊 Обновленное количество проектов:', updatedData.length || 'N/A');
        
        // Ищем наш созданный проект
        const foundProject = updatedData.find(p => p.id === newProject.data?.id);
        if (foundProject) {
          console.log('✅ Созданный проект найден в списке!');
        } else {
          console.log('❌ Созданный проект НЕ найден в списке!');
        }
      }
    } else {
      const createError = await createResponse.text();
      console.log('❌ Ошибка создания:', createError);
    }
    
  } catch (error) {
    console.error('💥 Ошибка:', error.message);
  }
}

testAuthenticatedAPI();