const puppeteer = require('puppeteer');

async function testFrontendRefresh() {
  let browser;
  try {
    console.log('🚀 Запуск теста обновления страницы...');
    
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Перехватываем API запросы
    await page.setRequestInterception(true);
    const apiRequests = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
      }
      request.continue();
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/projects')) {
        try {
          const text = await response.text();
          console.log('📡 GET /api/projects Response:', {
            status: response.status(),
            body: text
          });
        } catch (e) {
          console.log('📡 GET /api/projects Response:', {
            status: response.status(),
            body: 'Could not read response'
          });
        }
      }
    });
    
    // Переходим на страницу
    console.log('📄 Переход на http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Проверяем, нужна ли авторизация
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('🔐 Выполняем авторизацию...');
      
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const submitButton = await page.$('button[type="submit"]');
      
      if (emailInput && passwordInput && submitButton) {
        await emailInput.type('axelencore@mail.ru');
        await passwordInput.type('Ad580dc6axelencore');
        await submitButton.click();
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Авторизация выполнена');
      }
    }
    
    // Ждем загрузки проектов
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Получаем текущее содержимое страницы
    const pageContent = await page.content();
    console.log('📄 Длина HTML страницы:', pageContent.length);
    
    // Ищем проекты на странице
    const projectsOnPage = await page.evaluate(() => {
      // Ищем различные возможные селекторы для проектов
      const selectors = [
        '[data-testid*="project"]',
        '.project',
        '[class*="project"]',
        '[id*="project"]',
        'div:contains("проект")',
        'h1, h2, h3, h4, h5, h6'
      ];
      
      const foundElements = [];
      
      // Простой поиск по тексту
      const allElements = document.querySelectorAll('*');
      for (let el of allElements) {
        const text = el.textContent || '';
        if (text.toLowerCase().includes('проект') || 
            text.toLowerCase().includes('project') ||
            text.toLowerCase().includes('тест')) {
          foundElements.push({
            tag: el.tagName,
            text: text.substring(0, 100),
            className: el.className
          });
        }
      }
      
      return foundElements.slice(0, 10); // Ограничиваем вывод
    });
    
    console.log('📋 Найденные элементы с проектами:', projectsOnPage);
    
    // Проверяем заголовки страницы
    const pageTitle = await page.title();
    const headings = await page.evaluate(() => {
      const h = [];
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
        h.push(el.textContent?.trim());
      });
      return h;
    });
    
    console.log('📄 Заголовок страницы:', pageTitle);
    console.log('📄 Заголовки на странице:', headings);
    
    // Обновляем страницу
    console.log('🔄 Обновление страницы...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Проверяем проекты после обновления
    const projectsAfterRefresh = await page.evaluate(() => {
      const foundElements = [];
      const allElements = document.querySelectorAll('*');
      for (let el of allElements) {
        const text = el.textContent || '';
        if (text.toLowerCase().includes('проект') || 
            text.toLowerCase().includes('project') ||
            text.toLowerCase().includes('тест')) {
          foundElements.push({
            tag: el.tagName,
            text: text.substring(0, 100),
            className: el.className
          });
        }
      }
      return foundElements.slice(0, 10);
    });
    
    console.log('📋 Элементы после обновления:', projectsAfterRefresh);
    
    // Анализ API запросов
    console.log('\n🌐 API ЗАПРОСЫ:');
    apiRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`   Data: ${req.postData}`);
      }
    });
    
    // Результаты
    console.log('\n📈 РЕЗУЛЬТАТЫ:');
    console.log(`- Проектов до обновления: ${projectsOnPage.length}`);
    console.log(`- Проектов после обновления: ${projectsAfterRefresh.length}`);
    console.log(`- API запросов: ${apiRequests.length}`);
    
    if (projectsOnPage.length > 0 && projectsAfterRefresh.length === 0) {
      console.log('❌ ПРОБЛЕМА: Проекты исчезают после обновления!');
    } else if (projectsOnPage.length === projectsAfterRefresh.length) {
      console.log('✅ ВСЕ РАБОТАЕТ: Проекты сохраняются');
    } else {
      console.log('⚠️ НЕОПРЕДЕЛЕННЫЙ РЕЗУЛЬТАТ');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    if (browser) {
      console.log('🔚 Закрытие браузера через 10 секунд...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
    }
  }
}

testFrontendRefresh().catch(console.error);