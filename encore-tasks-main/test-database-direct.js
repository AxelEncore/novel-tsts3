const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Настройки подключения к базе данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

const JWT_SECRET = 'your-secret-key-here';

// Функция для создания токена
function createToken(userId, email) {
  return jwt.sign(
    {
      userId,
      email,
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(7)
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Функция для проверки базы данных
async function checkDatabase() {
  try {
    console.log('🔍 Проверка базы данных напрямую...');
    
    // 1. Проверяем подключение к БД
    const client = await pool.connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // 2. Проверяем существующие проекты
    const existingProjects = await client.query('SELECT * FROM projects ORDER BY created_at DESC LIMIT 5');
    console.log(`📊 Найдено проектов в БД (последние 5): ${existingProjects.rows.length}`);
    
    if (existingProjects.rows.length > 0) {
      console.log('\n📋 Последние проекты:');
      existingProjects.rows.forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.name} (ID: ${project.id}, Creator: ${project.creator_id})`);
        console.log(`      Создан: ${project.created_at}`);
      });
    }
    
    // 3. Получаем пользователя axelencore@mail.ru
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', ['axelencore@mail.ru']);
    if (userResult.rows.length === 0) {
      console.log('❌ Пользователь axelencore@mail.ru не найден');
      client.release();
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`\n👤 Найден пользователь: ${user.email} (ID: ${user.id})`);
    
    // 4. Создаем новый проект напрямую в БД
    const projectName = `Тест БД ${new Date().toLocaleTimeString()}`;
    console.log(`\n🆕 Создание нового проекта: ${projectName}`);
    
    const createResult = await client.query(
      `INSERT INTO projects (name, description, creator_id, color, icon, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [projectName, 'Тестовый проект для проверки БД', user.id, '#3B82F6', '📋']
    );
    
    const newProject = createResult.rows[0];
    console.log('✅ Проект создан в БД:', {
      id: newProject.id,
      name: newProject.name,
      creator_id: newProject.creator_id
    });
    
    // 5. Проверяем, что проект действительно сохранился
    const verifyResult = await client.query('SELECT * FROM projects WHERE id = $1', [newProject.id]);
    if (verifyResult.rows.length > 0) {
      console.log('✅ Проект подтвержден в БД');
    } else {
      console.log('❌ Проект не найден в БД после создания');
    }
    
    // 6. Проверяем проекты пользователя через SQL запрос как в API
    const userProjectsResult = await client.query(
      `SELECT DISTINCT p.* FROM projects p 
       LEFT JOIN project_members pm ON p.id = pm.project_id 
       WHERE (p.creator_id = $1 OR pm.user_id = $1) 
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [user.id]
    );
    
    console.log(`\n📊 Проекты пользователя через SQL (последние 10): ${userProjectsResult.rows.length}`);
    userProjectsResult.rows.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name} (ID: ${project.id})`);
    });
    
    // 7. Тестируем API endpoint с токеном
    const token = createToken(user.id, user.email);
    console.log(`\n🔑 Создан токен для API: ${token.substring(0, 50)}...`);
    
    const apiResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`\n🌐 API ответ: ${apiResponse.status}`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API работает корректно');
      console.log(`📊 Проектов через API: ${apiData.data?.projects?.length || 0}`);
      
      if (apiData.data?.projects) {
        console.log('\n📋 Проекты через API (первые 5):');
        apiData.data.projects.slice(0, 5).forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.name} (ID: ${project.id})`);
        });
        
        // Проверяем, есть ли наш новый проект в API ответе
        const foundNewProject = apiData.data.projects.find(p => p.id === newProject.id);
        if (foundNewProject) {
          console.log('\n✅ Новый проект найден в API ответе!');
        } else {
          console.log('\n❌ Новый проект НЕ найден в API ответе!');
        }
      }
    } else {
      const errorData = await apiResponse.text();
      console.log('❌ API ошибка:', errorData);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Ошибка при проверке базы данных:', error);
  } finally {
    await pool.end();
  }
}

// Запуск проверки
checkDatabase().then(() => {
  console.log('\n🏁 Проверка завершена');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});