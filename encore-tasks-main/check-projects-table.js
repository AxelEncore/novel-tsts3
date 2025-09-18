const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkProjectsTable() {
  try {
    console.log('🔍 Проверяем структуру таблицы projects...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы projects:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Также проверим несколько записей
    const dataResult = await pool.query('SELECT * FROM projects LIMIT 3');
    console.log('\n📊 Примеры данных:');
    dataResult.rows.forEach((row, index) => {
      console.log(`Запись ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

checkProjectsTable();