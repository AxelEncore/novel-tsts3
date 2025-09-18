const Database = require('better-sqlite3');
const path = require('path');

async function approveTestUser() {
  console.log('🔧 Одобрение тестового пользователя...');
  
  try {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new Database(dbPath);
    
    // Найдем тестовых пользователей
    const testUsers = db.prepare(`
      SELECT id, email, name, approval_status, created_at 
      FROM users 
      WHERE email LIKE '%test%@example.com'
      ORDER BY created_at DESC
    `).all();
    
    if (testUsers.length === 0) {
      console.log('❌ Тестовые пользователи не найдены');
      db.close();
      return;
    }
    
    console.log('👤 Найдены пользователи:');
    testUsers.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Одобрен: ${user.approval_status})`);
    });
    
    // Одобряем всех тестовых пользователей
    const updateStmt = db.prepare(`
      UPDATE users 
      SET approval_status = 1 
      WHERE email LIKE '%test%@example.com'
    `);
    
    const result = updateStmt.run();
    console.log(`✅ Обновлено пользователей: ${result.changes}`);
    
    // Проверяем результат
    const updatedUsers = db.prepare(`
      SELECT id, email, name, approval_status, created_at 
      FROM users 
      WHERE email LIKE '%test%@example.com'
      ORDER BY created_at DESC
    `).all();
    
    console.log('📊 Результат:');
    updatedUsers.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Одобрен: ${user.approval_status})`);
    });
    
    db.close();
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

approveTestUser();