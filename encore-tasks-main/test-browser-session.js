const puppeteer = require('puppeteer');
const { Pool } = require('pg');

// Настройки подключения к базе данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'encore_tasks',
  password: 'postgres',
  port: 5432,
});

// Функция для тестирования браузерной сессии
async function testBrowserSession() {
  let browser;
  let client;
  
  try {
    console.log('🚀 Запуск браузерного теста...');
    
    // Подключение к БД
    client = await pool.connect();
    console.log('✅ Подключение к базе данных установлено');
    
    // Запуск браузера
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Перехватываем сетевые запросы
    await page.setRequestInterception(true);
    
    const apiRequests = [];
    const apiResponses = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
        console.log(`📤 API Request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
        console.log(`📥 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Переходим на главную страницу
    console.log('🌐 Переход на http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Ждем загрузки страницы
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Проверяем, есть ли форма входа
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('🔐 Найдена форма входа, выполняем вход...');
      
      // Заполняем форму входа
      await page.type('input[type="email"], input[name="email"]', 'axelencore@mail.ru');
      await page.type('input[type="password"], input[name="password"]', 'password123');
      
      // Отправляем форму
      await page.click('button[type="submit"]');
      
      // Ждем перенаправления
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Вход выполнен');
    } else {
      console.log('ℹ️ Форма входа не найдена, возможно уже авторизованы');
    }
    
    // Получаем cookies после входа
    const cookies = await page.cookies();
    console.log('\n🍪 Cookies после входа:');
    cookies.forEach(cookie => {
      if (cookie.name.includes('auth') || cookie.name.includes('token')) {
        console.log(`   ${cookie.name}: ${cookie.value.substring(0, 50)}...`);
      }
    });
    
    // Проверяем текущий URL
    const currentUrl = page.url();
    console.log(`\n📍 Текущий URL: ${currentUrl}`);
    
    // Ждем загрузки проектов
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Подсчитываем проекты на странице ДО создания
    const projectsBefore = await page.evaluate(() => {
      const projectCards = document.querySelectorAll('[data-testid="project-card"], .project-card, [class*="project"][class*="card"]');
      return projectCards.length;
    });
    
    console.log(`\n📊 Проектов на странице ДО создания: ${projectsBefore}`);
    
    // Проверяем проекты в базе данных ДО создания
    const dbProjectsBefore = await client.query(
      'SELECT COUNT(*) as count FROM projects WHERE creator_id = (SELECT id FROM users WHERE email = $1)',
      ['axelencore@mail.ru']
    );
    console.log(`📊 Проектов в БД ДО создания: ${dbProjectsBefore.rows[0].count}`);
    
    // Создаем новый проект
    console.log('\n🆕 Создание нового проекта...');
    
    // Ищем кнопку создания проекта
    const createButton = await page.$('button:has-text("Создать"), button:has-text("Create"), button[data-testid="create-project"], .create-project-button');
    
    if (createButton) {
      await createButton.click();
      console.log('✅ Нажата кнопка создания проекта');
      
      // Ждем появления модального окна
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Заполняем форму создания проекта
      const projectName = `Browser Test ${new Date().toLocaleTimeString()}`;
      
      await page.type('input[name="name"], input[placeholder*="название"], input[placeholder*="name"]', projectName);
      await page.type('textarea[name="description"], textarea[placeholder*="описание"], textarea[placeholder*="description"]', 'Тестовый проект через браузер');
      
      // Отправляем форму
      const submitButton = await page.$('button[type="submit"], button:has-text("Создать"), button:has-text("Create")');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Форма создания проекта отправлена');
        
        // Ждем создания проекта
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } else {
      console.log('❌ Кнопка создания проекта не найдена');
      
      // Попробуем найти любые кнопки на странице
      const allButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map(btn => btn.textContent?.trim()).filter(text => text);
      });
      console.log('🔍 Найденные кнопки на странице:', allButtons);
    }
    
    // Подсчитываем проекты на странице ПОСЛЕ создания
    const projectsAfter = await page.evaluate(() => {
      const projectCards = document.querySelectorAll('[data-testid="project-card"], .project-card, [class*="project"][class*="card"]');
      return projectCards.length;
    });
    
    console.log(`\n📊 Проектов на странице ПОСЛЕ создания: ${projectsAfter}`);
    
    // Проверяем проекты в базе данных ПОСЛЕ создания
    const dbProjectsAfter = await client.query(
      'SELECT COUNT(*) as count FROM projects WHERE creator_id = (SELECT id FROM users WHERE email = $1)',
      ['axelencore@mail.ru']
    );
    console.log(`📊 Проектов в БД ПОСЛЕ создания: ${dbProjectsAfter.rows[0].count}`);
    
    // Обновляем страницу
    console.log('\n🔄 Обновление страницы...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Подсчитываем проекты на странице ПОСЛЕ обновления
    const projectsAfterRefresh = await page.evaluate(() => {
      const projectCards = document.querySelectorAll('[data-testid="project-card"], .project-card, [class*="project"][class*="card"]');
      return projectCards.length;
    });
    
    console.log(`📊 Проектов на странице ПОСЛЕ обновления: ${projectsAfterRefresh}`);
    
    // Анализ результатов
    console.log('\n📈 Анализ результатов:');
    console.log(`   БД: ${dbProjectsBefore.rows[0].count} → ${dbProjectsAfter.rows[0].count}`);
    console.log(`   Страница: ${projectsBefore} → ${projectsAfter} → ${projectsAfterRefresh}`);
    
    if (parseInt(dbProjectsAfter.rows[0].count) > parseInt(dbProjectsBefore.rows[0].count)) {
      console.log('✅ Проект сохранен в базе данных');
    } else {
      console.log('❌ Проект НЕ сохранен в базе данных');
    }
    
    if (projectsAfterRefresh >= projectsAfter && projectsAfter > projectsBefore) {
      console.log('✅ Проекты корректно отображаются после обновления');
    } else if (projectsAfterRefresh < projectsAfter) {
      console.log('❌ Проекты исчезают после обновления страницы!');
    } else {
      console.log('⚠️ Проект не был создан или не отображается');
    }
    
    // Выводим информацию о API запросах
    console.log('\n🌐 API запросы:');
    apiRequests.forEach((req, index) => {
      const resp = apiResponses[index];
      console.log(`   ${req.method} ${req.url} → ${resp?.status || 'pending'}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка в браузерном тесте:', error);
  } finally {
    if (client) {
      client.release();
    }
    if (browser) {
      await browser.close();
    }
    await pool.end();
  }
}

// Запуск теста
testBrowserSession().then(() => {
  console.log('\n🏁 Браузерный тест завершен');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});