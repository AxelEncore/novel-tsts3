const Database = require('better-sqlite3');

const db = new Database('database.db');

try {
  console.log('Добавляем недостающие колонки в таблицу projects...');
  
  // Добавляем колонки по одной, игнорируя ошибки если колонка уже существует
  try {
    db.exec('ALTER TABLE projects ADD COLUMN creator_id TEXT');
    console.log('✓ Добавлена колонка creator_id');
  } catch (e) {
    console.log('- Колонка creator_id уже существует');
  }
  
  try {
    db.exec('ALTER TABLE projects ADD COLUMN color TEXT');
    console.log('✓ Добавлена колонка color');
  } catch (e) {
    console.log('- Колонка color уже существует');
  }
  
  try {
    db.exec('ALTER TABLE projects ADD COLUMN telegram_chat_id TEXT');
    console.log('✓ Добавлена колонка telegram_chat_id');
  } catch (e) {
    console.log('- Колонка telegram_chat_id уже существует');
  }
  
  try {
    db.exec('ALTER TABLE projects ADD COLUMN telegram_topic_id TEXT');
    console.log('✓ Добавлена колонка telegram_topic_id');
  } catch (e) {
    console.log('- Колонка telegram_topic_id уже существует');
  }
  
  // Обновляем существующие записи
  const updateResult = db.exec('UPDATE projects SET creator_id = owner_id WHERE creator_id IS NULL');
  console.log('✓ Обновлены существующие записи');
  
  // Проверяем структуру таблицы
  const columns = db.prepare('PRAGMA table_info(projects)').all();
  console.log('\nТекущая структура таблицы projects:');
  columns.forEach(col => {
    console.log(`- ${col.name}: ${col.type}`);
  });
  
  console.log('\nМиграция завершена успешно!');
  
} catch (error) {
  console.error('Ошибка при выполнении миграции:', error);
} finally {
  db.close();
}