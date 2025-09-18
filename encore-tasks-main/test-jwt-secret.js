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

// JWT секреты для тестирования
const JWT_SECRETS = [
  'your-jwt-secret-key-development',
  'your-secret-key',
  'development-secret',
  'encore-tasks-secret'
];

async function testJWTSecret() {
  try {
    console.log('=== Тест JWT секретов ===');
    
    // 1. Получаем существующий токен из базы данных
    console.log('\n1. Получение токена из базы данных:');
    const sessionResult = await pool.query(
      `SELECT s.token, s.user_id, u.email, u.role 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.expires_at > NOW() 
       ORDER BY s.created_at DESC 
       LIMIT 1`
    );
    
    if (sessionResult.rows.length === 0) {
      console.log('❌ Не найдено активных сессий');
      return;
    }
    
    const session = sessionResult.rows[0];
    console.log('Найдена активная сессия:', {
      user_id: session.user_id,
      email: session.email,
      role: session.role,
      token_preview: session.token.substring(0, 50) + '...'
    });
    
    // 2. Тестируем разные JWT секреты
    console.log('\n2. Тестирование JWT секретов:');
    let validSecret = null;
    let decodedToken = null;
    
    for (const secret of JWT_SECRETS) {
      try {
        const decoded = jwt.verify(session.token, secret);
        console.log(`✅ Секрет "${secret}" работает!`);
        console.log('Декодированный токен:', {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          iat: new Date(decoded.iat * 1000).toISOString(),
          exp: new Date(decoded.exp * 1000).toISOString()
        });
        validSecret = secret;
        decodedToken = decoded;
        break;
      } catch (error) {
        console.log(`❌ Секрет "${secret}" не работает: ${error.message}`);
      }
    }
    
    if (!validSecret) {
      console.log('\n❌ Ни один из тестируемых секретов не подошел!');
      console.log('Попробуем создать новый токен с текущим секретом...');
      
      // 3. Создаем новый токен с правильным секретом
      const currentSecret = 'your-jwt-secret-key-development';
      const newTokenPayload = {
        userId: session.user_id,
        email: session.email,
        role: session.role
      };
      
      const newToken = jwt.sign(newTokenPayload, currentSecret, { expiresIn: '7d' });
      console.log('\n3. Создание нового токена:');
      console.log('Новый токен создан:', newToken.substring(0, 50) + '...');
      
      // 4. Обновляем токен в базе данных
      const updateResult = await pool.query(
        'UPDATE sessions SET token = $1, expires_at = $2 WHERE user_id = $3',
        [newToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), session.user_id]
      );
      
      console.log('Токен обновлен в базе данных:', updateResult.rowCount > 0 ? '✅' : '❌');
      
      // 5. Проверяем новый токен
      try {
        const verifiedNew = jwt.verify(newToken, currentSecret);
        console.log('✅ Новый токен успешно проверен:', {
          userId: verifiedNew.userId,
          email: verifiedNew.email,
          role: verifiedNew.role
        });
        
        console.log('\n🎉 Проблема решена! Используйте новый токен для тестирования.');
        console.log('Новый токен:', newToken);
        
      } catch (error) {
        console.log('❌ Ошибка проверки нового токена:', error.message);
      }
      
    } else {
      console.log(`\n✅ Найден рабочий секрет: "${validSecret}"`);
      console.log('Проверьте, что в .env.local используется именно этот секрет.');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании JWT секретов:', error);
  } finally {
    await pool.end();
  }
}

testJWTSecret();