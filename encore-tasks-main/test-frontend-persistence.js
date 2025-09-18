const puppeteer = require('puppeteer');

async function testFrontendPersistence() {
  let browser;
  try {
    console.log('🚀 Запуск браузера...');
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Перехватываем все запросы к API
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`📡 API запрос: ${response.request().method()} ${url} - Статус: ${response.status()}`);
        try {
          const responseText = await response.text();
          if (responseText) {
            console.log(`📝 Ответ: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
          }
        } catch (e) {
          console.log('❌ Не удалось прочитать ответ');
        }
      }
    });
    
    // Перехватываем ошибки консоли
    page.on('console', (msg) => {
      const type = msg.type();
      if (['error', 'warn'].includes(type)) {
        console.log(`🔍 Консоль ${type.toUpperCase()}: ${msg.text()}`);
      }
    });
    
    console.log('🌐 Переход на главную страницу...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Ждем загрузки страницы
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔑 Проверка авторизации...');
    
    // Проверяем, есть ли форма логина
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('📝 Форма логина найдена, выполняем вход...');
      
      // Заполняем форму логина
      await page.type('input[type="email"], input[name="email"]', 'axelencore@mail.ru');
      await page.type('input[type="password"], input[name="password"]', 'Ad580dc6axelencore');
      
      // Нажимаем кнопку входа
      await page.click('button[type="submit"]');
      
      // Ждем перенаправления
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('✅ Пользователь уже авторизован');
    }
    
    console.log('📊 Проверка списка проектов...');
    
    // Ждем загрузки проектов
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Считаем проекты на странице
    const projectsBeforeCreate = await page.$$eval('[data-testid="project-card"], .project-card, [class*="project"]', elements => {
      return elements.length;
    }).catch(() => {
      console.log('🔍 Не найдены элементы проектов по стандартным селекторам');
      return 0;
    });
    
    console.log(`📈 Проектов на странице ДО создания: ${projectsBeforeCreate}`);
    
    console.log('➕ Создание нового проекта...');
    
    // Проверим, какие кнопки есть на странице
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        id: btn.id,
        type: btn.type
      }));
    });
    console.log('🔍 Найденные кнопки:', allButtons);
    
    // Ищем кнопку создания проекта
    let createButton = await page.$('[data-testid="create-project"], .create-project-btn, button[class*="create"]');
    
    if (!createButton) {
      // Ищем кнопку по тексту
      createButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.includes('Создать') || 
          btn.textContent.includes('Create') ||
          btn.textContent.includes('Новый') ||
          btn.textContent.includes('+')
        );
      });
    }
    
    if (createButton && createButton.asElement) {
      const element = createButton.asElement();
      if (element) {
        await element.click();
        console.log('✅ Кнопка создания проекта нажата');
      } else {
        console.log('❌ Не удалось получить элемент кнопки');
      }
    } else if (createButton) {
      try {
        await createButton.click();
        console.log('✅ Кнопка создания проекта нажата');
      } catch (e) {
        console.log('❌ Ошибка клика по кнопке:', e.message);
      }
    } else {
      console.log('❌ Кнопка создания проекта не найдена');
      return;
    }
    
    // Ждем появления формы
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Заполняем название проекта
    const projectName = `Frontend Test ${Date.now()}`;
    await page.type('input[name="name"], input[placeholder*="название"], input[placeholder*="name"]', projectName);
    
    // Ищем кнопку сохранения
    let saveButton = await page.$('button[type="submit"]');
    
    if (!saveButton) {
      saveButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.includes('Сохранить') || 
          btn.textContent.includes('Save') ||
          btn.textContent.includes('Создать')
        );
      });
    }
    
    if (saveButton) {
      if (saveButton.click) {
        await saveButton.click();
      } else {
        await page.evaluate(btn => btn.click(), saveButton);
      }
      console.log(`✅ Проект "${projectName}" создан`);
      
      // Ждем обновления списка
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('❌ Кнопка сохранения не найдена');
    }
    
    // Считаем проекты после создания
    const projectsAfterCreate = await page.$$eval('[data-testid="project-card"], .project-card, [class*="project"]', elements => {
      return elements.length;
    }).catch(() => 0);
    
    console.log(`📈 Проектов на странице ПОСЛЕ создания: ${projectsAfterCreate}`);
    
    console.log('🔄 Обновление страницы...');
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Ждем загрузки после обновления
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Считаем проекты после обновления
    const projectsAfterReload = await page.$$eval('[data-testid="project-card"], .project-card, [class*="project"]', elements => {
      return elements.length;
    }).catch(() => 0);
    
    console.log(`📈 Проектов на странице ПОСЛЕ обновления: ${projectsAfterReload}`);
    
    // Анализ результатов
    if (projectsAfterCreate > projectsBeforeCreate) {
      console.log('✅ Проект успешно создан и отображается');
      
      if (projectsAfterReload === projectsAfterCreate) {
        console.log('✅ Проект сохраняется после обновления страницы');
      } else {
        console.log('❌ Проект исчезает после обновления страницы!');
      }
    } else {
      console.log('❌ Проект не отображается после создания');
    }
    
    // Ждем 10 секунд для ручной проверки
    console.log('⏳ Ожидание 10 секунд для ручной проверки...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testFrontendPersistence();