const Database = require('better-sqlite3');

const db = new Database('./database.sqlite');

try {
  // Проверяем существующую структуру таблицы sessions
  console.log('📊 Текущая структура таблицы sessions:');
  const tableInfo = db.prepare("PRAGMA table_info(sessions)").all();
  console.log(tableInfo);
  
  // Проверяем, есть ли уже поле token
  const hasTokenColumn = tableInfo.some(column => column.name === 'token');
  
  if (hasTokenColumn) {
    console.log('✅ Поле token уже существует в таблице sessions');
  } else {
    console.log('➕ Добавляем поле token в таблицу sessions...');
    db.exec('ALTER TABLE sessions ADD COLUMN token TEXT');
    console.log('✅ Поле token успешно добавлено!');
    
    // Проверяем обновленную структуру
    console.log('📊 Обновленная структура таблицы sessions:');
    const updatedTableInfo = db.prepare("PRAGMA table_info(sessions)").all();
    console.log(updatedTableInfo);
  }
  
} catch (error) {
  console.error('❌ Ошибка при добавлении поля token:', error.message);
} finally {
  db.close();
  console.log('🔒 База данных закрыта');
}