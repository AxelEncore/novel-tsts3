const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Настройки подключения к базе данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// Функция для проверки сессий
async function checkSessions() {
  try {
    console.log('🔍 Проверка таблицы sessions...');
    
    const client = await pool.connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // 1. Проверяем структуру таблицы sessions
    try {
      const tableInfo = await client.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'sessions' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Структура таблицы sessions:');
      if (tableInfo.rows.length === 0) {
        console.log('❌ Таблица sessions не найдена');
        client.release();
        return;
      }
      
      tableInfo.rows.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } catch (error) {
      console.log('❌ Ошибка при получении структуры таблицы:', error.message);
    }
    
    // 2. Проверяем существующие сессии
    const existingSessions = await client.query('SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5');
    console.log(`\n📊 Найдено сессий в БД: ${existingSessions.rows.length}`);
    
    if (existingSessions.rows.length > 0) {
      console.log('\n📋 Последние сессии:');
      existingSessions.rows.forEach((session, index) => {
        console.log(`   ${index + 1}. User: ${session.user_id}`);
        console.log(`      Token: ${session.token?.substring(0, 50)}...`);
        console.log(`      Expires: ${session.expires_at}`);
        console.log(`      Created: ${session.created_at}`);
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
    console.log(`   Роль: ${user.role}`);
    console.log(`   Статус одобрения: ${user.approval_status}`);
    
    // 4. Создаем новую сессию
    const token = createToken(user.id, user.email);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
    
    console.log(`\n🔑 Создание новой сессии...`);
    console.log(`Token: ${token.substring(0, 50)}...`);
    
    // Удаляем старые сессии пользователя
    await client.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
    
    // Создаем новую сессию
    const sessionResult = await client.query(
      `INSERT INTO sessions (user_id, token, expires_at, created_at, updated_at) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [user.id, token, expiresAt]
    );
    
    const newSession = sessionResult.rows[0];
    console.log('✅ Сессия создана:', {
      user_id: newSession.user_id,
      expires_at: newSession.expires_at,
      created_at: newSession.created_at
    });
    
    // 5. Тестируем API с новой сессией
    console.log(`\n🌐 Тестирование API с новой сессией...`);
    
    const apiResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`API ответ: ${apiResponse.status}`);
    
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('✅ API работает корректно');
      console.log(`📊 Проектов через API: ${apiData.data?.projects?.length || 0}`);
      
      if (apiData.data?.projects && apiData.data.projects.length > 0) {
        console.log('\n📋 Проекты через API (первые 5):');
        apiData.data.projects.slice(0, 5).forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.name} (ID: ${project.id})`);
        });
      } else {
        console.log('\n⚠️ API вернул пустой список проектов');
      }
    } else {
      const errorData = await apiResponse.text();
      console.log('❌ API ошибка:', errorData);
    }
    
    // 6. Создаем новый проект через API
    console.log(`\n🆕 Создание нового проекта через API...`);
    
    const createResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `API Test Project ${new Date().toLocaleTimeString()}`,
        description: 'Тестовый проект через API',
        color: '#10B981',
        icon: '🚀'
      })
    });
    
    console.log(`Создание проекта: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Проект создан через API:', {
        id: createData.data?.project?.id,
        name: createData.data?.project?.name
      });
      
      // 7. Проверяем, что проект появился в списке
      console.log(`\n🔄 Повторная проверка списка проектов...`);
      
      const checkResponse = await fetch('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log(`📊 Проектов после создания: ${checkData.data?.projects?.length || 0}`);
        
        const newProject = checkData.data?.projects?.find(p => p.id === createData.data?.project?.id);
        if (newProject) {
          console.log('✅ Новый проект найден в списке!');
        } else {
          console.log('❌ Новый проект НЕ найден в списке!');
        }
      }
    } else {
      const createError = await createResponse.text();
      console.log('❌ Ошибка создания проекта:', createError);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Ошибка при проверке сессий:', error);
  } finally {
    await pool.end();
  }
}

// Запуск проверки
checkSessions().then(() => {
  console.log('\n🏁 Проверка завершена');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});