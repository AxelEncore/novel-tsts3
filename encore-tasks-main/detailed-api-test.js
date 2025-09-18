const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
let authToken = null;

async function testLogin() {
  console.log('🔐 Тестирую LOGIN...');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'axelencore@mail.ru',
        password: 'Ad580dc6axelencore'
      })
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);

    if (response.ok) {
      const data = JSON.parse(responseText);
      authToken = data.token;
      console.log('   ✅ LOGIN успешен');
      return true;
    } else {
      console.log('   ❌ LOGIN неуспешен');
      return false;
    }
  } catch (error) {
    console.log(`   💥 LOGIN ошибка: ${error.message}`);
    return false;
  }
}

async function testProjects() {
  console.log('📁 Тестирую PROJECTS...');
  try {
    const response = await fetch(`${BASE_URL}/api/projects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);

    if (response.ok) {
      console.log('   ✅ PROJECTS успешен');
      return JSON.parse(responseText);
    } else {
      console.log('   ❌ PROJECTS неуспешен');
      return null;
    }
  } catch (error) {
    console.log(`   💥 PROJECTS ошибка: ${error.message}`);
    return null;
  }
}

async function testBoards() {
  console.log('📋 Тестирую BOARDS...');
  try {
    const response = await fetch(`${BASE_URL}/api/boards`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);

    if (response.ok) {
      console.log('   ✅ BOARDS успешен');
      return JSON.parse(responseText);
    } else {
      console.log('   ❌ BOARDS неуспешен');
      return null;
    }
  } catch (error) {
    console.log(`   💥 BOARDS ошибка: ${error.message}`);
    return null;
  }
}

async function testTasks() {
  console.log('📝 Тестирую TASKS...');
  try {
    const response = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText}`);

    if (response.ok) {
      console.log('   ✅ TASKS успешен');
      return JSON.parse(responseText);
    } else {
      console.log('   ❌ TASKS неуспешен');
      return null;
    }
  } catch (error) {
    console.log(`   💥 TASKS ошибка: ${error.message}`);
    return null;
  }
}

async function runDetailedTest() {
  console.log('🚀 ДЕТАЛЬНАЯ ПРОВЕРКА API ENDPOINTS');
  console.log('==================================================');

  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Не удалось войти в систему. Останавливаю тесты.');
    return;
  }

  await testProjects();
  await testBoards();
  await testTasks();

  console.log('==================================================');
  console.log('🏁 Детальная проверка завершена!');
}

runDetailedTest().catch(console.error);