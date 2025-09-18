const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkTasksStructure() {
  try {
    console.log('🔍 Проверка структуры таблицы tasks...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Текущие столбцы таблицы tasks:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });
    
    console.log('\n✅ Проверка завершена');
  } catch (error) {
    console.error('❌ Ошибка при проверке структуры:', error.message);
  } finally {
    await pool.end();
  }
}

checkTasksStructure();