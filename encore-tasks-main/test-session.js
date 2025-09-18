const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function testSession() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzZDJiOWQ0NC1lNzFlLTQ1NTAtYmY5MS0zNmZhYzE4Y2JmZGIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImFwcHJvdmVkIjp0cnVlLCJpYXQiOjE3NTgxNDAwODAsImV4cCI6MTc1ODIyNjQ4MH0.D3niblJeyka9gPeS-b6NcvLRMggAlFUG8chTZVnfUd4';
  
  try {
    console.log('Testing session lookup...');
    
    const query = `
      SELECT s.*, u.id as user_id, u.email, u.name, u.role, u.approval_status
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = $1 AND s.expires_at > NOW()
    `;
    
    const result = await pool.query(query, [token]);
    
    console.log('Session found:', result.rows.length > 0);
    if (result.rows.length > 0) {
      const session = result.rows[0];
      console.log('Session data:', {
        session_id: session.id,
        user_id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
        approval_status: session.approval_status,
        expires_at: session.expires_at
      });
    } else {
      console.log('No session found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testSession();