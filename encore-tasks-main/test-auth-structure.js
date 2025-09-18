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

async function testAuthStructure() {
  try {
    console.log('=== Тестирование структуры аутентификации ===');
    
    // 1. Проверяем структуру таблицы users
    console.log('\n1. Структура таблицы users:');
    const usersStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.table(usersStructure.rows);
    
    // 2. Получаем тестового пользователя
    console.log('\n2. Получение тестового пользователя:');
    const userResult = await pool.query(
      'SELECT id, email, name, role, approval_status FROM users WHERE email = $1',
      ['axelencore@mail.ru']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Пользователь axelencore@mail.ru не найден');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('Пользователь найден:', user);
    console.log('Тип поля id:', typeof user.id);
    console.log('Значение id:', user.id);
    console.log('String(user.id):', String(user.id));
    
    // 3. Проверяем структуру таблицы sessions
    console.log('\n3. Структура таблицы sessions:');
    const sessionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' 
      ORDER BY ordinal_position
    `);
    console.table(sessionsStructure.rows);
    
    // 4. Получаем активные сессии пользователя
    console.log('\n4. Активные сессии пользователя:');
    const sessionsResult = await pool.query(
      'SELECT token, user_id, created_at, expires_at FROM sessions WHERE user_id = $1',
      [user.id]
    );
    console.log('Найдено сессий:', sessionsResult.rows.length);
    if (sessionsResult.rows.length > 0) {
      console.log('Последняя сессия:', {
        user_id: sessionsResult.rows[0].user_id,
        user_id_type: typeof sessionsResult.rows[0].user_id,
        token_preview: sessionsResult.rows[0].token.substring(0, 20) + '...',
        expires_at: sessionsResult.rows[0].expires_at
      });
    }
    
    // 5. Создаем тестовый JWT токен
    console.log('\n5. Создание тестового JWT токена:');
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const testPayload = {
      userId: String(user.id),
      email: user.email,
      role: user.role
    };
    
    const testToken = jwt.sign(testPayload, jwtSecret, { expiresIn: '24h' });
    console.log('JWT payload:', testPayload);
    console.log('JWT token создан:', testToken.substring(0, 30) + '...');
    
    // 6. Декодируем токен обратно
    console.log('\n6. Декодирование JWT токена:');
    const decoded = jwt.verify(testToken, jwtSecret);
    console.log('Декодированный payload:', {
      userId: decoded.userId,
      userId_type: typeof decoded.userId,
      email: decoded.email,
      role: decoded.role
    });
    
    // 7. Проверяем соответствие типов
    console.log('\n7. Проверка соответствия типов:');
    console.log('user.id из БД:', user.id, '(тип:', typeof user.id, ')');
    console.log('String(user.id):', String(user.id), '(тип:', typeof String(user.id), ')');
    console.log('decoded.userId:', decoded.userId, '(тип:', typeof decoded.userId, ')');
    console.log('Соответствие String(user.id) === decoded.userId:', String(user.id) === decoded.userId);
    
    if (sessionsResult.rows.length > 0) {
      const sessionUserId = sessionsResult.rows[0].user_id;
      console.log('session.user_id:', sessionUserId, '(тип:', typeof sessionUserId, ')');
      console.log('Соответствие decoded.userId === session.user_id:', decoded.userId === String(sessionUserId));
    }
    
    console.log('\n✅ Тест структуры аутентификации завершен');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error);
  } finally {
    await pool.end();
  }
}

testAuthStructure();