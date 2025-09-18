const { Pool } = require('pg');
const fetch = require('node-fetch');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const API_BASE = 'http://localhost:3000/api';

async function getAuthToken() {
  const authResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@encore-tasks.com',
      password: 'password'
    })
  });
  
  const authData = await authResponse.json();
  console.log('🔐 Аутентификация:', authData);
  
  if (!authData.token) {
    throw new Error('Не удалось получить токен аутентификации');
  }
  
  return authData.token;
}

async function testBoardsAndColumns() {
  try {
    console.log('🚀 Начинаем тестирование досок и колонок...');
    
    // Получаем токен аутентификации
    const token = await getAuthToken();
    
    // 1. Создаем тестовый проект
    console.log('\n📋 Создаем тестовый проект...');
    const projectResponse = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Проект для тестирования досок',
        description: 'Тестирование создания досок и колонок',
        color: '#4CAF50',
        icon: '📊'
      })
    });
    
    const projectData = await projectResponse.json();
    console.log('📊 Проект создан:', projectData);
    
    if (!projectData.success) {
      throw new Error('Не удалось создать проект');
    }
    
    const projectId = projectData.data.id;
    
    // 2. Создаем доску
    console.log('\n🏗️ Создаем доску...');
    const boardResponse = await fetch(`${API_BASE}/projects/${projectId}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Основная доска',
        description: 'Доска для управления задачами',
        color: '#2196F3'
      })
    });
    
    const boardData = await boardResponse.json();
    console.log('📋 Статус создания доски:', boardResponse.status);
    console.log('📋 Результат создания доски:', boardData);
    
    if (!boardData.success) {
      console.log('❌ Не удалось создать доску');
      return;
    }
    
    const boardId = boardData.data.id;
    
    // 3. Создаем колонки
    console.log('\n📝 Создаем колонки...');
    const columns = [
      { name: 'К выполнению', color: '#FF9800', position: 0 },
      { name: 'В работе', color: '#2196F3', position: 1 },
      { name: 'Выполнено', color: '#4CAF50', position: 2 }
    ];
    
    const createdColumns = [];
    
    for (const column of columns) {
      const columnResponse = await fetch(`${API_BASE}/boards/${boardId}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(column)
      });
      
      const columnData = await columnResponse.json();
      console.log(`📝 Колонка "${column.name}" - статус:`, columnResponse.status);
      console.log(`📝 Результат:`, columnData);
      
      if (columnData.success) {
        createdColumns.push(columnData.data);
      }
    }
    
    // 4. Проверяем данные в базе
    console.log('\n🗄️ Проверяем данные в базе данных...');
    
    const boardsResult = await pool.query('SELECT * FROM boards WHERE project_id = $1', [projectId]);
    console.log('📋 Доски в БД:', boardsResult.rows);
    
    if (boardsResult.rows.length > 0) {
      const columnsResult = await pool.query('SELECT * FROM columns WHERE board_id = $1 ORDER BY position', [boardId]);
      console.log('📝 Колонки в БД:', columnsResult.rows);
    }
    
    // 5. Создаем тестовую задачу
    if (createdColumns.length > 0) {
      console.log('\n📋 Создаем тестовую задачу...');
      const taskResponse = await fetch(`${API_BASE}/columns/${createdColumns[0].id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Тестовая задача',
          description: 'Описание тестовой задачи',
          priority: 'medium'
        })
      });
      
      const taskData = await taskResponse.json();
      console.log('📋 Статус создания задачи:', taskResponse.status);
      console.log('📋 Результат создания задачи:', taskData);
      
      if (taskData.success) {
        const tasksResult = await pool.query('SELECT * FROM tasks WHERE column_id = $1', [createdColumns[0].id]);
        console.log('📋 Задачи в БД:', tasksResult.rows);
      }
    }
    
    // 6. Очистка - удаляем тестовый проект
    console.log('\n🗑️ Удаляем тестовый проект...');
    const deleteResponse = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (deleteResponse.ok) {
      console.log('🗑️ Тестовый проект удален');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await pool.end();
  }
}

testBoardsAndColumns();