const fetch = require('node-fetch');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Конфигурация базы данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

async function testBoardAPIWithAuth() {
  try {
    console.log('=== Тестирование API создания доски с аутентификацией ===');
    
    // 1. Получаем пользователя и создаем валидную сессию
    console.log('\n1. Получение пользователя и создание сессии:');
    const userResult = await pool.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      ['axelencore@mail.ru']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('Пользователь найден:', { id: user.id, email: user.email, role: user.role });
    
    // 2. Создаем JWT токен
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const jwtToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });
    console.log('JWT токен создан:', jwtToken.substring(0, 30) + '...');
    
    // 3. Создаем сессию в базе данных
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) ON CONFLICT (token) DO NOTHING',
      [user.id, jwtToken, expiresAt]
    );
    console.log('Сессия создана в базе данных');
    
    // 4. Получаем или создаем проект
    console.log('\n2. Получение проекта:');
    let projectResult = await pool.query(
      'SELECT id, name FROM projects LIMIT 1'
    );
    
    let projectId;
    if (projectResult.rows.length === 0) {
      // Создаем тестовый проект
      const newProjectResult = await pool.query(
        'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING id, name',
        ['Test Project for Board API', 'Тестовый проект для API досок']
      );
      projectId = newProjectResult.rows[0].id;
      console.log('Создан новый проект:', newProjectResult.rows[0]);
    } else {
      projectId = projectResult.rows[0].id;
      console.log('Используется существующий проект:', projectResult.rows[0]);
    }
    
    // 5. Тестируем API создания доски
    console.log('\n3. Тестирование API создания доски:');
    const boardData = {
      name: 'Test Board API',
      description: 'Тестовая доска через API',
      color: '#FF5722'
    };
    
    console.log('Данные для создания доски:', boardData);
    console.log('URL:', `http://localhost:3000/api/projects/${projectId}/boards`);
    console.log('Токен (первые 30 символов):', jwtToken.substring(0, 30) + '...');
    
    const response = await fetch(`http://localhost:3000/api/projects/${projectId}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
        'Cookie': `auth-token=${jwtToken}`
      },
      body: JSON.stringify(boardData)
    });
    
    console.log('Статус ответа:', response.status);
    console.log('Заголовки ответа:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Тело ответа:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Парсированный ответ:', responseData);
    } catch (e) {
      console.log('Не удалось распарсить ответ как JSON');
    }
    
    // 6. Проверяем, была ли доска создана в базе данных
    console.log('\n4. Проверка создания доски в базе данных:');
    const boardsResult = await pool.query(
      'SELECT id, name, description, color, created_by, project_id FROM boards WHERE project_id = $1 ORDER BY created_at DESC LIMIT 5',
      [projectId]
    );
    
    console.log('Найдено досок в проекте:', boardsResult.rows.length);
    if (boardsResult.rows.length > 0) {
      console.log('Последние доски:');
      boardsResult.rows.forEach((board, index) => {
        console.log(`  ${index + 1}. ${board.name} (${board.color}) - создана: ${board.created_by}`);
      });
    }
    
    // 7. Проверяем логи сервера (если доступны)
    console.log('\n5. Результат тестирования:');
    if (response.status === 201 && responseData && responseData.id) {
      console.log('✅ API создания доски работает корректно');
      console.log('✅ Доска успешно создана:', responseData);
    } else if (response.status === 500) {
      console.log('❌ Сервер вернул ошибку 500');
      console.log('❌ Проблема на стороне сервера, нужно проверить логи');
    } else {
      console.log('❌ Неожиданный ответ от API');
      console.log('Статус:', response.status);
      console.log('Ответ:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await pool.end();
  }
}

testBoardAPIWithAuth();