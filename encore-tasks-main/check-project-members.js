const { Pool } = require('pg');

async function checkProjectMembers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Проверяем структуру таблицы project_members...');
    
    // Структура таблицы
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'project_members' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы project_members:');
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Данные в таблице
    const dataResult = await pool.query('SELECT * FROM project_members LIMIT 10');
    console.log('\n📊 Данные в таблице project_members:');
    console.log(dataResult.rows);
    
    // Проверяем последние созданные проекты
    const projectsResult = await pool.query(`
      SELECT p.id, p.name, p.owner_id, pm.user_id, pm.role
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    
    console.log('\n🏗️ Последние проекты и их участники:');
    projectsResult.rows.forEach(row => {
      console.log(`  Проект: ${row.name} (${row.id})`);
      console.log(`  Владелец: ${row.owner_id}`);
      console.log(`  Участник: ${row.user_id} (роль: ${row.role})`);
      console.log('  ---');
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
  }
}

checkProjectMembers();