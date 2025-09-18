const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/encore_tasks';

async function checkSessionsTable() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Проверяем структуру таблицы sessions
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' 
      ORDER BY ordinal_position
    `;
    
    const structureResult = await client.query(structureQuery);
    console.log('\n📋 Структура таблицы sessions:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Проверяем индексы
    const indexQuery = `
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'sessions'
    `;
    
    const indexResult = await client.query(indexQuery);
    console.log('\n🔍 Индексы таблицы sessions:');
    if (indexResult.rows.length === 0) {
      console.log('  - Индексы не найдены');
    } else {
      indexResult.rows.forEach(row => {
        console.log(`  - ${row.indexname}: ${row.indexdef}`);
      });
    }
    
    // Проверяем ограничения
    const constraintQuery = `
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'sessions'
    `;
    
    const constraintResult = await client.query(constraintQuery);
    console.log('\n🔒 Ограничения таблицы sessions:');
    if (constraintResult.rows.length === 0) {
      console.log('  - Ограничения не найдены');
    } else {
      constraintResult.rows.forEach(row => {
        console.log(`  - ${row.constraint_name}: ${row.constraint_type}`);
      });
    }
    
    // Проверяем существующие записи
    const dataQuery = 'SELECT COUNT(*) as count FROM sessions';
    const dataResult = await client.query(dataQuery);
    console.log(`\n📊 Количество записей в sessions: ${dataResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ Соединение закрыто');
  }
}

checkSessionsTable();