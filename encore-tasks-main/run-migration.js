const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Файл .env не найден!');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim().replace(/^[\"']|[\"']$/g, '');
      }
    }
  });
  
  return env;
}

async function runMigration() {
  const env = loadEnvFile();
  
  const config = {
    host: env.POSTGRES_HOST || 'localhost',
    port: parseInt(env.POSTGRES_PORT) || 5432,
    database: env.POSTGRES_DB || 'encore_tasks',
    user: env.POSTGRES_USER || 'postgres',
    password: env.POSTGRES_PASSWORD || ''
  };
  
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    console.log('✅ Подключение к PostgreSQL установлено');
    
    console.log('\n🔧 Выполнение миграции...');
    
    // Начинаем транзакцию
    await client.query('BEGIN');
    
    try {
      // Удаляем существующие данные из tasks (если есть)
      console.log('🗑️ Очистка таблицы tasks...');
      await client.query('DELETE FROM tasks');
      
      // Изменяем тип столбца project_id с integer на uuid
      console.log('🔄 Изменение типа project_id с integer на uuid...');
      await client.query('ALTER TABLE tasks ALTER COLUMN project_id TYPE uuid USING NULL');
      
      // Добавляем внешний ключ для связи с таблицей projects
      console.log('🔗 Добавление внешнего ключа...');
      await client.query(`
        ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project_id 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      `);
      
      // Подтверждаем транзакцию
      await client.query('COMMIT');
      console.log('✅ Миграция выполнена успешно!');
      
      // Проверяем результат
      console.log('\n📋 Проверка результата...');
      const result = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'project_id'
      `);
      
      if (result.rows.length > 0) {
        console.log(`✅ project_id теперь имеет тип: ${result.rows[0].data_type}`);
      }
      
    } catch (error) {
      // Откатываем транзакцию в случае ошибки
      await client.query('ROLLBACK');
      throw error;
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Ошибка миграции:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);