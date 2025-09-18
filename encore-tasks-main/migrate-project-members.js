const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== Migrating project_members table ===');
  
  // Check current schema
  const info = db.prepare('PRAGMA table_info(project_members)').all();
  const hasJoinedAt = info.some(col => col.name === 'joined_at');
  
  if (hasJoinedAt) {
    console.log('joined_at column already exists!');
  } else {
    console.log('Adding joined_at column...');
    
    // Add joined_at column
    db.exec('ALTER TABLE project_members ADD COLUMN joined_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    
    console.log('✅ joined_at column added successfully!');
  }
  
  // Verify the changes
  console.log('\n=== Updated schema ===');
  const updatedInfo = db.prepare('PRAGMA table_info(project_members)').all();
  updatedInfo.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  db.close();
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}