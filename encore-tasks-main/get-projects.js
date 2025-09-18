const https = require('https');
const http = require('http');

// Новый токен из API авторизации
const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMDEyYjA3OS01Nzk4LTQ5ZDUtOGNmZi0wZTFkYmVhNTgyMmUiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwidGltZXN0YW1wIjoxNzU2MjE5MzY4NTQxLCJyYW5kb20iOiJvYmx5cTVoMmljaiIsImlhdCI6MTc1NjIxOTM2OCwiZXhwIjoxNzU2ODI0MTY4fQ.6o_04ENkDiz1xNhXKu5XwxmxdFxUifz4ye3EcmqHJ60';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/projects',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
};

console.log('Получаем список проектов...');
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
        console.log('\n=== НАЙДЕННЫЕ ПРОЕКТЫ ===');
        response.data.forEach((project, index) => {
          console.log(`${index + 1}. ID: ${project.id}`);
          console.log(`   Название: ${project.name}`);
          console.log(`   Описание: ${project.description || 'Нет описания'}`);
          console.log('---');
        });
        
        // Используем первый проект для тестирования
        const firstProject = response.data[0];
        console.log(`\nИспользуем проект "${firstProject.name}" (ID: ${firstProject.id}) для создания доски`);
      } else {
        console.log('Проекты не найдены');
      }
    } catch (parseError) {
      console.log('Ошибка парсинга JSON:', parseError);
    }
  });
});

req.on('error', (error) => {
  console.error('Ошибка запроса:', error);
});

req.end();