const { Client } = require('pg');
require('dotenv').config();

// Конфигурация подключения к PostgreSQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'encore_tasks',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

async function addDeadlineColumn() {
  const client = new Client(dbConfig);
  
  try {
    console.log('🔌 Подключение к PostgreSQL базе данных...');
    console.log(`📍 Хост: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`🗄️ База данных: ${dbConfig.database}`);
    console.log(`👤 Пользователь: ${dbConfig.user}`);
    
    await client.connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Проверяем существует ли столбец deadline в таблице tasks
    console.log('\n🔍 Проверка существования столбца deadline в таблице tasks...');
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
        AND column_name = 'deadline' 
        AND table_schema = 'public';
    `;
    
    const columnResult = await client.query(checkColumnQuery);
    
    if (columnResult.rows.length > 0) {
      console.log('ℹ️ Столбец deadline уже существует в таблице tasks');
    } else {
      console.log('➕ Столбец deadline не найден. Добавляем...');
      
      // Добавляем столбец deadline как TIMESTAMP WITH TIME ZONE
      const addColumnQuery = `
        ALTER TABLE tasks 
        ADD COLUMN deadline TIMESTAMP WITH TIME ZONE;
      `;
      
      await client.query(addColumnQuery);
      console.log('✅ Столбец deadline успешно добавлен в таблицу tasks');
    }
    
    // Выводим информацию о структуре таблицы tasks после изменений
    console.log('\n📋 Структура таблицы tasks после изменений:');
    const tableStructureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(tableStructureQuery);
    
    console.log('\n┌─────────────────────┬─────────────────────────┬─────────────┬─────────────────────┐');
    console.log('│ Столбец             │ Тип данных              │ Nullable    │ По умолчанию        │');
    console.log('├─────────────────────┼─────────────────────────┼─────────────┼─────────────────────┤');
    
    structureResult.rows.forEach(row => {
      const columnName = row.column_name.padEnd(19);
      const dataType = row.data_type.padEnd(23);
      const nullable = row.is_nullable.padEnd(11);
      const defaultValue = (row.column_default || 'NULL').padEnd(19);
      
      console.log(`│ ${columnName} │ ${dataType} │ ${nullable} │ ${defaultValue} │`);
    });
    
    console.log('└─────────────────────┴─────────────────────────┴─────────────┴─────────────────────┘');
    
    console.log('\n🎉 Операция завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при выполнении операции:');
    console.error('📝 Детали ошибки:', error.message);
    
    if (error.code) {
      console.error('🔢 Код ошибки:', error.code);
    }
    
    if (error.detail) {
      console.error('🔍 Подробности:', error.detail);
    }
    
    // Проверяем наиболее частые причины ошибок
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Возможные причины:');
      console.error('   - PostgreSQL сервер не запущен');
      console.error('   - Неверный хост или порт в конфигурации');
      console.error('   - Проблемы с сетевым подключением');
    } else if (error.code === '28P01') {
      console.error('\n💡 Возможные причины:');
      console.error('   - Неверное имя пользователя или пароль');
      console.error('   - Пользователь не имеет прав доступа к базе данных');
    } else if (error.code === '3D000') {
      console.error('\n💡 Возможные причины:');
      console.error('   - База данных не существует');
      console.error('   - Неверное имя базы данных в конфигурации');
    }
    
    process.exit(1);
  } finally {
    try {
      await client.end();
      console.log('🔌 Соединение с базой данных закрыто');
    } catch (closeError) {
      console.error('⚠️ Ошибка при закрытии соединения:', closeError.message);
    }
  }
}

// Запускаем скрипт
if (require.main === module) {
  console.log('🚀 Запуск скрипта добавления столбца deadline в таблицу tasks');
  console.log('=' .repeat(60));
  addDeadlineColumn();
}

module.exports = { addDeadlineColumn };