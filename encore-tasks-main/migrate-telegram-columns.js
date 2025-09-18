const Database = require('better-sqlite3');
const fs = require('fs');

try {
  const db = new Database('./database.sqlite');
  
  console.log('Adding telegram columns to projects table...');
  
  // Add telegram_chat_id column
  try {
    db.exec('ALTER TABLE projects ADD COLUMN telegram_chat_id TEXT');
    console.log('✓ Added telegram_chat_id column');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✓ telegram_chat_id column already exists');
    } else {
      throw err;
    }
  }
  
  // Add telegram_topic_id column
  try {
    db.exec('ALTER TABLE projects ADD COLUMN telegram_topic_id TEXT');
    console.log('✓ Added telegram_topic_id column');
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✓ telegram_topic_id column already exists');
    } else {
      throw err;
    }
  }
  
  // Verify the changes
  console.log('\nVerifying table structure:');
  const rows = db.prepare('PRAGMA table_info(projects)').all();
  rows.forEach(row => {
    console.log(`  ${row.name}: ${row.type}`);
  });
  
  // Check if telegram columns exist
  const hasTelegramChatId = rows.some(row => row.name === 'telegram_chat_id');
  const hasTelegramTopicId = rows.some(row => row.name === 'telegram_topic_id');
  
  console.log('\nTelegram columns check:');
  console.log(`  telegram_chat_id: ${hasTelegramChatId ? 'EXISTS' : 'MISSING'}`);
  console.log(`  telegram_topic_id: ${hasTelegramTopicId ? 'EXISTS' : 'MISSING'}`);
  
  if (hasTelegramChatId && hasTelegramTopicId) {
    console.log('\n🎉 Migration completed successfully!');
  } else {
    console.log('\n❌ Migration failed - some columns are still missing');
  }
  
  db.close();
  
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}