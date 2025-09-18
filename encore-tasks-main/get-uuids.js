const { Client } = require('pg');

async function getUUIDs() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'encore_tasks',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    // Get existing projects
    const projects = await client.query('SELECT id, name FROM projects LIMIT 3');
    console.log('\nProjects:');
    projects.rows.forEach(p => console.log(`  ${p.id} - ${p.name}`));
    
    // Get existing boards
    const boards = await client.query('SELECT id, name, project_id FROM boards LIMIT 3');
    console.log('\nBoards:');
    boards.rows.forEach(b => console.log(`  ${b.id} - ${b.name} (project: ${b.project_id})`));
    
    // Check columns table structure
    const columnsInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'columns' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    console.log('\nColumns table structure:');
    columnsInfo.rows.forEach(col => console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`));
    
    // Get existing columns
    const columns = await client.query('SELECT id, title, board_id FROM columns LIMIT 3');
    console.log('\nColumns:');
    columns.rows.forEach(c => console.log(`  ${c.id} - ${c.title} (board: ${c.board_id})`));
    
    if (columns.rows.length > 0) {
      console.log(`\nFirst column ID: ${columns.rows[0].id} (type: ${typeof columns.rows[0].id})`);
    }
    
    // Check tasks table structure
    const tasksInfo = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    console.log('\nTasks table structure:');
    tasksInfo.rows.forEach(col => console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`));
    
    // Get existing tasks
    const tasks = await client.query('SELECT id, title, column_id FROM tasks LIMIT 3');
    console.log('\nTasks:');
    tasks.rows.forEach(t => console.log(`  ${t.id} - ${t.title} (column: ${t.column_id})`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

getUUIDs();