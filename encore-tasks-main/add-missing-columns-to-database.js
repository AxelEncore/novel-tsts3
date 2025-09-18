const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'database.sqlite');
console.log('Подключение к базе данных:', dbPath);

const db = new Database(dbPath);

try {
  console.log('Добавление недостающих колонок в таблицу tasks...');
  
  // Добавляем board_id
  try {
    db.prepare('ALTER TABLE tasks ADD COLUMN board_id TEXT').run();
    console.log('✅ Добавлена колонка board_id');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️ Колонка board_id уже существует');
    } else {
      throw error;
    }
  }
  
  // Добавляем project_id
  try {
    db.prepare('ALTER TABLE tasks ADD COLUMN project_id TEXT').run();
    console.log('✅ Добавлена колонка project_id');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️ Колонка project_id уже существует');
    } else {
      throw error;
    }
  }
  
  // Добавляем reporter_id
  try {
    db.prepare('ALTER TABLE tasks ADD COLUMN reporter_id TEXT').run();
    console.log('✅ Добавлена колонка reporter_id');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('⚠️ Колонка reporter_id уже существует');
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
  console.error('❌ Ошибка при добавлении колонок:', error);
} finally {
  db.close();
}