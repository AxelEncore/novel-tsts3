const puppeteer = require('puppeteer');

async function testProjectPersistence() {
  let browser;
  try {
    console.log('🚀 Запуск теста сохранения проектов...');
    
    // Запускаем браузер
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Включаем перехват сетевых запросов
    await page.setRequestInterception(true);
    const networkRequests = [];
    
    page.on('request', (request) => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
      request.continue();
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const responseData = {
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        };
        
        try {
          const text = await response.text();
          responseData.body = text;
        } catch (e) {
          responseData.body = 'Could not read response body';
        }
        
        console.log('📡 API Response:', responseData);
      }
    });
    
    // Переходим на главную страницу
    console.log('📄 Переход на http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Ждем загрузки страницы
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Проверяем, есть ли форма входа
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('🔐 Обнаружена форма входа, выполняем авторизацию...');
      
      // Заполняем форму входа
      await page.type('input[type="email"]', 'axelencore@mail.ru');
      await page.type('input[type="password"]', 'Ad580dc6axelencore');
      
      // Отправляем форму
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Проверяем текущие проекты
    console.log('📋 Проверка существующих проектов...');
    const existingProjects = await page.evaluate(() => {
      const projectElements = document.querySelectorAll('[data-testid="project-card"], .project-card, .project-item');
      return Array.from(projectElements).map(el => el.textContent?.trim() || el.innerText?.trim());
    });
    
    console.log('📊 Найденные проекты:', existingProjects);
    
    // Создаем новый тестовый проект
    const testProjectName = `Тест ${Date.now()}`;
    console.log(`➕ Создание нового проекта: ${testProjectName}`);
    
    // Ищем кнопку создания проекта
    const createButton = await page.$('button:contains("Создать"), button:contains("Create"), [data-testid="create-project"], .create-project-btn');
    if (createButton) {
      await createButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Заполняем форму создания проекта
      await page.type('input[name="name"], input[placeholder*="название"], input[placeholder*="name"]', testProjectName);
      await page.type('textarea[name="description"], textarea[placeholder*="описание"], textarea[placeholder*="description"]', 'Тестовый проект для проверки сохранения');
      
      // Отправляем форму
      await page.click('button[type="submit"], button:contains("Создать"), button:contains("Create")');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('❌ Кнопка создания проекта не найдена');
    }
    
    // Проверяем, появился ли новый проект
    const projectsAfterCreate = await page.evaluate(() => {
      const projectElements = document.querySelectorAll('[data-testid="project-card"], .project-card, .project-item');
      return Array.from(projectElements).map(el => el.textContent?.trim() || el.innerText?.trim());
    });
    
    console.log('📊 Проекты после создания:', projectsAfterCreate);
    const projectCreated = projectsAfterCreate.some(p => p.includes(testProjectName));
    console.log(`✅ Проект создан: ${projectCreated}`);
    
    // Обновляем страницу
    console.log('🔄 Обновление страницы...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Проверяем проекты после обновления
    const projectsAfterRefresh = await page.evaluate(() => {
      const projectElements = document.querySelectorAll('[data-testid="project-card"], .project-card, .project-item');
      return Array.from(projectElements).map(el => el.textContent?.trim() || el.innerText?.trim());
    });
    
    console.log('📊 Проекты после обновления:', projectsAfterRefresh);
    const projectPersisted = projectsAfterRefresh.some(p => p.includes(testProjectName));
    console.log(`💾 Проект сохранился: ${projectPersisted}`);
    
    // Анализ результатов
    console.log('\n📈 РЕЗУЛЬТАТЫ ТЕСТА:');
    console.log(`- Проект был создан: ${projectCreated}`);
    console.log(`- Проект сохранился после обновления: ${projectPersisted}`);
    
    if (projectCreated && !projectPersisted) {
      console.log('❌ ПРОБЛЕМА: Проект исчезает после обновления страницы!');
    } else if (projectCreated && projectPersisted) {
      console.log('✅ ВСЕ РАБОТАЕТ: Проект корректно сохраняется');
    } else {
      console.log('⚠️ ПРОБЛЕМА: Не удалось создать проект');
    }
    
    // Показываем сетевые запросы
    console.log('\n🌐 СЕТЕВЫЕ ЗАПРОСЫ:');
    networkRequests.forEach((req, index) => {
      if (req.url.includes('/api/')) {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`   Data: ${req.postData}`);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка во время теста:', error);
  } finally {
    if (browser) {
      console.log('🔚 Закрытие браузера...');
      await browser.close();
    }
  }
}

// Запускаем тест
testProjectPersistence().catch(console.error);