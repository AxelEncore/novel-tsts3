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

// Колонки согласно ТЗ с правильными цветами
const DEFAULT_COLUMNS = [
  {
    title: 'На выполнение',    // используем title вместо name
    color: '#6B7280',  // серый нейтральный
    position: 0
  },
  {
    title: 'В процессе',
    color: '#3B82F6',  // синий
    position: 1
  },
  {
    title: 'На проверке',
    color: '#8B5CF6',  // фиолетовый
    position: 2
  },
  {
    title: 'Выполнено',
    color: '#10B981',  // зеленый
    position: 3
  },
  {
    title: 'Отложено',
    color: '#F59E0B',  // оранжевый
    position: 4
  }
];

async function checkColumnsStructure() {
  let client;
  try {
    client = await pool.connect();
    
    // Проверяем структуру таблицы columns
    const checkStructure = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'columns'
      ORDER BY ordinal_position
    `;
    
    const structure = await client.query(checkStructure);
    console.log('📋 Структура таблицы columns:');
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка при проверке структуры:', error.message);
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function createDefaultColumns() {
  let client;
  try {
    console.log('🔄 Создание колонок по умолчанию для существующих досок...');
    
    client = await pool.connect();
    
    // Сначала проверим структуру таблицы
    await checkColumnsStructure();
    
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
        // Используем правильные поля в зависимости от схемы
        const insertColumn = `
          INSERT INTO columns (id, board_id, title, color, position, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            NOW(),
            NOW()
          )
          RETURNING id, title
        `;
        
        const result = await client.query(insertColumn, [
          board.id,
          columnTemplate.title,
          columnTemplate.color,
          columnTemplate.position
        ]);
        
        console.log(`  ✅ Создана колонка: ${columnTemplate.title} (${columnTemplate.color})`);
      }
    }
    
    // Проверяем результат
    const checkColumns = `
      SELECT 
        b.name as board_name,
        c.title as column_title,
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
      console.log(`  ${row.position + 1}. ${row.column_title} (${row.color})`);
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

createDefaultColumns();