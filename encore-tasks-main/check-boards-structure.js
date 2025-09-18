require('dotenv').config();
const { Client } = require('pg');

async function checkBoardsStructure() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Подключение к базе данных установлено');

    // Проверяем структуру таблицы boards
    console.log('\n📋 Проверка структуры таблицы boards:');
    const boardsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'boards' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Структура таблицы boards:');
    boardsStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Проверяем структуру таблицы columns
    console.log('\n📋 Проверка структуры таблицы columns:');
    const columnsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'columns' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Структура таблицы columns:');
    columnsStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Проверяем есть ли пользователи
    console.log('\n👥 Проверка существующих пользователей:');
    const usersCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`Количество пользователей: ${usersCount.rows[0].count}`);
    
    if (usersCount.rows[0].count > 0) {
      const sampleUsers = await client.query('SELECT id, name, email FROM users LIMIT 3');
      console.log('Примеры пользователей:');
      sampleUsers.rows.forEach(user => {
        console.log(`  ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }

    // Проверяем есть ли проекты
    console.log('\n🏗️ Проверка существующих проектов:');
    const projectsCount = await client.query('SELECT COUNT(*) as count FROM projects');
    console.log(`Количество проектов: ${projectsCount.rows[0].count}`);
    
    if (projectsCount.rows[0].count > 0) {
      const sampleProjects = await client.query('SELECT id, name, created_by FROM projects LIMIT 3');
      console.log('Примеры проектов:');
      sampleProjects.rows.forEach(project => {
        console.log(`  ID: ${project.id}, Name: ${project.name}, Created by: ${project.created_by}`);
      });
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке структуры:', error.message);
    console.error('Детали ошибки:', error);
  } finally {
    await client.end();
  }
}

checkBoardsStructure();