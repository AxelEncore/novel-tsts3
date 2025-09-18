const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkUsers() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'encore_tasks',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });
  
  try {
    console.log('🔌 Подключение к PostgreSQL...');
    
    // Проверим подключение
    const client = await pool.connect();
    console.log('✅ Подключение успешно!');
    client.release();
    
    console.log('👥 Получение списка пользователей...');
    const usersResult = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    const users = usersResult.rows;
    
    console.log(`📊 Найдено пользователей: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n📝 Список пользователей:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Имя: ${user.name}`);
        console.log(`   Роль: ${user.role}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Пароль (хеш): ${user.password ? user.password.substring(0, 20) + '...' : 'НЕТ'}`);
        console.log(`   Создан: ${user.created_at}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ Пользователи не найдены');
      
      console.log('\n➕ Создание тестового администратора...');
      const hashedPassword = await bcrypt.hash('Ad580dc6axelencore', 10);
      
      const insertResult = await pool.query(`
        INSERT INTO users (name, email, password, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id
      `, ['Admin', 'admin@example.com', hashedPassword, 'admin']);
      
      console.log('✅ Администратор создан с ID:', insertResult.rows[0].id);
    }
    
    // Проверим также проекты
    console.log('\n📋 Проверка проектов...');
    const projectsResult = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    const projects = projectsResult.rows;
    
    console.log(`📊 Найдено проектов: ${projects.length}`);
    
    if (projects.length > 0) {
      console.log('\n📝 Список проектов:');
      projects.forEach((project, index) => {
        console.log(`${index + 1}. Название: ${project.name}`);
        console.log(`   ID: ${project.id}`);
        console.log(`   Владелец: ${project.owner_id || 'НЕ УКАЗАН'}`);
        console.log(`   Создан: ${project.created_at}`);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Соединение закрыто');
  }
}

checkUsers().catch(console.error);