const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkTables() {
  try {
    console.log('🔍 Проверка существующих таблиц...');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Существующие таблицы:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Проверим структуру таблицы columns если она существует
    const columnsCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'columns'
    `);
    
    if (columnsCheck.rows.length > 0) {
      console.log('\n📋 Структура таблицы columns:');
      const columnsStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'columns' 
        ORDER BY ordinal_position
      `);
      
      columnsStructure.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('\n❌ Таблица columns не существует');
    }
    
    console.log('\n✅ Проверка завершена');
  } catch (error) {
    console.error('❌ Ошибка при проверке таблиц:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();