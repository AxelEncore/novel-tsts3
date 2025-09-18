const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function createProperColumnsTable() {
  try {
    console.log('🔍 Создание правильной таблицы columns...');
    
    // Удаляем существующую неправильную таблицу columns
    console.log('🗑️ Удаляем существующую таблицу columns...');
    await pool.query('DROP TABLE IF EXISTS columns CASCADE');
    console.log('✅ Старая таблица удалена');
    
    // Создаем правильную таблицу columns
    console.log('➕ Создаем новую таблицу columns...');
    await pool.query(`
      CREATE TABLE columns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        position INTEGER DEFAULT 0,
        color VARCHAR(7),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Новая таблица columns создана');
    
    // Создаем индексы
    console.log('📊 Создаем индексы...');
    await pool.query('CREATE INDEX idx_columns_board_id ON columns(board_id)');
    await pool.query('CREATE INDEX idx_columns_position ON columns(position)');
    console.log('✅ Индексы созданы');
    
    // Показываем структуру новой таблицы
    console.log('\n📋 Структура новой таблицы columns:');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'columns' 
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });
    
    console.log('\n✅ Таблица columns успешно создана');
  } catch (error) {
    console.error('❌ Ошибка при создании таблицы columns:', error.message);
  } finally {
    await pool.end();
  }
}

createProperColumnsTable();