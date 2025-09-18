const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Получаем данные администратора
    const result = await pool.query(
      'SELECT id, email, password_hash, role, approval_status FROM users WHERE email = $1',
      ['axelencore@mail.ru']
    );

    if (result.rows.length === 0) {
      console.log('❌ Администратор не найден');
      return;
    }

    const admin = result.rows[0];
    console.log('👤 Данные администратора:');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Role:', admin.role);
    console.log('  Approval status:', admin.approval_status);
    console.log('  Password hash:', admin.password_hash ? admin.password_hash.substring(0, 30) + '...' : 'null');

    // Проверяем пароль
    const testPassword = 'Ad580dc6axelencore';
    const isValid = await bcrypt.compare(testPassword, admin.password_hash);
    console.log('\n🔐 Проверка пароля:');
    console.log('  Тестовый пароль:', testPassword);
    console.log('  Пароль корректен:', isValid);

    if (!isValid) {
      console.log('\n🔧 Создаем новый хеш пароля...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('  Новый хеш:', newHash);
      
      // Обновляем пароль
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [newHash, 'axelencore@mail.ru']
      );
      console.log('✅ Пароль администратора обновлен');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

checkAdmin();