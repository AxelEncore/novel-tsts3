const { Client } = require('pg');
require('dotenv').config();

async function checkColumnsTableStructure() {
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

    // Check columns table structure
    console.log('\nColumns table structure:');
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'columns' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(structureQuery);
    console.table(structureResult.rows);
    
    // Check if there are any existing columns
    const existingColumnsQuery = 'SELECT * FROM columns LIMIT 3';
    const existingResult = await client.query(existingColumnsQuery);
    console.log('\nExisting columns in table:');
    console.table(existingResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

checkColumnsTableStructure();