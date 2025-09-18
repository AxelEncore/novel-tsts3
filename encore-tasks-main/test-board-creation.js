const fetch = require('node-fetch');
const Database = require('better-sqlite3');
const path = require('path');

async function testBoardCreation() {
  try {
    console.log('🚀 Начинаем тестирование создания доски через API...');
    
    // 1. Используем предустановленный токен авторизации
    console.log('\n1. Использование предустановленного токена...');
    const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMDEyYjA3OS01Nzk4LTQ5ZDUtOGNmZi0wZTFkYmVhNTgyMmUiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwidGltZXN0YW1wIjoxNzU2MjgwNDEyMzU2LCJyYW5kb20iOiI0MWR4a2M2OXJxYyIsImlhdCI6MTc1NjI4MDQxMiwiZXhwIjoxNzU2ODg1MjEyfQ.QBoGB6-ToDaXTTqMh-3N-FN6n23rd0G4BCqOXBxxIPQ';
    const token = JWT_TOKEN;
    
    console.log('✅ Токен установлен успешно');
    
    // 2. Получаем существующий project_id из базы данных
    console.log('\n2. Получение project_id из базы данных...');
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new Database(dbPath);
    
    const projects = db.prepare('SELECT id, name FROM projects LIMIT 1').all();
    
    if (projects.length === 0) {
      throw new Error('В базе данных нет проектов');
    }
    
    const projectId = projects[0].id;
    const projectName = projects[0].name;
    
    console.log(`✅ Найден проект: ${projectName} (ID: ${projectId})`);
    
    db.close();
    
    // 3. Создаем доску
    console.log('\n3. Создание доски...');
    const boardData = {
      name: `Тестовая доска ${Date.now()}`,
      description: 'Доска создана автоматическим тестом',
      project_id: projectId
    };
    
    console.log('Данные доски:', JSON.stringify(boardData, null, 2));
    
    const createResponse = await fetch('http://localhost:3000/api/boards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(boardData)
    });
    
    console.log('Статус ответа:', createResponse.status);
    
    const responseData = await createResponse.json();
    console.log('Тело ответа:', JSON.stringify(responseData, null, 2));
    
    if (createResponse.status === 201) {
      console.log('\n✅ УСПЕХ: Доска создана успешно!');
      console.log('ID созданной доски:', responseData.id);
      console.log('Название:', responseData.name);
      console.log('Описание:', responseData.description);
      console.log('Проект ID:', responseData.project_id);
    } else {
      console.log('\n❌ ОШИБКА: Не удалось создать доску');
      console.log('Статус:', createResponse.status);
      console.log('Ошибка:', responseData.message || responseData.error);
    }
    
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    console.error('Полная ошибка:', error);
  }
}

// Запускаем тест
testBoardCreation();