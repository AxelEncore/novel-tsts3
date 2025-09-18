const { Pool } = require('pg');

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function testBoardCreation() {
  try {
    console.log('🔧 Тестируем создание доски напрямую в PostgreSQL...');
    
    // Получаем первый проект
    console.log('📋 Получаем проекты...');
    const projectsResult = await pool.query(
      'SELECT * FROM projects LIMIT 1'
    );
    
    if (projectsResult.rows.length === 0) {
      console.log('❌ Нет проектов для тестирования');
      return;
    }
    
    const project = projectsResult.rows[0];
    console.log('✅ Используем проект:', project.name, 'ID:', project.id);
    
    // Получаем первого пользователя
    const usersResult = await pool.query(
      'SELECT * FROM users LIMIT 1'
    );
    
    if (usersResult.rows.length === 0) {
      console.log('❌ Нет пользователей для тестирования');
      return;
    }
    
    const user = usersResult.rows[0];
    console.log('✅ Используем пользователя:', user.username, 'ID:', user.id);
    
    // Тестируем создание доски
    console.log('🔨 Создаем доску напрямую в PostgreSQL...');
    
    const boardData = {
      name: 'Тестовая доска Direct SQL',
      description: 'Описание тестовой доски через SQL',
      project_id: project.id,
      created_by: user.id,
      color: '#3B82F6'
    };
    
    console.log('📤 Данные для создания:', JSON.stringify(boardData, null, 2));
    
    const createResult = await pool.query(
      `INSERT INTO boards (name, description, project_id, created_by, color, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [boardData.name, boardData.description, boardData.project_id, boardData.created_by, boardData.color]
    );
    
    const newBoard = createResult.rows[0];
    
    console.log('✅ Доска успешно создана!');
    console.log('📋 Созданная доска:', JSON.stringify(newBoard, null, 2));
    
    // Проверяем, что доска действительно создалась
    const boardFromDb = await pool.query(
      'SELECT * FROM boards WHERE id = $1',
      [newBoard.id]
    );
    
    console.log('🔍 Доска из БД:', JSON.stringify(boardFromDb.rows[0], null, 2));
    
  } catch (error) {
    console.error('❌ Ошибка при создании доски:');
    console.error('📄 Сообщение:', error.message);
    console.error('📄 Стек:', error.stack);
    
    if (error.code) {
      console.error('📄 Код ошибки PostgreSQL:', error.code);
    }
    if (error.detail) {
      console.error('📄 Детали:', error.detail);
    }
    if (error.constraint) {
      console.error('📄 Нарушенное ограничение:', error.constraint);
    }
  } finally {
    await pool.end();
  }
}

testBoardCreation();