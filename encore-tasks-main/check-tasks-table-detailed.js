require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkTasksTableStructure() {
  try {
    console.log('Connecting to database...');
    
    // Get table structure
    const structureQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await pool.query(structureQuery);
    console.log('\nTasks table structure:');
    console.log('Column Name | Data Type | Nullable | Default');
    console.log('----------------------------------------');
    structureResult.rows.forEach(row => {
      console.log(`${row.column_name} | ${row.data_type} | ${row.is_nullable} | ${row.column_default || 'NULL'}`);
    });
    
    // Check if specific columns exist
    const columnNames = structureResult.rows.map(row => row.column_name);
    console.log('\nColumn existence check:');
    console.log('assignee_id exists:', columnNames.includes('assignee_id'));
    console.log('due_date exists:', columnNames.includes('due_date'));
    console.log('created_by exists:', columnNames.includes('created_by'));
    console.log('deadline exists:', columnNames.includes('deadline'));
    
    console.log('\nAll columns:', columnNames.join(', '));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    console.log('Database connection closed.');
  }
}

checkTasksTableStructure();