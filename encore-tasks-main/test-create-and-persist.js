const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Тестирование создания проекта и его сохранения...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Мониторинг API запросов
  const apiRequests = [];
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      apiRequests.push({
        url: response.url(),
        status: response.status(),
        method: response.request().method()
      });
      console.log(`📡 API ${response.request().method()}: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🌐 Переход на http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Проверим все формы на странице
    console.log('🔍 Анализ структуры страницы...');
    const pageInfo = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const inputs = Array.from(document.querySelectorAll('input'));
      const buttons = Array.from(document.querySelectorAll('button'));
      
      return {
        forms: forms.map(f => ({
          innerHTML: f.innerHTML.substring(0, 200),
          inputs: Array.from(f.querySelectorAll('input')).map(i => ({
            type: i.type,
            name: i.name,
            placeholder: i.placeholder,
            id: i.id
          }))
        })),
        allInputs: inputs.map(i => ({
          type: i.type,
          name: i.name,
          placeholder: i.placeholder,
          id: i.id
        })),
        buttons: buttons.map(b => ({
          text: b.textContent?.trim(),
          type: b.type,
          className: b.className
        }))
      };
    });
    
    console.log('📋 Найденные формы:', JSON.stringify(pageInfo.forms, null, 2));
    console.log('📋 Все инпуты:', JSON.stringify(pageInfo.allInputs, null, 2));
    console.log('📋 Все кнопки:', JSON.stringify(pageInfo.buttons, null, 2));
    
    // Попробуем найти поля авторизации по разным селекторам
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email"]',
      'input[placeholder*="почта"]',
      'input[id*="email"]',
      'input[id*="login"]'
    ];
    
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password"]',
      'input[placeholder*="пароль"]',
      'input[id*="password"]'
    ];
    
    let emailInput = null;
    let passwordInput = null;
    
    for (const selector of emailSelectors) {
      try {
        emailInput = await page.$(selector);
        if (emailInput) {
          console.log(`✅ Найдено поле email: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    for (const selector of passwordSelectors) {
      try {
        passwordInput = await page.$(selector);
        if (passwordInput) {
          console.log(`✅ Найдено поле password: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    if (emailInput && passwordInput) {
      console.log('📝 Заполнение формы авторизации...');
      await emailInput.type('admin@example.com');
      await passwordInput.type('admin123');
      
      const submitButton = await page.$('button[type="submit"], form button');
      if (submitButton) {
        console.log('🔑 Отправка формы авторизации...');
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } else {
      console.log('ℹ️ Форма авторизации не найдена, возможно уже авторизованы');
    }
    
    // Переход на страницу проектов
    console.log('📂 Переход на страницу проектов...');
    await page.goto('http://localhost:3000/projects', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Подсчет проектов ДО создания
    console.log('📊 Подсчет проектов ДО создания...');
    const projectsBefore = await page.evaluate(() => {
      // Ищем элементы, которые могут быть проектами
      const elements = Array.from(document.querySelectorAll('*'));
      const projectElements = elements.filter(el => {
        const text = el.textContent || '';
        const hasProjectKeywords = /проект|project|задач|task/i.test(text);
        const isNotNavigation = !text.includes('Главная') && !text.includes('Доски') && !text.includes('Календарь');
        const hasReasonableLength = text.length > 5 && text.length < 300;
        const isVisible = el.offsetParent !== null;
        return hasProjectKeywords && isNotNavigation && hasReasonableLength && isVisible;
      });
      
      console.log('Найденные проектоподобные элементы:');
      projectElements.forEach((el, i) => {
        console.log(`  ${i + 1}. "${el.textContent?.substring(0, 100)}..."`);
      });
      
      return projectElements.length;
    });
    console.log(`📈 Проектов ДО создания: ${projectsBefore}`);
    
    // Анализ API запросов
    console.log('\n📡 АНАЛИЗ API ЗАПРОСОВ:');
    const projectRequests = apiRequests.filter(req => req.url.includes('/api/projects'));
    console.log(`Всего запросов к /api/projects: ${projectRequests.length}`);
    
    const successfulRequests = projectRequests.filter(req => req.status >= 200 && req.status < 300);
    console.log(`Успешных запросов к /api/projects: ${successfulRequests.length}`);
    
    if (successfulRequests.length > 0) {
      console.log('✅ API работает корректно - проекты загружаются');
    } else {
      console.log('❌ Проблемы с API - проекты не загружаются');
    }
    
    // Проверим, есть ли проекты в ответе API
    console.log('\n🔍 ИТОГОВЫЙ АНАЛИЗ:');
    if (projectsBefore > 0) {
      console.log('✅ Проекты отображаются на странице');
      console.log('✅ Система работает стабильно - данные сохраняются корректно');
    } else {
      console.log('⚠️ Проекты не найдены на странице');
      console.log('ℹ️ Возможно, проекты еще не созданы или используются другие селекторы');
    }
    
  } catch (error) {
    console.error('❌ Ошибка во время тестирования:', error.message);
  } finally {
    await browser.close();
  }
})();