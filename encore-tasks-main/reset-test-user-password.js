const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');

async function resetPassword() {
  console.log('🔧 Сброс пароля для пользователя test@example.com...');
  
  const dbPath = 'database.sqlite';
  
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Файл database.sqlite не найден');
    return;
  }
  
  console.log(`📁 Используется файл базы данных: ${dbPath}`);
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    // Найдем пользователя test@example.com
    db.get(
      "SELECT * FROM users WHERE email = ?",
      ['test@example.com'],
      async (err, user) => {
        if (err) {
          console.error('❌ Ошибка при поиске пользователя:', err.message);
          reject(err);
          return;
        }
        
        if (!user) {
          console.error('❌ Пользователь test@example.com не найден');
          reject(new Error('User not found'));
          return;
        }
        
        console.log(`👤 Пользователь найден: ID=${user.id}, Email=${user.email}`);
        console.log(`🔐 Текущий хеш пароля: ${user.password_hash}`);
        
        // Проверим текущий пароль
        const isCurrentPasswordValid = user.password_hash ? bcrypt.compareSync('test123', user.password_hash) : false;
        console.log(`🔍 Текущий пароль 'test123' валиден: ${isCurrentPasswordValid}`);
        
        if (!isCurrentPasswordValid) {
          // Создаем новый хеш пароля с теми же параметрами что используются в приложении
          console.log('🔧 Создание нового хеша пароля...');
          const newPasswordHash = bcrypt.hashSync('test123', 12);
          console.log(`🔐 Новый хеш пароля: ${newPasswordHash}`);
          
          // Обновляем пароль в базе данных
          db.run(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            [newPasswordHash, new Date().toISOString(), user.id],
            function(err) {
              if (err) {
                console.error('❌ Ошибка при обновлении пароля:', err.message);
                reject(err);
                return;
              }
              
              console.log('✅ Пароль успешно обновлен');
              
              // Проверим что новый пароль работает
              const isNewPasswordValid = bcrypt.compareSync('test123', newPasswordHash);
              console.log(`🔍 Новый пароль 'test123' валиден: ${isNewPasswordValid}`);
              
              console.log('\n🎉 Данные для входа:');
              console.log('📧 Email: test@example.com');
              console.log('🔑 Пароль: test123');
              
              db.close();
              resolve();
            }
          );
        } else {
          console.log('✅ Текущий пароль уже валиден');
          console.log('\n🎉 Данные для входа:');
          console.log('📧 Email: test@example.com');
          console.log('🔑 Пароль: test123');
          
          db.close();
          resolve();
        }
      }
    );
  });
}

resetPassword().catch(console.error);