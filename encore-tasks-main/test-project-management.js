const { Pool } = require('pg');
const fetch = require('node-fetch');

// Конфигурация базы данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

const API_BASE = 'http://localhost:3000/api';

async function testProjectManagement() {
  try {
    console.log('=== Тест управления проектами ===');
    
    // 1. Получаем токен аутентификации
    console.log('\n1. Получение токена аутентификации:');
    const sessionResult = await pool.query(
      `SELECT s.token, s.user_id, u.email, u.role 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.expires_at > NOW() 
       ORDER BY s.created_at DESC 
       LIMIT 1`
    );
    
    if (sessionResult.rows.length === 0) {
      console.log('❌ Не найдено активных сессий');
      return;
    }
    
    const session = sessionResult.rows[0];
    const authToken = session.token;
    console.log('✅ Токен получен для пользователя:', session.email);
    
    // 2. Тест создания проекта
    console.log('\n2. Тест создания проекта:');
    const newProjectData = {
      name: 'Test Project Management',
      description: 'Тестовый проект для проверки управления проектами',
      status: 'active'
    };
    
    const createResponse = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(newProjectData)
    });
    
    const createResult = await createResponse.json();
    console.log('Статус создания:', createResponse.status);
    
    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log('✅ Проект успешно создан:', {
        id: createResult.data.id,
        name: createResult.data.name,
        status: createResult.data.status
      });
      var createdProjectId = createResult.data.id;
    } else {
      console.log('❌ Ошибка создания проекта:', createResult);
      return;
    }
    
    // 3. Тест получения списка проектов
    console.log('\n3. Тест получения списка проектов:');
    const listResponse = await fetch(`${API_BASE}/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const listResult = await listResponse.json();
    console.log('Статус получения списка:', listResponse.status);
    
    if (listResponse.status === 200) {
      const projects = listResult.data.projects || [];
      console.log('✅ Список проектов получен:', {
        count: projects.length,
        projects: projects.map(p => ({ id: p.id, name: p.name, status: p.status }))
      });
      
      // Проверяем, что созданный проект есть в списке
      const foundProject = projects.find(p => p.id === createdProjectId);
      if (foundProject) {
        console.log('✅ Созданный проект найден в списке');
      } else {
        console.log('❌ Созданный проект не найден в списке');
      }
    } else {
      console.log('❌ Ошибка получения списка проектов:', listResult);
    }
    
    // 4. Тест получения конкретного проекта
    console.log('\n4. Тест получения конкретного проекта:');
    const getResponse = await fetch(`${API_BASE}/projects/${createdProjectId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const getResult = await getResponse.json();
    console.log('Статус получения проекта:', getResponse.status);
    
    if (getResponse.status === 200) {
      console.log('✅ Проект получен:', {
        id: getResult.data.id,
        name: getResult.data.name,
        description: getResult.data.description,
        status: getResult.data.status,
        created_at: getResult.data.created_at
      });
    } else {
      console.log('❌ Ошибка получения проекта:', getResult);
    }
    
    // 5. Тест обновления проекта
    console.log('\n5. Тест обновления проекта:');
    const updateData = {
      name: 'Updated Test Project',
      description: 'Обновленное описание проекта',
      status: 'completed'
    };
    
    const updateResponse = await fetch(`${API_BASE}/projects/${createdProjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    console.log('Статус обновления:', updateResponse.status);
    
    if (updateResponse.status === 200) {
      console.log('✅ Проект успешно обновлен:', {
        id: updateResult.data.id,
        name: updateResult.data.name,
        description: updateResult.data.description,
        status: updateResult.data.status
      });
    } else {
      console.log('❌ Ошибка обновления проекта:', updateResult);
    }
    
    // 6. Тест получения досок проекта
    console.log('\n6. Тест получения досок проекта:');
    const boardsResponse = await fetch(`${API_BASE}/projects/${createdProjectId}/boards`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const boardsResult = await boardsResponse.json();
    console.log('Статус получения досок:', boardsResponse.status);
    
    if (boardsResponse.status === 200) {
      console.log('✅ Доски проекта получены:', {
        count: boardsResult.data.length,
        boards: boardsResult.data.map(b => ({ id: b.id, name: b.name }))
      });
    } else {
      console.log('❌ Ошибка получения досок проекта:', boardsResult);
    }
    
    // 7. Тест удаления проекта
    console.log('\n7. Тест удаления проекта:');
    const deleteResponse = await fetch(`${API_BASE}/projects/${createdProjectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const deleteResult = await deleteResponse.json();
    console.log('Статус удаления:', deleteResponse.status);
    
    if (deleteResponse.status === 200) {
      console.log('✅ Проект успешно удален');
      
      // Проверяем, что проект действительно удален
      const verifyResponse = await fetch(`${API_BASE}/projects/${createdProjectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (verifyResponse.status === 404) {
        console.log('✅ Подтверждено: проект удален из базы данных');
      } else {
        console.log('❌ Проект все еще существует после удаления');
      }
    } else {
      console.log('❌ Ошибка удаления проекта:', deleteResult);
    }
    
    // 8. Итоговый отчет
    console.log('\n8. Итоговый отчет тестирования проектов:');
    const results = [
      { operation: 'Создание проекта', status: createResponse.status, success: createResponse.status === 200 || createResponse.status === 201 },
      { operation: 'Получение списка', status: listResponse.status, success: listResponse.status === 200 },
      { operation: 'Получение проекта', status: getResponse.status, success: getResponse.status === 200 },
      { operation: 'Обновление проекта', status: updateResponse.status, success: updateResponse.status === 200 },
      { operation: 'Получение досок', status: boardsResponse.status, success: boardsResponse.status === 200 },
      { operation: 'Удаление проекта', status: deleteResponse.status, success: deleteResponse.status === 200 }
    ];
    
    console.table(results);
    
    const successfulOperations = results.filter(r => r.success);
    const failedOperations = results.filter(r => !r.success);
    
    if (failedOperations.length === 0) {
      console.log('🎉 Все операции управления проектами прошли успешно!');
    } else {
      console.log(`❌ Неудачных операций: ${failedOperations.length}`);
      console.log('Неудачные операции:', failedOperations.map(op => op.operation));
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании управления проектами:', error);
  } finally {
    await pool.end();
  }
}

testProjectManagement();