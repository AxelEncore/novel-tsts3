const { Client } = require('pg');
require('dotenv').config();

async function testCreateColumnDirect() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Get a real user ID
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      throw new Error('No users found in database');
    }
    const userId = userResult.rows[0].id;
    console.log('Using user ID:', userId);

    // Get a real project ID
    const projectResult = await client.query('SELECT id FROM projects LIMIT 1');
    if (projectResult.rows.length === 0) {
      throw new Error('No projects found in database');
    }
    const projectId = projectResult.rows[0].id;
    console.log('Using project ID:', projectId);

    // Create a test board first
    const boardResult = await client.query(`
      INSERT INTO boards (name, description, project_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['Test Board for Column', 'Test board description', projectId, userId]);
    
    const boardId = boardResult.rows[0].id;
    console.log('Created test board with ID:', boardId);

    // Now test creating a column directly with SQL
    console.log('\nTesting column creation with direct SQL...');
    
    const columnResult = await client.query(`
      INSERT INTO columns (name, board_id, position, color)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, ['Test Column', boardId, 0, '#3B82F6']);
    
    const column = columnResult.rows[0];
    console.log('✅ Column created successfully:', column);

    // Clean up
    await client.query('DELETE FROM columns WHERE board_id = $1', [boardId]);
    await client.query('DELETE FROM boards WHERE id = $1', [boardId]);
    console.log('\n🧹 Cleanup completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

testCreateColumnDirect();