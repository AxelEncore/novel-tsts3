const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
console.log('Подключение к базе данных:', dbPath);

const db = new Database(dbPath);

try {
  console.log('Добавление колонки settings в таблицу tasks...');
  
  // Добавляем settings
  try {
    db.prepare('ALTER TABLE tasks ADD COLUMN settings TEXT').run();
    console.log('✅ Добавлена колонка settings');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️ Колонка settings уже существует');
    } else {
      throw error;
    }
  }
  
  // Проверяем обновленную схему
  console.log('\n=== ОБНОВЛЕННАЯ СХЕМА ТАБЛИЦЫ TASKS ===');
  const tasksSchema = db.prepare("PRAGMA table_info(tasks)").all();
  console.log('Колонки таблицы tasks:');
  tasksSchema.forEach(col => {
    console.log(`- ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  console.log('\n✅ Миграция завершена успешно!');
  
} catch (error) {
  console.error('❌ Ошибка при добавлении колонки:', error);
} finally {
  db.close();
}