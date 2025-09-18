// Скрипт для очистки кэша Node.js модулей
console.log('🧹 Очистка кэша Node.js модулей...');

// Очищаем require кэш
Object.keys(require.cache).forEach(function(key) {
  delete require.cache[key];
});

console.log('✅ Кэш очищен');

// Перезагружаем переменные окружения
require('dotenv').config();

console.log('🔄 Переменные окружения перезагружены');
console.log('DB_NAME:', process.env.DB_NAME);

// Тестируем создание нового адаптера
try {
  const { PostgreSQLAdapter } = require('./src/lib/postgresql-adapter.ts');
  
  // Сбрасываем Singleton
  PostgreSQLAdapter.instance = null;
  
  const adapter = PostgreSQLAdapter.getInstance();
  console.log('🔧 Новый адаптер создан');
  console.log('📊 Конфигурация адаптера:', {
    database: adapter.pool?.options?.database || 'неизвестно'
  });
} catch (error) {
  console.log('⚠️ Ошибка при создании адаптера:', error.message);
  console.log('🔄 Это нормально для TypeScript файлов в Node.js');
}