const { Pool } = require('pg');

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function checkBoardsTable() {
  try {
    console.log('🔍 Проверяем структуру таблицы boards...');
    
    // Получаем структуру таблицы
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'boards' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Структура таблицы boards:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
    // Проверяем есть ли поле color
    const hasColor = structureResult.rows.some(row => row.column_name === 'color');
    console.log(`\n🎨 Поле color ${hasColor ? 'ЕСТЬ' : 'ОТСУТСТВУЕТ'} в таблице boards`);
    
    if (!hasColor) {
      console.log('\n⚠️  Нужно добавить поле color в таблицу boards');
      console.log('SQL для добавления: ALTER TABLE boards ADD COLUMN color VARCHAR(7) DEFAULT \'#3B82F6\';');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке таблицы:', error.message);
  } finally {
    await pool.end();
  }
}

checkBoardsTable();