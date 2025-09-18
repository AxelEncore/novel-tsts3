const fetch = require('node-fetch');
const { Pool } = require('pg');

// Конфигурация базы данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function testProjectUpdate() {
  try {
    console.log('🔍 Тестирование обновления проекта...');
    
    // 1. Получаем токен аутентификации
    const authResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'axelencore@mail.ru',
        password: 'Ad580dc6axelencore'
      })
    });
    
    const authData = await authResponse.json();
    console.log('📋 Полный ответ аутентификации:', authData);
    console.log('📊 Статус аутентификации:', authResponse.status);
    
    if (!authData.token) {
      throw new Error('Не удалось получить токен аутентификации');
    }
    
    const token = authData.token;
    
    // 2. Создаем тестовый проект
    const createResponse = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Update Project',
        description: 'Проект для тестирования обновления',
        color: '#FF5733'
      })
    });
    
    const createData = await createResponse.json();
    console.log('✅ Проект создан:', createData);
    
    if (!createData.success) {
      throw new Error('Не удалось создать проект');
    }
    
    const projectId = createData.data.id;
    console.log('📝 ID проекта:', projectId);
    
    // 3. Проверяем структуру таблицы projects
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Структура таблицы projects:');
    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // 4. Пытаемся обновить проект
    console.log('\n🔄 Попытка обновления проекта...');
    
    const updateData = {
      name: 'Updated Test Project',
      description: 'Обновленное описание проекта'
    };
    
    console.log('📤 Данные для обновления:', updateData);
    
    const updateResponse = await fetch(`http://localhost:3000/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('📊 Статус ответа:', updateResponse.status);
    
    const updateResult = await updateResponse.json();
    console.log('📋 Результат обновления:', updateResult);
    
    // 5. Проверяем проект в базе данных
    const dbCheck = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    console.log('\n🗄️ Проект в базе данных:', dbCheck.rows[0]);
    
    // 6. Удаляем тестовый проект
    await fetch(`http://localhost:3000/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('🗑️ Тестовый проект удален');
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

testProjectUpdate();