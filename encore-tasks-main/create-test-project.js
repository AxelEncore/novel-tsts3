const { Client } = require('pg');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/encore_tasks'
});

async function createTestProject() {
  try {
    await client.connect();
    console.log('✅ Подключение к PostgreSQL успешно');
    
    // Создаем новый проект
    const projectId = uuidv4();
    const userId = 'a18e90af-3374-464a-a020-d0492838eb45'; // ID администратора
    
    const result = await client.query(`
      INSERT INTO projects (id, name, description, creator_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [
      projectId,
      'Тестовый проект для проверки сохранения',
      'Проект создан для тестирования сохранения после обновления страницы',
      userId
    ]);
    
    console.log('✅ Проект успешно создан:');
    console.log('ID:', result.rows[0].id);
    console.log('Название:', result.rows[0].name);
    console.log('Описание:', result.rows[0].description);
    console.log('Создан:', result.rows[0].created_at);
    
    // Проверяем общее количество проектов
    const countResult = await client.query('SELECT COUNT(*) as count FROM projects');
    console.log('\n📊 Всего проектов в базе данных:', countResult.rows[0].count);
    
    // Проверяем последние 3 проекта
    console.log('\n📋 Последние 3 проекта:');
    const recentProjects = await client.query(`
      SELECT id, name, created_at 
      FROM projects 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    
    recentProjects.rows.forEach((project, index) => {
      console.log(`${index + 1}. ${project.name} (${project.created_at})`);
    });
    
    console.log('\n🎉 Тест создания проекта завершен успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка создания проекта:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Соединение с базой данных закрыто');
  }
}

createTestProject().catch(console.error);