const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/encore_tasks'
});

async function checkSchema() {
  try {
    await client.connect();
    console.log('✅ Подключение к PostgreSQL успешно');
    
    // Проверяем структуру таблицы projects
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Структура таблицы projects:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Проверяем несколько записей
    console.log('\n📊 Примеры данных:');
    const dataResult = await client.query('SELECT * FROM projects LIMIT 3');
    console.log('Количество проектов:', dataResult.rows.length);
    dataResult.rows.forEach((project, index) => {
      console.log(`${index + 1}. ID: ${project.id}`);
      console.log(`   Название: ${project.name}`);
      console.log(`   Описание: ${project.description || 'нет'}`);
      console.log(`   Создан: ${project.created_at}`);
      console.log(`   Автор: ${project.created_by}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Соединение закрыто');
  }
}

checkSchema().catch(console.error);