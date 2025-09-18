const Database = require('better-sqlite3');
const path = require('path');

// Подключаемся к базе данных
const dbPath = path.join(process.cwd(), 'database.sqlite');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

try {
  // Проверяем текущую схему таблицы tasks
  console.log('\nТекущая схема таблицы tasks:');
  const schema = db.prepare("PRAGMA table_info(tasks)").all();
  console.log(schema);
  
  // Проверяем, есть ли уже колонка created_by
  const hasCreatedBy = schema.some(col => col.name === 'created_by');
  
  if (hasCreatedBy) {
    console.log('\nКолонка created_by уже существует!');
  } else {
    console.log('\nДобавляем колонку created_by...');
    
    // Добавляем колонку created_by
    db.exec(`
      ALTER TABLE tasks 
      ADD COLUMN created_by TEXT;
    `);
    
    console.log('✅ Колонка created_by успешно добавлена!');
  }
  
  // Показываем обновленную схему
  console.log('\nОбновленная схема таблицы tasks:');
  const updatedSchema = db.prepare("PRAGMA table_info(tasks)").all();
  console.log(updatedSchema);
  
} catch (error) {
  console.error('❌ Ошибка:', error.message);
} finally {
  db.close();
}