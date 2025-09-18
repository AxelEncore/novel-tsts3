const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function addMissingColumns() {
  try {
    console.log('🔍 Добавление недостающих столбцов в таблицу tasks...');
    
    // Проверяем существование столбца assignee_id
    const checkAssigneeId = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'assignee_id'
    `);
    
    if (checkAssigneeId.rows.length === 0) {
      console.log('➕ Добавляем столбец assignee_id...');
      await pool.query(`
        ALTER TABLE tasks 
        ADD COLUMN assignee_id UUID REFERENCES users(id)
      `);
      console.log('✅ Столбец assignee_id добавлен');
    } else {
      console.log('ℹ️ Столбец assignee_id уже существует');
    }
    
    // Проверяем существование столбца created_by
    const checkCreatedBy = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'created_by'
    `);
    
    if (checkCreatedBy.rows.length === 0) {
      console.log('➕ Добавляем столбец created_by...');
      await pool.query(`
        ALTER TABLE tasks 
        ADD COLUMN created_by UUID REFERENCES users(id)
      `);
      console.log('✅ Столбец created_by добавлен');
    } else {
      console.log('ℹ️ Столбец created_by уже существует');
    }
    
    // Копируем данные из reporter_id в created_by если created_by пустой
    console.log('🔄 Копируем данные из reporter_id в created_by...');
    await pool.query(`
      UPDATE tasks 
      SET created_by = reporter_id 
      WHERE created_by IS NULL
    `);
    console.log('✅ Данные скопированы');
    
    // Показываем обновленную структуру
    console.log('\n📋 Обновленная структура таблицы tasks:');
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      ORDER BY ordinal_position
    `);
    
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n✅ Миграция завершена успешно');
  } catch (error) {
    console.error('❌ Ошибка при добавлении столбцов:', error.message);
  } finally {
    await pool.end();
  }
}

addMissingColumns();