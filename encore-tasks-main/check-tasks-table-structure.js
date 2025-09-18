const { Client } = require('pg');
require('dotenv').config();

async function checkTasksTableStructure() {
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

    // Check tasks table structure
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('\nTasks table structure:');
    console.table(structureResult.rows);

    // Check existing tasks
    const tasksResult = await client.query('SELECT * FROM tasks LIMIT 5');
    console.log('\nExisting tasks in table:');
    console.table(tasksResult.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

checkTasksTableStructure();