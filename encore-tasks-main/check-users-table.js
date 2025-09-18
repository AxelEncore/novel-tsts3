const { Pool } = require('pg');
require('dotenv').config();

async function checkUsersTable() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔍 Проверка структуры таблицы users...');
    
    // Получаем структуру таблицы users
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Структура таблицы users:');
    console.table(result.rows);
    
    // Проверяем есть ли столбец username
    const hasUsername = result.rows.some(row => row.column_name === 'username');
    console.log(`\n🔍 Столбец username существует: ${hasUsername ? '✅ Да' : '❌ Нет'}`);
    
    if (!hasUsername) {
      console.log('\n💡 Возможные альтернативы для отображения имени пользователя:');
      const nameColumns = result.rows.filter(row => 
        row.column_name.includes('name') || 
        row.column_name.includes('email')
      );
      nameColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке таблицы users:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();