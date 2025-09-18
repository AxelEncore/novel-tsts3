const puppeteer = require('puppeteer');

async function testProjectPersistence() {
  let browser;
  
  try {
    console.log('🚀 Запуск браузерного теста...');
    
    // Запуск браузера
    browser = await puppeteer.launch({ 
      headless: false, // Показываем браузер для наблюдения
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Включаем логирование сетевых запросов
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log(`📤 API Request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        console.log(`📥 API Response: ${response.request().method()} ${response.url()} - ${status}`);
        
        if (response.url().includes('/api/projects')) {
          try {
            const responseText = await response.text();
            console.log(`📋 Projects API Response Body:`, responseText);
          } catch (e) {
            console.log('❌ Не удалось прочитать тело ответа');
          }
        }
      }
    });
    
    // Логирование ошибок консоли
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`🔴 Browser Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warn') {
        console.log(`🟡 Browser Console Warning: ${msg.text()}`);
      }
    });
    
    console.log('🌐 Переход на localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Ждем загрузки страницы
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔐 Проверка необходимости авторизации...');
    
    // Проверяем, есть ли форма логина
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('📝 Выполняем авторизацию...');
      
      // Заполняем форму логина
      await page.type('input[type="email"]', 'admin@example.com');
      await page.type('input[type="password"]', 'Ad580dc6axelencore');
      
      // Нажимаем кнопку входа
      await page.click('button[type="submit"]');
      
      // Ждем перенаправления
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      console.log('✅ Авторизация выполнена');
    }
    
    // Ждем загрузки главной страницы
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📊 Проверка текущих проектов...');
    
    // Проверяем количество проектов до создания
    const projectsBefore = await page.$$eval('[data-testid="project-card"], .project-card, [class*="project"]', 
      elements => elements.length
    ).catch(() => 0);
    
    console.log(`📈 Проектов до создания: ${projectsBefore}`);
    
    console.log('➕ Создание нового проекта...');
    
    // Ищем кнопку создания проекта
    const createButton = await page.$('button:has-text("Создать проект"), button:has-text("Новый проект"), button[data-testid="create-project"]');
    
    if (!createButton) {
      // Пробуем найти любую кнопку с плюсом или создания
      const buttons = await page.$$('button');
      let foundCreateButton = false;
      
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
        if (text.includes('создать') || text.includes('новый') || text.includes('+')) {
          await button.click();
          foundCreateButton = true;
          console.log(`🎯 Нажата кнопка создания: "${text}"`);
          break;
        }
      }
      
      if (!foundCreateButton) {
        console.log('❌ Кнопка создания проекта не найдена');
        return;
      }
    } else {
      await createButton.click();
      console.log('🎯 Нажата кнопка создания проекта');
    }
    
    // Ждем появления формы или модального окна
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Заполняем форму создания проекта
    const projectName = `Тестовый проект ${Date.now()}`;
    
    try {
      await page.type('input[name="name"], input[placeholder*="название"], input[placeholder*="имя"]', projectName);
      await page.type('textarea[name="description"], textarea[placeholder*="описание"]', 'Описание тестового проекта');
      
      // Нажимаем кнопку сохранения
      await page.click('button[type="submit"], button:has-text("Создать"), button:has-text("Сохранить")');
      
      console.log(`✅ Проект "${projectName}" создан`);
    } catch (error) {
      console.log('❌ Ошибка при заполнении формы:', error.message);
      return;
    }
    
    // Ждем обновления списка проектов
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Проверяем количество проектов после создания
    const projectsAfter = await page.$$eval('[data-testid="project-card"], .project-card, [class*="project"]', 
      elements => elements.length
    ).catch(() => 0);
    
    console.log(`📈 Проектов после создания: ${projectsAfter}`);
    
    if (projectsAfter > projectsBefore) {
      console.log('✅ Проект успешно добавлен в список');
    } else {
      console.log('❌ Проект не появился в списке');
    }
    
    console.log('🔄 Обновление страницы...');
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Ждем загрузки после обновления
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Проверяем количество проектов после обновления
    const projectsAfterReload = await page.$$eval('[data-testid="project-card"], .project-card, [class*="project"]', 
      elements => elements.length
    ).catch(() => 0);
    
    console.log(`📈 Проектов после обновления: ${projectsAfterReload}`);
    
    if (projectsAfterReload === projectsAfter) {
      console.log('✅ Проекты сохранились после обновления страницы');
    } else {
      console.log('❌ ПРОБЛЕМА: Проекты исчезли после обновления страницы!');
      console.log(`   До обновления: ${projectsAfter}, После обновления: ${projectsAfterReload}`);
    }
    
    // Ждем еще немного для наблюдения
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Ошибка в тесте:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Запуск теста
testProjectPersistence().catch(console.error);