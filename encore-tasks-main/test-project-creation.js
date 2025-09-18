const fetch = require('node-fetch');

// Конфигурация
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'admin@encore-tasks.com';
const TEST_PASSWORD = 'password';

// Функция для логирования
function log(message, data = null) {
  console.log(`[TEST] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Переменная для хранения токена
let authToken = '';

// Функция для выполнения HTTP запросов
async function makeRequest(url, options = {}) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Добавляем Bearer токен если он есть
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(url, {
      headers,
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Ошибка запроса к ${url}:`, error.message);
    throw error;
  }
}

// Функция для входа в систему
async function login() {
  log('Попытка входа в систему...');
  
  const loginData = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  };
  
  const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(loginData)
  });
  
  // Сохраняем токен для последующих запросов
  if (response.token) {
    authToken = response.token;
    log('Токен сохранен для аутентификации');
  }
  
  log('Успешный вход в систему', response);
  return response;
}

// Функция для создания проекта
async function createProject() {
  log('Создание нового проекта...');
  
  const projectData = {
    name: `Тестовый проект ${Date.now()}`,
    description: 'Проект для тестирования API'
  };
  
  const response = await makeRequest(`${BASE_URL}/api/projects`, {
    method: 'POST',
    body: JSON.stringify(projectData)
  });
  
  log('Проект успешно создан', response);
  return response;
}

// Функция для получения проектов пользователя
async function getUserProjects() {
  log('Получение списка проектов пользователя...');
  
  const response = await makeRequest(`${BASE_URL}/api/projects`, {
    method: 'GET'
  });
  
  log('Список проектов получен', response);
  return response;
}

// Функция для получения досок проекта
async function getProjectBoards(projectId) {
  log(`Получение досок проекта ${projectId}...`);
  
  const response = await makeRequest(`${BASE_URL}/api/projects/${projectId}/boards`, {
    method: 'GET'
  });
  
  log('Доски проекта получены', response);
  return response;
}

// Основная функция тестирования
async function runTest() {
  try {
    log('=== НАЧАЛО ТЕСТИРОВАНИЯ ===');
    
    // 1. Авторизация
    const loginResult = await login();
    
    // 2. Создание проекта
    const projectResult = await createProject();
    const project = projectResult.data;
    
    // 3. Получение проектов пользователя
    const userProjects = await getUserProjects();
    
    // 4. Получение досок созданного проекта
    const projectBoards = await getProjectBoards(project.id);
    
    log('=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО ===');
    
  } catch (error) {
    console.error('\n=== ОШИБКА ТЕСТИРОВАНИЯ ===');
    console.error(error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Запуск тестов
if (require.main === module) {
  runTest();
}

module.exports = {
  runTest,
  login,
  createProject,
  getUserProjects,
  getProjectBoards
};