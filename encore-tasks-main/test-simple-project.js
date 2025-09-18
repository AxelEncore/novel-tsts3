const https = require('https');
const http = require('http');

// Игнорируем самоподписанные сертификаты
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const BASE_URL = 'http://localhost:3000';
let authToken = null;

// Функция для выполнения HTTP запросов
async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', headers = {}, body } = options;
    
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(jsonData)}`));
          } else {
            resolve({ data: jsonData, status: res.statusCode, headers: res.headers });
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}, Response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    
    req.end();
  });
}

// Функция входа в систему
async function login() {
  console.log('[TEST] Попытка входа в систему...');
  
  const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: {
      email: 'axelencore@mail.ru',
      password: 'Ad580dc6axelencore'
    }
  });

  if (response.data.token) {
    authToken = response.data.token;
    console.log('[TEST] Токен сохранен для аутентификации');
  }

  console.log('[TEST] Успешный вход в систему');
  console.log(JSON.stringify(response.data, null, 2));
  return response.data;
}

// Функция создания простого проекта
async function createSimpleProject() {
  console.log('[TEST] Создание простого проекта...');
  
  const projectData = {
    name: 'Тестовый проект ' + Date.now(),
    description: 'Описание тестового проекта'
  };

  const response = await makeRequest(`${BASE_URL}/api/projects/create-simple`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: projectData
  });

  console.log('[TEST] Проект успешно создан');
  console.log(JSON.stringify(response.data, null, 2));
  return response.data;
}

// Основная функция тестирования
async function runSimpleTest() {
  try {
    console.log('=== НАЧАЛО ПРОСТОГО ТЕСТИРОВАНИЯ ===');
    
    // Вход в систему
    await login();
    
    // Создание проекта
    const projectResult = await createSimpleProject();
    
    console.log('\n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО ===');
    console.log('Создан проект:', projectResult.data.project.name);
    
  } catch (error) {
    console.error('\n=== ОШИБКА ТЕСТИРОВАНИЯ ===');
    console.error(error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Запуск тестирования
runSimpleTest();

module.exports = { runSimpleTest };