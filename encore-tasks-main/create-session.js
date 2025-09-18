const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/encore_tasks'
});

async function createSession() {
  try {
    const userId = 'a18e90af-3374-464a-a020-d0492838eb45';
    const sessionId = uuidv4();
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMThlOTBhZi0zMzc0LTQ2NGEtYTAyMC1kMDQ5MjgzOGViNDUiLCJlbWFpbCI6ImF4ZWxlbmNvcmVAbWFpbC5ydSIsInJvbGUiOiJhZG1pbiIsIm5hbWUiOiJBZG1pbiBVc2VyIiwiaWF0IjoxNzU3OTY1NDM0LCJleHAiOjE3NTgwNTE4MzR9.5xAi_TVWMBdOHvCLU0HprED2atTwQNfODtqH-gIects';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    console.log('Создаем сессию для пользователя:', userId);
    
    const result = await pool.query(
      'INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [sessionId, userId, token, expiresAt]
    );
    
    console.log('Сессия создана:', result.rows[0]);
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

createSession();