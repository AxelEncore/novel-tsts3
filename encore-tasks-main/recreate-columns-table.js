const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function recreateColumnsTable() {
  try {
    console.log('🔍 Пересоздание таблицы columns...');
    
    // Удаляем все ограничения внешних ключей
    console.log('🔗 Удаляем все ограничения внешних ключей...');
    await pool.query('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_column_id_fkey');
    console.log('✅ Ограничения удалены');
    
    // Очищаем column_id в tasks
    console.log('🧹 Очищаем column_id в таблице tasks...');
    await pool.query('UPDATE tasks SET column_id = NULL');
    console.log('✅ column_id очищен');
    
    // Удаляем все существующие таблицы columns
    console.log('🗑️ Удаляем все таблицы columns...');
    await pool.query('DROP TABLE IF EXISTS board_columns CASCADE');
    await pool.query('DROP TABLE IF EXISTS columns CASCADE');
    console.log('✅ Таблицы удалены');
    
    // Создаем правильную таблицу columns (используем стандартное имя)
    console.log('➕ Создаем таблицу columns...');
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
    console.log('✅ Таблица columns создана');
    
    // Создаем индексы
    console.log('📊 Создаем индексы...');
    await pool.query('CREATE INDEX idx_columns_board_id ON columns(board_id)');
    await pool.query('CREATE INDEX idx_columns_position ON columns(position)');
    console.log('✅ Индексы созданы');
    
    // Добавляем ограничение внешнего ключа обратно
    console.log('🔗 Добавляем ограничение внешнего ключа...');
    await pool.query('ALTER TABLE tasks ADD CONSTRAINT tasks_column_id_fkey FOREIGN KEY (column_id) REFERENCES columns(id)');
    console.log('✅ Ограничение добавлено');
    
    // Показываем структуру новой таблицы
    console.log('\n📋 Структура таблицы columns:');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'columns' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });
    
    console.log('\n✅ Таблица columns успешно пересоздана');
  } catch (error) {
    console.error('❌ Ошибка при пересоздании таблицы columns:', error.message);
  } finally {
    await pool.end();
  }
}

recreateColumnsTable();