const http = require('http');
const https = require('https');

// Конфигурация
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

let authToken = '';

// Функция для выполнения HTTP запросов
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Функция для логина
async function login() {
  console.log('🔐 Выполняем вход...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, TEST_USER);
    
    if (response.statusCode === 200 && response.body.token) {
      authToken = response.body.token;
      console.log('✅ Вход выполнен успешно');
      return true;
    } else {
      console.log('❌ Ошибка входа:', response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Ошибка при входе:', error.message);
    return false;
  }
}

// Функция для создания проекта
async function createProject() {
  console.log('📋 Создаем тестовый проект...');
  
  const projectData = {
    name: 'Тестовый проект API',
    description: 'Проект для тестирования API задач'
  };
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/projects',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, projectData);
    
    console.log(`Статус ответа: ${response.statusCode}`);
    console.log('Тело ответа:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 201 && response.body.success) {
      console.log(`✅ Проект создан: ${response.body.data.name} (ID: ${response.body.data.id})`);
      return response.body.data.id;
    } else {
      console.log('❌ Ошибка создания проекта:', response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Ошибка при создании проекта:', error.message);
    return null;
  }
}

// Функция для создания доски
async function createBoard(projectId) {
  console.log('📋 Создаем тестовую доску...');
  
  const boardData = {
    name: 'Тестовая доска API',
    description: 'Доска для тестирования API задач',
    project_id: projectId
  };
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/boards',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, boardData);
    
    console.log(`Статус ответа: ${response.statusCode}`);
    console.log('Тело ответа:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 201 && response.body.success) {
      console.log(`✅ Доска создана: ${response.body.data.name} (ID: ${response.body.data.id})`);
      return response.body.data.id;
    } else {
      console.log('❌ Ошибка создания доски:', response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Ошибка при создании доски:', error.message);
    return null;
  }
}

// Функция для создания колонки
async function createColumn(boardId) {
  console.log('📋 Создаем тестовую колонку...');
  
  const columnData = {
    name: 'В работе',
    board_id: boardId,
    position: 1
  };
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/columns',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, columnData);
    
    console.log(`Статус ответа: ${response.statusCode}`);
    console.log('Тело ответа:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 201 && response.body.success) {
      console.log(`✅ Колонка создана: ${response.body.data.name} (ID: ${response.body.data.id})`);
      return response.body.data.id;
    } else {
      console.log('❌ Ошибка создания колонки:', response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Ошибка при создании колонки:', error.message);
    return null;
  }
}

// Основная функция настройки
async function setupTestData() {
  console.log('🚀 Настройка тестовых данных\n');
  
  try {
    // Проверяем, что сервер запущен
    console.log('🔍 Проверяем доступность сервера...');
    const healthCheck = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'GET'
    }).catch((error) => {
      console.log('Ошибка подключения:', error.message);
      return null;
    });
    
    if (!healthCheck || healthCheck.statusCode === 0) {
      console.log('❌ Сервер недоступен. Убедитесь, что приложение запущено на порту 3000');
      return;
    }
    
    console.log('✅ Сервер доступен (статус:', healthCheck.statusCode, ')\n');
    
    // Выполняем настройку
    const loginSuccess = await login();
    if (!loginSuccess) return;
    
    const projectId = await createProject();
    if (!projectId) return;
    
    const boardId = await createBoard(projectId);
    if (!boardId) return;
    
    const columnId = await createColumn(boardId);
    if (!columnId) return;
    
    console.log('\n🎉 Тестовые данные созданы успешно!');
    console.log(`Проект ID: ${projectId}`);
    console.log(`Доска ID: ${boardId}`);
    console.log(`Колонка ID: ${columnId}`);
    
  } catch (error) {
    console.log('❌ Критическая ошибка:', error.message);
  }
}

// Запускаем настройку