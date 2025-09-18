const http = require('http');

const BASE_URL = 'http://localhost:3002';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInRpbWVzdGFtcCI6MTc1NzE1NDg3NTM1MCwicmFuZG9tIjoiandoYm1jdG81MiIsImlhdCI6MTc1NzE1NDg3NSwiZXhwIjoxNzU3NzU5Njc1fQ.EiOIYsAqC82DundGe4rMtKM37sBUplv2gS6NbLFv9m8';

function quickRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      timeout: 5000 // 5 second timeout
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function checkAPI() {
  console.log('🔍 Быстрая проверка API endpoints...');
  
  const endpoints = [
    { name: 'Projects', path: '/api/projects', method: 'GET' },
    { name: 'Boards', path: '/api/boards', method: 'GET' },
    { name: 'Columns', path: '/api/columns?board_id=1', method: 'GET' },
    { name: 'Tasks', path: '/api/tasks?board_id=1', method: 'GET' }
  ];

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Проверяю ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
      const response = await quickRequest(endpoint.path, endpoint.method);
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ ${endpoint.name}: Статус ${response.status} - OK`);
        successCount++;
      } else if (response.status === 400 || response.status === 500) {
        console.log(`❌ ${endpoint.name}: ОШИБКА ${response.status}`);
        console.log(`   Ответ: ${response.body.substring(0, 200)}...`);
        errorCount++;
        errors.push({
          endpoint: endpoint.name,
          status: response.status,
          error: response.body
        });
      } else {
        console.log(`⚠️  ${endpoint.name}: Неожиданный статус ${response.status}`);
        errorCount++;
      }
    } catch (error) {
      console.log(`💥 ${endpoint.name}: Ошибка подключения - ${error.message}`);
      errorCount++;
      errors.push({
        endpoint: endpoint.name,
        error: error.message
      });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 РЕЗУЛЬТАТЫ БЫСТРОЙ ПРОВЕРКИ:');
  console.log(`✅ Успешных: ${successCount}`);
  console.log(`❌ С ошибками: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n🚨 ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.endpoint}: ${error.status || 'Connection Error'}`);
      if (error.error) {
        console.log(`   ${error.error.substring(0, 100)}...`);
      }
    });
  } else {
    console.log('\n🎉 ВСЕ API РАБОТАЮТ КОРРЕКТНО!');
  }
}

checkAPI().catch(console.error);