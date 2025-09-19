const { Pool } = require('pg');

async function testDirectDB() {
  console.log('🔗 Тест прямого подключения к БД...');
  
  const config = {
    connectionString: 'postgresql://neondb_owner:npg_xcT4uktYV6OK@ep-odd-glade-aemzigu2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
  };
  
  const pool = new Pool(config);
  
  try {
    console.log('📊 Проверка подключения к БД...');
    const client = await pool.connect();
    
    console.log('📋 Получение всех проектов из БД...');
    const projectsResult = await client.query('SELECT * FROM projects ORDER BY created_at DESC');
    
    console.log('📋 Количество проектов в БД:', projectsResult.rows.length);
    
    if (projectsResult.rows.length > 0) {
      console.log('📂 Последние проекты:');
      projectsResult.rows.slice(0, 3).forEach(project => {
        console.log(`  - ${project.name} (ID: ${project.id.substring(0, 8)}...)`);
      });
    }
    
    // Проверим структуру таблицы проектов
    console.log('\n🏗️ Структура таблицы projects:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Создадим тестовый проект напрямую в БД
    console.log('\n➕ Создание тестового проекта через БД...');
    const { v4: uuidv4 } = require('uuid');
    const testProjectId = uuidv4();
    
    const insertResult = await client.query(`
      INSERT INTO projects (id, name, description, creator_id, color, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [
      testProjectId,
      'Тестовый проект БД',
      'Проект создан напрямую в БД',
      '95592c8d-91f7-4c12-a39e-f872df6ef848', // ID админа
      '#FF5733'
    ]);
    
    console.log('✅ Проект создан:', insertResult.rows[0].name);
    
    // Проверим, что проект действительно сохранился
    console.log('\n🔍 Проверка сохранения проекта...');
    const checkResult = await client.query('SELECT * FROM projects WHERE id = $1', [testProjectId]);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Проект найден в БД после создания');
      console.log('📊 Данные проекта:', {
        id: checkResult.rows[0].id.substring(0, 8) + '...',
        name: checkResult.rows[0].name,
        description: checkResult.rows[0].description
      });
    } else {
      console.log('❌ Проект НЕ найден в БД после создания!');
    }
    
    client.release();
    console.log('\n🎯 Тест завершен успешно');
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка теста БД:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

testDirectDB().then(success => {
  console.log(`\n🏁 Результат теста БД: ${success ? 'УСПЕХ' : 'НЕУДАЧА'}`);
  process.exit(success ? 0 : 1);
});