const { Pool } = require('pg');
require('dotenv').config();

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'encore_tasks',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function addEstimatedHoursColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Подключение к PostgreSQL базе данных...');
    console.log(`📍 База данных: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Проверяем существование столбца estimated_hours
    console.log('\n🔍 Проверка существования столбца estimated_hours в таблице tasks...');
    
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
        AND column_name = 'estimated_hours' 
        AND table_schema = 'public'
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length > 0) {
      console.log('⚠️  Столбец estimated_hours уже существует в таблице tasks');
    } else {
      console.log('➕ Добавление столбца estimated_hours в таблицу tasks...');
      
      // Добавляем столбец estimated_hours
      const addColumnQuery = `
        ALTER TABLE tasks 
        ADD COLUMN estimated_hours DECIMAL(10,2)
      `;
      
      await client.query(addColumnQuery);
      console.log('✅ Столбец estimated_hours успешно добавлен!');
    }
    
    // Проверяем также столбец actual_hours
    console.log('\n🔍 Проверка существования столбца actual_hours в таблице tasks...');
    
    const checkActualHoursQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
        AND column_name = 'actual_hours' 
        AND table_schema = 'public'
    `;
    
    const actualHoursExists = await client.query(checkActualHoursQuery);
    
    if (actualHoursExists.rows.length > 0) {
      console.log('⚠️  Столбец actual_hours уже существует в таблице tasks');
    } else {
      console.log('➕ Добавление столбца actual_hours в таблицу tasks...');
      
      // Добавляем столбец actual_hours
      const addActualHoursQuery = `
        ALTER TABLE tasks 
        ADD COLUMN actual_hours DECIMAL(10,2)
      `;
      
      await client.query(addActualHoursQuery);
      console.log('✅ Столбец actual_hours успешно добавлен!');
    }
    
    // Получаем и выводим структуру таблицы tasks
    console.log('\n📋 Текущая структура таблицы tasks:');
    
    const tableStructureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    const structure = await client.query(tableStructureQuery);
    
    console.log('\n| Столбец | Тип данных | Nullable | По умолчанию |');
    console.log('|---------|------------|----------|--------------|');
    
    structure.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'Да' : 'Нет';
      const defaultValue = row.column_default || 'NULL';
      console.log(`| ${row.column_name} | ${row.data_type} | ${nullable} | ${defaultValue} |`);
    });
    
    console.log('\n🎉 Миграция завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении миграции:', error.message);
    
    if (error.code) {
      console.error(`   Код ошибки PostgreSQL: ${error.code}`);
    }
    
    if (error.detail) {
      console.error(`   Детали: ${error.detail}`);
    }
    
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Запускаем миграцию
addEstimatedHoursColumn().catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});