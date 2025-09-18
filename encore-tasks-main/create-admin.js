const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true'
});

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const email = 'axelencore@mail.ru';
    const password = 'Ad580dc6axelencore';
    const name = 'Admin User';
    const role = 'admin';
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Check if admin user already exists
    const existingUser = await pool.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists, updating...');
      
      // Update existing user
      await pool.query(`
        UPDATE users SET
          password_hash = $1,
          role = $2,
          name = $3,
          approval_status = 'approved'
        WHERE email = $4
      `, [passwordHash, role, name, email]);
      
      console.log('✅ Admin user updated successfully');
    } else {
      console.log('Creating new admin user...');
      
      // Create new user
      await pool.query(`
        INSERT INTO users (name, email, password_hash, role, approval_status)
        VALUES ($1, $2, $3, $4, 'approved')
      `, [name, email, passwordHash, role]);
      
      console.log('✅ Admin user created successfully');
    }
    
    // Show admin user info
    const adminUser = await pool.query(
      'SELECT id, email, name, role, approval_status, created_at FROM users WHERE email = $1',
      [email]
    );
    
    console.log('\n👤 Admin user info:');
    const user = adminUser.rows[0];
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Name: ${user.name}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Status: ${user.approval_status}`);
    console.log(`  - Created: ${user.created_at}`);
    
    console.log('\n🔐 Login credentials:');
    console.log(`  - Email: ${email}`);
    console.log(`  - Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();