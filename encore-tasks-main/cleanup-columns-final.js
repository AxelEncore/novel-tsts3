const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_xcT4uktYV6OK@ep-odd-glade-aemzigu2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function cleanupColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting final column cleanup...\n');
    
    await client.query('BEGIN');
    
    // 1. Delete all "Беклог" columns
    console.log('🗑️ Removing "Беклог" columns...');
    const backlogResult = await client.query(`
      DELETE FROM columns 
      WHERE title = 'Беклог' OR title LIKE '%еклог%'
      RETURNING id, title, board_id
    `);
    
    if (backlogResult.rowCount > 0) {
      console.log(`   ✅ Removed ${backlogResult.rowCount} backlog columns`);
    } else {
      console.log('   ℹ️ No backlog columns found to remove');
    }
    
    // 2. Fix duplicate columns by keeping the one with correct colors and removing others
    console.log('\n🔧 Fixing duplicate columns...');
    
    // Find boards with duplicate columns
    const duplicatesResult = await client.query(`
      SELECT board_id, title, COUNT(*) as count
      FROM columns 
      GROUP BY board_id, title 
      HAVING COUNT(*) > 1
    `);
    
    for (const dup of duplicatesResult.rows) {
      console.log(`   📋 Board ${dup.board_id} has ${dup.count} columns with title "${dup.title}"`);
      
      // Keep the column with the correct color for each status
      const correctColors = {
        'К выполнению': '#6B7280',     // gray
        'На выполнение': '#6B7280',     // gray (alternative name)
        'В работе': '#3B82F6',          // blue
        'В процессе': '#3B82F6',        // blue (alternative name)
        'На проверке': '#8B5CF6',       // purple
        'Выполнено': '#10B981',         // green
        'Отложено': '#F59E0B'           // orange
      };
      
      const correctColor = correctColors[dup.title];
      if (correctColor) {
        // Delete duplicates that don't have the correct color
        const deleteResult = await client.query(`
          DELETE FROM columns 
          WHERE board_id = $1 AND title = $2 AND color != $3
        `, [dup.board_id, dup.title, correctColor]);
        
        console.log(`     ✅ Removed ${deleteResult.rowCount} duplicate columns with incorrect colors`);
        
        // Update remaining column to ensure it has the correct color
        await client.query(`
          UPDATE columns 
          SET color = $3
          WHERE board_id = $1 AND title = $2
        `, [dup.board_id, dup.title, correctColor]);
        
        console.log(`     ✅ Updated remaining column color to ${correctColor}`);
      }
    }
    
    // 3. Ensure all boards have the correct 5 status columns with proper names and colors
    console.log('\n📝 Ensuring all boards have correct status columns...');
    
    const requiredColumns = [
      { title: 'К выполнению', color: '#6B7280', position: 0 },  // todo - gray
      { title: 'В процессе', color: '#3B82F6', position: 1 },   // in_progress - blue  
      { title: 'На проверке', color: '#8B5CF6', position: 2 },   // review - purple
      { title: 'Выполнено', color: '#10B981', position: 3 },     // done - green
      { title: 'Отложено', color: '#F59E0B', position: 4 }       // deferred - orange
    ];
    
    // Get all boards
    const boardsResult = await client.query('SELECT id, name FROM boards ORDER BY name');
    
    for (const board of boardsResult.rows) {
      console.log(`\n  📋 Processing board: ${board.name}`);
      
      // Check existing columns for this board
      const existingResult = await client.query(`
        SELECT title, color, position FROM columns 
        WHERE board_id = $1 
        ORDER BY position
      `, [board.id]);
      
      const existing = existingResult.rows;
      
      // Standardize column names (convert old names to new standard names)
      const nameMapping = {
        'К выполнению': 'К выполнению',
        'На выполнение': 'К выполнению',  // standardize
        'В работе': 'В процессе',         // standardize
        'В процессе': 'В процессе',
        'На проверке': 'На проверке',
        'Выполнено': 'Выполнено',
        'Отложено': 'Отложено'
      };
      
      // Update any columns that need name standardization
      for (const col of existing) {
        const standardName = nameMapping[col.title];
        if (standardName && standardName !== col.title) {
          await client.query(`
            UPDATE columns 
            SET title = $1 
            WHERE board_id = $2 AND title = $3
          `, [standardName, board.id, col.title]);
          console.log(`     ✏️  Renamed "${col.title}" to "${standardName}"`);
        }
      }
      
      // Get updated existing columns
      const updatedResult = await client.query(`
        SELECT title, color, position FROM columns 
        WHERE board_id = $1 
        ORDER BY position
      `, [board.id]);
      
      const existingTitles = updatedResult.rows.map(row => row.title);
      
      // Add missing columns
      for (const required of requiredColumns) {
        if (!existingTitles.includes(required.title)) {
          await client.query(`
            INSERT INTO columns (id, board_id, title, color, position, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
          `, [board.id, required.title, required.color, required.position]);
          console.log(`     ➕ Added missing column: ${required.title}`);
        }
      }
      
      // Update colors for existing columns to match the standard
      for (const required of requiredColumns) {
        await client.query(`
          UPDATE columns 
          SET color = $3, position = $4
          WHERE board_id = $1 AND title = $2
        `, [board.id, required.title, required.color, required.position]);
      }
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Final column cleanup completed successfully!');
    
    // Show final state
    console.log('\n🔍 Final column state:');
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
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    client.release();
  }
}

cleanupColumns().then(() => {
  pool.end();
}).catch((error) => {
  console.error('❌ Script error:', error.message);
  pool.end();
});