require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.POSTGRES_SSL === 'true' || process.env.POSTGRES_SSL === 'require' 
    ? { rejectUnauthorized: false } 
    : false,
});

// Определяем правильные колонки согласно ТЗ
const DEFAULT_COLUMNS = [
  {
    name: 'На выполнение',
    status: 'todo',
    color: '#6B7280',  // серый нейтральный
    position: 0
  },
  {
    name: 'В процессе',
    status: 'in_progress', 
    color: '#3B82F6',  // синий
    position: 1
  },
  {
    name: 'На проверке',
    status: 'review',
    color: '#8B5CF6',  // фиолетовый
    position: 2
  },
  {
    name: 'Выполнено',
    status: 'done',
    color: '#10B981',  // зеленый
    position: 3
  },
  {
    name: 'Отложено',
    status: 'deferred',
    color: '#F59E0B',  // оранжевый
    position: 4
  }
];

async function createDefaultColumns() {
  let client;
  try {
    console.log('🔄 Создание колонок по умолчанию для существующих досок...');
    
    client = await pool.connect();
    
    // Получаем все доски которые не имеют колонок
    const boardsWithoutColumns = `
      SELECT b.id, b.name, b.project_id
      FROM boards b
      LEFT JOIN columns c ON b.id = c.board_id
      WHERE c.id IS NULL
    `;
    
    const boards = await client.query(boardsWithoutColumns);
    console.log(`📋 Найдено ${boards.rows.length} досок без колонок`);
    
    for (const board of boards.rows) {
      console.log(`\n📋 Создание колонок для доски: ${board.name}`);
      
      for (const columnTemplate of DEFAULT_COLUMNS) {
        const insertColumn = `
          INSERT INTO columns (id, board_id, name, color, position, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            NOW(),
            NOW()
          )
          RETURNING id, name
        `;
        
        const result = await client.query(insertColumn, [
          board.id,
          columnTemplate.name,
          columnTemplate.color,
          columnTemplate.position
        ]);
        
        console.log(`  ✅ Создана колонка: ${columnTemplate.name} (${columnTemplate.color})`);
      }
    }
    
    // Проверяем результат
    const checkColumns = `
      SELECT 
        b.name as board_name,
        c.name as column_name,
        c.color,
        c.position
      FROM boards b
      JOIN columns c ON b.id = c.board_id
      ORDER BY b.name, c.position
    `;
    
    const columnsResult = await client.query(checkColumns);
    console.log('\n📊 Структура колонок:');
    
    let currentBoard = '';
    columnsResult.rows.forEach(row => {
      if (row.board_name !== currentBoard) {
        currentBoard = row.board_name;
        console.log(`\n📋 Доска: ${currentBoard}`);
      }
      console.log(`  ${row.position + 1}. ${row.column_name} (${row.color})`);
    });
    
    console.log('\n🎉 Создание колонок по умолчанию завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при создании колонок:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Функция для создания колонок для новой доски
async function createColumnsForBoard(boardId) {
  let client;
  try {
    client = await pool.connect();
    
    for (const columnTemplate of DEFAULT_COLUMNS) {
      const insertColumn = `
        INSERT INTO columns (id, board_id, name, color, position, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          NOW(),
          NOW()
        )
      `;
      
      await client.query(insertColumn, [
        boardId,
        columnTemplate.name,
        columnTemplate.color,
        columnTemplate.position
      ]);
    }
    
    console.log(`✅ Созданы колонки по умолчанию для доски ${boardId}`);
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка при создании колонок для доски:', error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Если вызвано напрямую - создаем колонки для существующих досок
if (require.main === module) {
  createDefaultColumns();
}

module.exports = { createColumnsForBoard, DEFAULT_COLUMNS };