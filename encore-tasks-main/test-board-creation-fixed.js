const fetch = require('node-fetch');
const Database = require('better-sqlite3');
const path = require('path');

/**
 * Тест для проверки исправления создания досок
 * Проверяет, что:
 * 1. API правильно принимает данные с project_id
 * 2. Возвращает корректную структуру ответа
 * 3. Доска успешно создается в базе данных
 */
async function testFixedBoardCreation() {
  try {
    console.log('🔧 Тестирование исправленного создания доски...');
    
    // 1. Используем предустановленный токен авторизации
    const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMDEyYjA3OS01Nzk4LTQ5ZDUtOGNmZi0wZTFkYmVhNTgyMmUiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwidGltZXN0YW1wIjoxNzU2MjgwNDEyMzU2LCJyYW5kb20iOiI0MWR4a2M2OXJxYyIsImlhdCI6MTc1NjI4MDQxMiwiZXhwIjoxNzU2ODg1MjEyfQ.QBoGB6-ToDaXTTqMh-3N-FN6n23rd0G4BCqOXBxxIPQ';
    
    // 2. Получаем project_id из базы данных
    console.log('📋 Получение проекта...');
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
    
    // 3. Создаем тестовые данные для доски
    const testBoardData = {
      name: `Исправленная тестовая доска ${Date.now()}`,
      description: 'Доска создана после исправления бага',
      project_id: projectId // Используем правильное поле project_id
    };
    
    console.log('📤 Отправляем данные:', JSON.stringify(testBoardData, null, 2));
    
    // 4. Делаем запрос к API
    console.log('🌐 Отправляем POST запрос к /api/boards...');
    
    const response = await fetch('http://localhost:3000/api/boards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      body: JSON.stringify(testBoardData)
    });
    
    console.log(`📨 Статус ответа: ${response.status}`);
    console.log(`📨 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('📦 Тело ответа:', JSON.stringify(responseData, null, 2));
    
    // 5. Анализируем результат
    if (response.status === 201) {
      console.log('\n✅ УСПЕХ: Доска создана успешно!');
      
      // Проверяем структуру ответа
      if (responseData.success && responseData.data) {
        console.log('✅ Корректная структура ответа');
        console.log('📋 Данные доски:');
        console.log(`  - ID: ${responseData.data.id}`);
        console.log(`  - Название: ${responseData.data.name}`);
        console.log(`  - Описание: ${responseData.data.description}`);
        console.log(`  - Проект ID: ${responseData.data.project_id}`);
        console.log(`  - Создано: ${responseData.data.created_at}`);
        
        // Проверяем, что project_id совпадает
        if (responseData.data.project_id === projectId) {
          console.log('✅ project_id корректно сохранен');
        } else {
          console.log(`❌ project_id не совпадает: ожидали ${projectId}, получили ${responseData.data.project_id}`);
        }
      } else {
        console.log('❌ Неверная структура ответа');
      }
      
    } else {
      console.log('\n❌ ОШИБКА: Не удалось создать доску');
      console.log(`Статус: ${response.status}`);
      
      if (responseData.error) {
        console.log(`Ошибка: ${responseData.error}`);
      }
      
      if (responseData.details) {
        console.log('Детали:', responseData.details);
      }
    }
    
    // 6. Дополнительная проверка - тест с невалидными данными
    console.log('\n🧪 Тест с невалидными данными...');
    
    const invalidBoardData = {
      name: '', // Пустое название - должно вызвать ошибку валидации
      description: 'Тест с невалидными данными',
      project_id: projectId
    };
    
    const invalidResponse = await fetch('http://localhost:3000/api/boards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      body: JSON.stringify(invalidBoardData)
    });
    
    console.log(`📨 Статус ответа (невалидные данные): ${invalidResponse.status}`);
    
    const invalidResponseData = await invalidResponse.json();
    
    if (invalidResponse.status === 400 && invalidResponseData.error === 'Validation failed') {
      console.log('✅ Валидация работает корректно');
    } else {
      console.log('❌ Валидация работает неправильно');
      console.log('Ответ:', JSON.stringify(invalidResponseData, null, 2));
    }
    
    console.log('\n🎉 Тест завершен!');
    
  } catch (error) {
    console.error('\n❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
    console.error('Полная ошибка:', error);
  }
}

// Запускаем тест
console.log('🚀 Начинаем тест исправленного создания досок...\n');
testFixedBoardCreation();