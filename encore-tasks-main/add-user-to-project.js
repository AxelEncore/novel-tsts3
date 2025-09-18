const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Настройки подключения к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function addUserToProject() {
  const projectId = 'f8fc9392-1a68-4a31-aea5-5fd2612a6d3f'; // ID проекта (Main Project)
  const userId = 'a7395264-ae97-466d-8dd3-65410a7266aa'; // ID пользователя
  
  console.log('Adding user to project:');
  console.log('Project ID:', projectId);
  console.log('User ID:', userId);
  console.log('');

  try {
    // Проверяем, существует ли проект и получаем информацию о создателе
    const projectQuery = 'SELECT owner_id FROM projects WHERE id = $1';
    const projectResult = await pool.query(projectQuery, [projectId]);
    
    if (projectResult.rows.length === 0) {
      console.log('❌ Project not found!');
      return;
    }
    
    const project = projectResult.rows[0];
    console.log('✅ Project found:', project.name);
    console.log('Project creator:', project.owner_id);
    
    // Проверяем, существует ли пользователь
    const userResult = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found:', user.name, '(' + user.email + ')');
    console.log('User role:', user.role);
    
    // Проверяем, является ли пользователь уже участником проекта
    const membershipResult = await pool.query(
      'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (membershipResult.rows.length > 0) {
      console.log('✅ User is already a member of this project with role:', membershipResult.rows[0].role);
      return;
    }
    
    // Проверяем, является ли пользователь владельцем проекта
    if (project.owner_id === userId) {
      console.log('✅ User is the project owner, no need to add as member');
      return;
    }
    
    // Добавляем пользователя как участника проекта
    console.log('\n➕ Adding user as project member...');
    
    const memberId = uuidv4();
    const now = new Date().toISOString();
    
    await pool.query(
      `INSERT INTO project_members (id, project_id, user_id, role, permissions, joined_at, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        memberId,
        projectId,
        userId,
        'member',
        JSON.stringify({
          canCreateBoards: true,
          canEditProject: false,
          canManageMembers: false,
          canDeleteProject: false,
          canArchiveProject: false
        }),
        now,
        now,
        now
      ]
    );
    
    console.log('✅ User successfully added to project as member!');
    
    // Проверяем результат
    const verificationResult = await pool.query(
      'SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (verificationResult.rows.length > 0) {
      const membership = verificationResult.rows[0];
      console.log('\n✅ Verification successful:');
      console.log('- Member ID:', membership.id);
      console.log('- Role:', membership.role);
      console.log('- Joined at:', membership.joined_at);
      console.log('- Permissions:', membership.permissions);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

addUserToProject().catch(console.error);