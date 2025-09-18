const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function updateUserPassword() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'encore_tasks',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });
  
  try {
    console.log('🔌 Подключение к PostgreSQL...');
    
    // Хешируем пароль
    const password = 'Ad580dc6axelencore';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔐 Обновление пароля для пользователя axelencore@mail.ru...');
    
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email',
      [hashedPassword, 'axelencore@mail.ru']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Пароль успешно обновлен для пользователя:', result.rows[0].email);
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔑 Пароль:', password);
    } else {
      console.log('❌ Пользователь не найден');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
    console.log('🔌 Соединение закрыто');
  }
}

updateUserPassword().catch(console.error);