const { Pool } = require('pg');

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function applyMigration() {
  try {
    console.log('🔧 Применяем миграцию для таблицы boards...');
    
    // Добавляем поле color
    console.log('📝 Добавляем поле color...');
    await pool.query(`ALTER TABLE boards ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6'`);
    
    // Добавляем поле created_by
    console.log('📝 Добавляем поле created_by...');
    await pool.query(`ALTER TABLE boards ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)`);
    
    // Обновляем существующие записи
    console.log('📝 Обновляем существующие записи...');
    const updateResult = await pool.query(`
      UPDATE boards 
      SET created_by = (
        SELECT id FROM users LIMIT 1
      ) 
      WHERE created_by IS NULL
    `);
    
    console.log(`✅ Обновлено записей: ${updateResult.rowCount}`);
    
    // Проверяем результат
    console.log('🔍 Проверяем обновленную структуру...');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'boards' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Обновленная структура таблицы boards:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
    console.log('\n✅ Миграция успешно применена!');
    
  } catch (error) {
    console.error('❌ Ошибка при применении миграции:', error.message);
  } finally {
    await pool.end();
  }
}

applyMigration();