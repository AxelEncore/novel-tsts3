const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_xcT4uktYV6OK@ep-odd-glade-aemzigu2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function removeDuplicates() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Removing exact duplicate columns...\n');
    
    await client.query('BEGIN');
    
    // Find exact duplicates (same board_id, title, color, position)
    const duplicatesQuery = `
      WITH duplicates AS (
        SELECT 
          id,
          board_id,
          title,
          color,
          position,
          ROW_NUMBER() OVER (PARTITION BY board_id, title, color, position ORDER BY created_at) as rn
        FROM columns
      )
      SELECT id, board_id, title, color, position
      FROM duplicates 
      WHERE rn > 1
    `;
    
    const duplicatesResult = await client.query(duplicatesQuery);
    
    if (duplicatesResult.rowCount > 0) {
      console.log(`Found ${duplicatesResult.rowCount} exact duplicate columns to remove:`);
      
      for (const dup of duplicatesResult.rows) {
        console.log(`  🗑️ Removing duplicate: "${dup.title}" (Board: ${dup.board_id})`);
        
        // Delete the duplicate
        await client.query('DELETE FROM columns WHERE id = $1', [dup.id]);
      }
      
      console.log(`\n✅ Removed ${duplicatesResult.rowCount} duplicate columns`);
    } else {
      console.log('ℹ️ No exact duplicate columns found');
    }
    
    await client.query('COMMIT');
    
    // Show final clean state
    console.log('\n🔍 Final clean column state:');
    const finalResult = await client.query(`
      SELECT 
        c.title,
        c.color,
        c.position,
        b.name as board_name
      FROM columns c
      JOIN boards b ON c.board_id = b.id
      ORDER BY b.name, c.position
    `);
    
    let currentBoard = '';
    for (const column of finalResult.rows) {
      if (currentBoard !== column.board_name) {
        currentBoard = column.board_name;
        console.log(`\n📋 Board: ${currentBoard}`);
      }
      
      console.log(`  📝 "${column.title}" | Color: ${column.color} | Position: ${column.position}`);
    }
    
    console.log('\n✅ All duplicate columns removed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error removing duplicates:', error.message);
  } finally {
    client.release();
  }
}

removeDuplicates().then(() => {
  pool.end();
}).catch((error) => {
  console.error('❌ Script error:', error.message);
  pool.end();
});