const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true'
});

async function applyUnifiedSchema() {
  try {
    console.log('Connecting to PostgreSQL database...');
    
    // Читаем unified схему
    const sql = fs.readFileSync('./database/migrations/unified_postgresql_schema.sql', 'utf8');
    
    console.log('Dropping existing schema and recreating...');
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    await pool.query('CREATE SCHEMA public');
    
    console.log('Applying unified schema...');
    await pool.query(sql);
    
    console.log('✅ Unified schema applied successfully!');
    
    // Проверяем созданные таблицы
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Проверяем структуру sessions таблицы
    const sessionsStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'sessions' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n🔑 Sessions table structure:');
    sessionsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error applying unified schema:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyUnifiedSchema();