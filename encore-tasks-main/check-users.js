const { Pool } = require('pg');

// Настройки подключения к базе данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function checkUsers() {
  try {
    console.log('🔍 Проверка пользователей в базе данных...');
    
    const client = await pool.connect();
    
    // Получаем всех пользователей
    const usersResult = await client.query('SELECT * FROM users ORDER BY created_at DESC');
    console.log(`👥 Найдено пользователей: ${usersResult.rows.length}`);
    
    if (usersResult.rows.length > 0) {
      console.log('\n📋 Список пользователей:');
      usersResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
        console.log(`      Имя: ${user.username || 'не указано'}`);
        console.log(`      Создан: ${user.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Пользователи не найдены');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Ошибка при проверке пользователей:', error);
  } finally {
    await pool.end();
  }
}

checkUsers().then(() => {
  console.log('🏁 Проверка завершена');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});