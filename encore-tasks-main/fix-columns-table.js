const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function fixColumnsTable() {
  try {
    console.log('🔍 Исправление таблицы columns...');
    
    // Удаляем ограничение внешнего ключа из tasks
    console.log('🔗 Удаляем ограничение внешнего ключа...');
    await pool.query('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_column_id_fkey');
    console.log('✅ Ограничение удалено');
    
    // Очищаем column_id в tasks
    console.log('🧹 Очищаем column_id в таблице tasks...');
    await pool.query('UPDATE tasks SET column_id = NULL');
    console.log('✅ column_id очищен');
    
    // Удаляем существующую таблицу columns
    console.log('🗑️ Удаляем таблицу columns...');
    await pool.query('DROP TABLE IF EXISTS columns CASCADE');
    console.log('✅ Таблица columns удалена');
    
    // Создаем правильную таблицу board_columns
    console.log('➕ Создаем таблицу board_columns...');
    await pool.query(`
      CREATE TABLE board_columns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        color VARCHAR(7),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Таблица board_columns создана');
    
    // Создаем индексы
    console.log('📊 Создаем индексы...');
    await pool.query('CREATE INDEX idx_board_columns_board_id ON board_columns(board_id)');
    await pool.query('CREATE INDEX idx_board_columns_position ON board_columns(position)');
    console.log('✅ Индексы созданы');
    
    // Добавляем ограничение внешнего ключа обратно
    console.log('🔗 Добавляем ограничение внешнего ключа...');
    await pool.query('ALTER TABLE tasks ADD CONSTRAINT tasks_column_id_fkey FOREIGN KEY (column_id) REFERENCES board_columns(id)');
    console.log('✅ Ограничение добавлено');
    
    // Показываем структуру новой таблицы
    console.log('\n📋 Структура таблицы board_columns:');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'board_columns' 
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });
    
    console.log('\n✅ Таблица board_columns успешно создана и настроена');
  } catch (error) {
    console.error('❌ Ошибка при исправлении таблицы columns:', error.message);
  } finally {
    await pool.end();
  }
}

fixColumnsTable();