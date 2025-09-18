require('dotenv').config();
const { Client } = require('pg');

async function testColumnCreation() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    console.log('✅ Подключение к базе данных установлено');

    // Проверяем структуру таблицы columns
    console.log('\n📋 Проверка структуры таблицы columns:');
    const columnsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'columns' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Структура таблицы columns:');
    columnsStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Создаем тестовую доску сначала
    console.log('\n🏗️ Создание тестовой доски...');
    const boardResult = await client.query(`
      INSERT INTO boards (name, description, project_id, created_by) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `, ['Test Board', 'Test Description', '45eafdb8-36cf-454b-bb4d-5c61fe773b74', 'test-user']);
    
    const board = boardResult.rows[0];
    console.log('✅ Тестовая доска создана:', board.id);

    // Тестируем создание колонки
    console.log('\n📝 Тестирование создания колонки...');
    const columnResult = await client.query(`
      INSERT INTO columns (name, board_id, position, color, settings, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `, ['Test Column', board.id, 0, '#6B7280', '{}', 'test-user']);
    
    const column = columnResult.rows[0];
    console.log('✅ Колонка создана успешно:');
    console.log('  ID:', column.id);
    console.log('  Name:', column.name);
    console.log('  Board ID:', column.board_id);
    console.log('  Position:', column.position);
    console.log('  Color:', column.color);

    // Очистка
    await client.query('DELETE FROM columns WHERE id = $1', [column.id]);
    await client.query('DELETE FROM boards WHERE id = $1', [board.id]);
    console.log('\n🧹 Тестовые данные очищены');

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    console.error('Детали ошибки:', error);
  } finally {
    await client.end();
  }
}

testColumnCreation();