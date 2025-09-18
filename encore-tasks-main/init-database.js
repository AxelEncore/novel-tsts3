const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read the PostgreSQL schema file
    const schemaPath = path.join(__dirname, 'database', 'postgresql_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing PostgreSQL schema...');
    
    // Split SQL by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await pool.query(statement);
        console.log(`✓ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠ Skipped (already exists): ${statement.substring(0, 50)}...`);
        } else {
          console.error(`✗ Error in statement ${i + 1}:`, error.message);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log('\nDatabase initialization completed!');
    
    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\nCreated tables:');
    tablesResult.rows.forEach(row => {
      console.log('- ' + row.table_name);
    });
    
    // Check if users table exists and has the right structure
    if (tablesResult.rows.some(row => row.table_name === 'users')) {
      console.log('\nUsers table structure:');
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      
      columnsResult.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Create admin user
      console.log('\nCreating admin user...');
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('Ad580dc6axelencore', 12);
      
      try {
        // Check if admin user already exists
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1',
          ['axelencore@mail.ru']
        );
        
        if (existingUser.rows.length > 0) {
          // Update existing user
          await pool.query(`
            UPDATE users SET
              password_hash = $1,
              role = $2,
              name = $3
            WHERE email = $4
          `, [passwordHash, 'ADMIN', 'Admin User', 'axelencore@mail.ru']);
          
          console.log('✓ Admin user updated successfully');
        } else {
          // Create new user
          await pool.query(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
          `, ['Admin User', 'axelencore@mail.ru', passwordHash, 'ADMIN']);
          
          console.log('✓ Admin user created successfully');
        }
        
        // Show admin user info
        const adminUser = await pool.query(
          'SELECT id, email, name, role FROM users WHERE email = $1',
          ['axelencore@mail.ru']
        );
        
        console.log('Admin user info:', adminUser.rows[0]);
        
      } catch (error) {
        console.error('✗ Error creating admin user:', error.message);
      }
    } else {
      console.log('\n✗ Users table was not created!');
    }
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await pool.end();
  }
}

initDatabase();