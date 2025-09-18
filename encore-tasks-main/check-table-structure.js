const { Pool } = require('pg');
require('dotenv').config();

async function checkTableStructure() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'encore_tasks',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });
  
  try {
    console.log('🔌 Подключение к PostgreSQL...');
    
    // Проверим структуру таблицы users
    console.log('📋 Структура таблицы users:');
    const usersStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    if (usersStructure.rows.length > 0) {
      usersStructure.rows.forEach((column, index) => {
        console.log(`${index + 1}. ${column.column_name} (${column.data_type}) - Nullable: ${column.is_nullable}`);
      });
    } else {
      console.log('❌ Таблица users не найдена');
    }
    
    // Проверим структуру таблицы projects
    console.log('\n📋 Структура таблицы projects:');
    const projectsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    if (projectsStructure.rows.length > 0) {
      projectsStructure.rows.forEach((column, index) => {
        console.log(`${index + 1}. ${column.column_name} (${column.data_type}) - Nullable: ${column.is_nullable}`);
      });
    } else {
      console.log('❌ Таблица projects не найдена');
    }
    
    // Покажем все таблицы в базе
    console.log('\n📊 Все таблицы в базе данных:');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    tables.rows.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Соединение закрыто');
  }
}

checkTableStructure().catch(console.error);