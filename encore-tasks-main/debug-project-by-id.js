const { Pool } = require('pg');

// Подключение к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function debugProjectById() {
  try {
    console.log('🔍 Отладка получения проекта по ID...');
    
    // Получаем все проекты
    const allProjects = await pool.query('SELECT * FROM projects ORDER BY created_at DESC LIMIT 3');
    console.log('\n📋 Последние 3 проекта:');
    allProjects.rows.forEach((project, index) => {
      console.log(`${index + 1}. ID: ${project.id}`);
      console.log(`   Название: ${project.name}`);
      console.log(`   Создатель: ${project.creator_id}`);
      console.log(`   Создан: ${project.created_at}`);
      console.log('');
    });
    
    if (allProjects.rows.length > 0) {
      const testProjectId = allProjects.rows[0].id;
      console.log(`🎯 Тестируем получение проекта с ID: ${testProjectId}`);
      
      // Тестируем прямой запрос
      const directQuery = await pool.query('SELECT * FROM projects WHERE id = $1', [testProjectId]);
      console.log('\n📊 Прямой запрос к БД:');
      console.log('Найдено записей:', directQuery.rows.length);
      if (directQuery.rows.length > 0) {
        console.log('Данные проекта:', directQuery.rows[0]);
      }
      
      // Проверяем права доступа
      const accessQuery = await pool.query(
        `SELECT p.*, pm.user_id as member_id 
         FROM projects p 
         LEFT JOIN project_members pm ON p.id = pm.project_id 
         WHERE p.id = $1`,
        [testProjectId]
      );
      console.log('\n🔐 Проверка прав доступа:');
      console.log('Найдено записей:', accessQuery.rows.length);
      accessQuery.rows.forEach((row, index) => {
        console.log(`${index + 1}. Проект: ${row.name}, Создатель: ${row.creator_id}, Участник: ${row.member_id || 'нет'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

debugProjectById();