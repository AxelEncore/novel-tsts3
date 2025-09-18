const https = require('https');
const http = require('http');

// Новый токен из API авторизации
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMDEyYjA3OS01Nzk4LTQ5ZDUtOGNmZi0wZTFkYmVhNTgyMmUiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwidGltZXN0YW1wIjoxNzU2MjE5MzY4NTQxLCJyYW5kb20iOiJvYmx5cTVoMmljaiIsImlhdCI6MTc1NjIxOTM2OCwiZXhwIjoxNzU2ODI0MTY4fQ.6o_04ENkDiz1xNhXKu5XwxmxdFxUifz4ye3EcmqHJ60';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/boards',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
};

console.log('Получаем список досок...');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log('Статус ответа:', res.statusCode);
  console.log('Заголовки ответа:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Ответ сервера:', data);
    
    try {
      const response = JSON.parse(data);
      console.log('Распарсенный ответ:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('\n=== НАЙДЕННЫЕ ДОСКИ ===');
        response.data.forEach((board, index) => {
          console.log(`${index + 1}. ID: ${board.id}`);
          console.log(`   Название: ${board.name}`);
          console.log(`   Проект: ${board.project_name}`);
          console.log('---');
        });
        
        // Используем первую доску для тестирования
        const firstBoard = response.data[0];
        console.log(`\nИспользуем доску "${firstBoard.name}" (ID: ${firstBoard.id}) для создания колонки`);
      } else {
        console.log('Доски не найдены');
      }
    } catch (parseError) {
      console.log('Ошибка парсинга JSON:', parseError.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Ошибка запроса:', error);
});

req.end();