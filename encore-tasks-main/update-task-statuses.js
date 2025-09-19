require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: process.env.POSTGRES_SSL === 'true' || process.env.POSTGRES_SSL === 'require' 
    ? { rejectUnauthorized: false } 
    : false,
});

async function updateTaskStatuses() {
  let client;
  try {
    console.log('🔄 Обновление статусов задач в базе данных...');
    
    client = await pool.connect();
    
    // 1. Обновляем все задачи со статусом 'backlog' на 'todo'
    const updateBacklogTasks = `
      UPDATE tasks 
      SET status = 'todo' 
      WHERE status = 'backlog'
    `;
    
    const backlogResult = await client.query(updateBacklogTasks);
    console.log(`✅ Обновлено ${backlogResult.rowCount} задач со статуса 'backlog' на 'todo'`);
    
    // 2. Обновляем все задачи со статусом 'blocked' на 'deferred' 
    const updateBlockedTasks = `
      UPDATE tasks 
      SET status = 'deferred' 
      WHERE status = 'blocked'
    `;
    
    const blockedResult = await client.query(updateBlockedTasks);
    console.log(`✅ Обновлено ${blockedResult.rowCount} задач со статуса 'blocked' на 'deferred'`);
    
    // 3. Обновляем колонки с соответствующими статусами
    const updateBacklogColumns = `
      UPDATE columns 
      SET status = 'todo',
          name = REPLACE(REPLACE(name, 'Беклог', 'На выполнение'), 'Backlog', 'Todo')
      WHERE status = 'backlog' OR name ILIKE '%беклог%' OR name ILIKE '%backlog%'
    `;
    
    const columnsBacklogResult = await client.query(updateBacklogColumns);
    console.log(`✅ Обновлено ${columnsBacklogResult.rowCount} колонок с 'backlog' статусом`);
    
    const updateBlockedColumns = `
      UPDATE columns 
      SET status = 'deferred',
          name = REPLACE(name, 'Заблокировано', 'Отложено')
      WHERE status = 'blocked' OR name ILIKE '%заблокир%' OR name ILIKE '%blocked%'
    `;
    
    const columnsBlockedResult = await client.query(updateBlockedColumns);
    console.log(`✅ Обновлено ${columnsBlockedResult.rowCount} колонок с 'blocked' статусом`);
    
    // 4. Проверяем текущие статусы
    const checkTasks = `
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status 
      ORDER BY status
    `;
    
    const statusResult = await client.query(checkTasks);
    console.log('\n📊 Текущие статусы задач:');
    statusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} задач`);
    });
    
    const checkColumns = `
      SELECT status, COUNT(*) as count 
      FROM columns 
      WHERE status IS NOT NULL
      GROUP BY status 
      ORDER BY status
    `;
    
    const columnStatusResult = await client.query(checkColumns);
    console.log('\n📋 Статусы колонок:');
    columnStatusResult.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count} колонок`);
    });
    
    console.log('\n🎉 Обновление статусов завершено успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при обновлении статусов:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

updateTaskStatuses();