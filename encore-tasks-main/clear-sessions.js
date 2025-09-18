const { Pool } = require('pg');

// Настройки подключения к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function clearSessions() {
  try {
    console.log('Подключение к базе данных...');
    const client = await pool.connect();
    
    console.log('Очистка всех сессий...');
    // Проверим, какие таблицы существуют
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%session%'");
    console.log('Найденные таблицы с сессиями:', tables.rows);
    
    if (tables.rows.length > 0) {
      const tableName = tables.rows[0].table_name;
      console.log(`Очищаем таблицу: ${tableName}`);
      const result = await client.query(`DELETE FROM ${tableName}`);
      console.log(`Удалено сессий: ${result.rowCount}`);
    } else {
       console.log('Таблицы сессий не найдены');
     }
    
    client.release();
    console.log('Сессии успешно очищены!');
  } catch (error) {
    console.error('Ошибка при очистке сессий:', error);
  } finally {
    await pool.end();
  }
}

clearSessions();