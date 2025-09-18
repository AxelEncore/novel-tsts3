const fetch = require('node-fetch');
const { Pool } = require('pg');

// Настройки подключения к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function debugBoardCreation() {
  try {
    console.log('🔍 Отладка создания доски...');
    
    // Получаем токен авторизации
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
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
    console.log('🔐 Авторизация:', loginData.token ? 'Успешно' : 'Ошибка');
    
    if (!loginData.token) {
      console.error('❌ Ошибка авторизации:', loginData);
      return;
    }
    
    const authToken = loginData.token;
    
    // Получаем список проектов
    const projectsResponse = await fetch('http://localhost:3000/api/projects', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Cookie': `auth-token=${authToken}`
      }
    });
    
    console.log('📊 Статус получения проектов:', projectsResponse.status);
    const projectsText = await projectsResponse.text();
    console.log('📄 Ответ проектов (raw):', projectsText);
    
    let projectsData;
    try {
      projectsData = JSON.parse(projectsText);
      console.log('📋 Проекты (JSON):', JSON.stringify(projectsData, null, 2));
    } catch (e) {
      console.error('❌ Ответ проектов не является валидным JSON:', e.message);
      return;
    }
    
    console.log('📋 Проекты найдены:', projectsData.projects?.length || 0);
    
    let testProject;
    if (!projectsData.projects || projectsData.projects.length === 0) {
      console.log('📝 Создаем тестовый проект...');
      console.log('📊 Статус получения проектов:', projectsResponse.status);
      console.log('📄 Данные проектов:', JSON.stringify(projectsData, null, 2));
      
      try {
        const createProjectResponse = await fetch('http://localhost:3000/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'Cookie': `auth-token=${authToken}`
          },
          body: JSON.stringify({
            name: 'Тестовый проект для досок',
            description: 'Проект для тестирования создания досок'
          })
        });
        
        console.log('📊 Статус создания проекта:', createProjectResponse.status);
        const createProjectText = await createProjectResponse.text();
        console.log('📄 Ответ создания проекта (raw):', createProjectText);
        
        let createProjectData;
        try {
          createProjectData = JSON.parse(createProjectText);
          console.log('📋 Создание проекта (JSON):', createProjectData);
        } catch (e) {
          console.error('❌ Ответ не является валидным JSON:', e.message);
          return;
        }
        
        if (!createProjectData.data) {
          console.error('❌ Не удалось создать проект:', createProjectData);
          return;
        }
        
        testProject = createProjectData.data;
      } catch (createError) {
        console.error('❌ Ошибка при создании проекта:', createError);
        return;
      }
    } else {
       testProject = projectsData.projects[0];
     }
    
    if (!testProject) {
      console.error('❌ Не удалось получить тестовый проект');
      return;
    }
    
    console.log('🎯 Тестовый проект:', testProject.name, 'ID:', testProject.id);
    
    // Пытаемся создать доску
    console.log('\n🔨 Создаем доску...');
    const boardData = {
      name: 'Тестовая доска',
      description: 'Описание тестовой доски',
      color: '#3B82F6'
    };
    
    console.log('📤 Отправляем данные:', JSON.stringify(boardData, null, 2));
    console.log('🔗 URL:', `http://localhost:3000/api/projects/${testProject.id}/boards`);
    console.log('🔑 Токен:', authToken.substring(0, 20) + '...');
    
    const boardResponse = await fetch(`http://localhost:3000/api/projects/${testProject.id}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify(boardData)
    });
    
    console.log('📊 Статус ответа:', boardResponse.status);
    console.log('📋 Заголовки ответа:', Object.fromEntries(boardResponse.headers.entries()));
    
    const boardResult = await boardResponse.text();
    console.log('📄 Тело ответа (raw):', boardResult);
    
    try {
      const boardJson = JSON.parse(boardResult);
      console.log('📄 Тело ответа (JSON):', JSON.stringify(boardJson, null, 2));
    } catch (e) {
      console.log('⚠️ Ответ не является валидным JSON');
    }
    
    // Проверяем структуру таблицы boards
    console.log('\n🔍 Проверяем структуру таблицы boards...');
    const tableStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'boards' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы boards:');
    tableStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка при отладке:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

debugBoardCreation();