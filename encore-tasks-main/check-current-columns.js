const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_xcT4uktYV6OK@ep-odd-glade-aemzigu2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function checkColumns() {
  try {
    console.log('🔍 Checking current columns in database...\n');
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.board_id,
        c.title,
        c.color,
        c.position,
        b.name as board_name
      FROM columns c
      JOIN boards b ON c.board_id = b.id
      ORDER BY b.name, c.position
    `);
    
    console.log(`Found ${result.rows.length} columns:\n`);
    
    let currentBoard = '';
    for (const column of result.rows) {
      if (currentBoard !== column.board_name) {
        currentBoard = column.board_name;
        console.log(`📋 Board: ${currentBoard}`);
      }
      
      console.log(`  📝 Column: "${column.title}" | Color: ${column.color} | Position: ${column.position}`);
    }
    
    console.log('\n✅ Column check completed');
  } catch (error) {
    console.error('❌ Error checking columns:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();