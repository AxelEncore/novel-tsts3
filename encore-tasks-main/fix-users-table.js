const { Pool } = require('pg');

async function fixUsersTable() {
  console.log('🔧 Исправление таблицы users...');
  
  const config = {
    connectionString: 'postgresql://neondb_owner:npg_xcT4uktYV6OK@ep-odd-glade-aemzigu2.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
  };
  
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    
    console.log('📊 Проверка структуры таблицы users...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('🏗️ Текущие колонки в таблице users:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Проверим, есть ли поле is_approved
    const hasIsApproved = columnsResult.rows.some(col => col.column_name === 'is_approved');
    const hasApprovalStatus = columnsResult.rows.some(col => col.column_name === 'approval_status');
    
    console.log('\\n🔍 Статус полей:');
    console.log(`  - is_approved: ${hasIsApproved ? 'ЕСТЬ' : 'НЕТ'}`);
    console.log(`  - approval_status: ${hasApprovalStatus ? 'ЕСТЬ' : 'НЕТ'}`);
    
    // Если нет поля is_approved, но есть approval_status - добавим алиас
    if (!hasIsApproved && hasApprovalStatus) {
      console.log('\\n➕ Добавление поля is_approved как computed column...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN 
        GENERATED ALWAYS AS (approval_status = 'approved') STORED
      `);
      console.log('✅ Поле is_approved добавлено');
    } else if (!hasIsApproved && !hasApprovalStatus) {
      console.log('\\n➕ Добавление поля is_approved как обычная колонка...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE
      `);
      console.log('✅ Поле is_approved добавлено');
      
      // Установим is_approved = true для всех существующих пользователей
      await client.query('UPDATE users SET is_approved = true WHERE is_approved IS NULL');
      console.log('✅ Обновлены существующие пользователи');
    } else {
      console.log('\\n✅ Поле is_approved уже существует');
    }
    
    // Проверим результат
    console.log('\\n📊 Проверка пользователей...');
    const usersResult = await client.query('SELECT id, email, name, role, is_approved FROM users');
    console.log('👥 Пользователи в системе:');
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - is_approved: ${user.is_approved}`);
    });
    
    client.release();
    console.log('\\n🎯 Исправление завершено успешно');
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка исправления:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

fixUsersTable().then(success => {
  console.log(`\\n🏁 Результат исправления: ${success ? 'УСПЕХ' : 'НЕУДАЧА'}`);
  process.exit(success ? 0 : 1);
});