const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Подключение к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function createTestUserAndSession() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to PostgreSQL');
    
    const userId = crypto.randomUUID();
    const email = 'test@example.com';
    const name = 'Test User';
    const role = 'user';
    const passwordHash = crypto.createHash('sha256').update('password123').digest('hex');
    
    // Создаем пользователя если не существует
    const userResult = await client.query(
      `INSERT INTO users (id, email, name, role, password_hash, approval_status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 'approved', NOW(), NOW()) 
       ON CONFLICT (id) DO UPDATE SET 
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         approval_status = 'approved'
       RETURNING *`,
      [userId, email, name, role, passwordHash]
    );
    
    console.log('User created/updated:', userResult.rows[0]);
    
    // Создаем JWT токен
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        userId: userId, 
        email: email, 
        role: role, 
        approved: true 
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    console.log('Generated JWT token:', token);
    
    // Создаем сессию
    const sessionResult = await client.query(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       ON CONFLICT (token) DO UPDATE SET 
         expires_at = EXCLUDED.expires_at,
         updated_at = NOW()
       RETURNING *`,
      [
        crypto.randomUUID(),
        userId,
        token,
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа
      ]
    );
    
    console.log('Session created/updated:', sessionResult.rows[0]);
    
    // Проверяем общее количество пользователей
    const countResult = await client.query('SELECT COUNT(*) FROM users');
    console.log('Total users in database:', countResult.rows[0].count);
    
    // Проверяем общее количество сессий
    const sessionCountResult = await client.query('SELECT COUNT(*) FROM sessions');
    console.log('Total sessions in database:', sessionCountResult.rows[0].count);
    
    console.log('\n=== Test credentials ===');
    console.log('User ID:', userId);
    console.log('Email:', email);
    console.log('JWT Token:', token);
    console.log('========================');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
    console.log('Connection closed');
  }
}

createTestUserAndSession();