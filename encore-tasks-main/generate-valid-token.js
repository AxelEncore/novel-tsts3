const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Создаем валидный токен для пользователя admin
const payload = {
  userId: '3a028dd5-5327-457a-b8d4-11c7e2c706ce', // ID пользователя из логов
  email: 'axelencore@mail.ru',
  role: 'admin',
  name: 'Admin User'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Сгенерированный валидный JWT токен:');
console.log(token);
console.log('\n📋 Payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n🔐 Секретный ключ:', JWT_SECRET);

// Проверяем токен
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\n✅ Токен валиден!');
  console.log('📋 Декодированные данные:');
  console.log(JSON.stringify(decoded, null, 2));
} catch (error) {
  console.log('\n❌ Ошибка проверки токена:', error.message);
}