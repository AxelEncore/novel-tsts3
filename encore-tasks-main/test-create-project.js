const puppeteer = require('puppeteer');

async function testCreateProject() {
  let browser;
  try {
    console.log('🚀 Тест создания и сохранения проекта...');
    
    browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Перехватываем API запросы
    await page.setRequestInterception(true);
    const apiCalls = [];
    
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          data: request.postData()
        });
      }
      request.continue();
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/projects')) {
        try {
          const text = await response.text();
          console.log(`📡 ${response.request().method()} /api/projects [${response.status()}]:`, text.substring(0, 200) + '...');
        } catch (e) {
          console.log(`📡 ${response.request().method()} /api/projects [${response.status()}]: Could not read response`);
        }
      }
    });
    
    // Переходим на страницу
    console.log('📄 Переход на http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Авторизация
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('🔐 Авторизация...');
      await page.type('input[type="email"]', 'axelencore@mail.ru');
      await page.type('input[type="password"]', 'Ad580dc6axelencore');
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Подсчитываем проекты до создания
    const projectsCountBefore = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let count = 0;
      for (let el of elements) {
        const text = el.textContent || '';
        if (text.includes('Тест') && text.includes('проект')) {
          count++;
        }
      }
      return count;
    });
    
    console.log(`📊 Проектов до создания: ${projectsCountBefore}`);
    
    // Создаем новый проект через прямой API вызов
    const testProjectName = `Тест проект ${Date.now()}`;
    console.log(`➕ Создание проекта: ${testProjectName}`);
    
    const createResult = await page.evaluate(async (projectName) => {
      try {
        // Получаем CSRF токен
        const csrfResponse = await fetch('/api/csrf');
        const csrfData = await csrfResponse.json();
        
        // Создаем проект
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfData.csrfToken
          },
          body: JSON.stringify({
            name: projectName,
            description: 'Тестовый проект для проверки сохранения',
            color: '#3B82F6',
            isPrivate: true
          })
        });
        
        const result = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data: result
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }, testProjectName);
    
    console.log('📝 Результат создания:', createResult);
    
    // Ждем обновления интерфейса
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Подсчитываем проекты после создания
    const projectsCountAfter = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let count = 0;
      for (let el of elements) {
        const text = el.textContent || '';
        if (text.includes('Тест') && text.includes('проект')) {
          count++;
        }
      }
      return count;
    });
    
    console.log(`📊 Проектов после создания: ${projectsCountAfter}`);
    
    // Обновляем страницу
    console.log('🔄 Обновление страницы...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Подсчитываем проекты после обновления
    const projectsCountAfterRefresh = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let count = 0;
      for (let el of elements) {
        const text = el.textContent || '';
        if (text.includes('Тест') && text.includes('проект')) {
          count++;
        }
      }
      return count;
    });
    
    console.log(`📊 Проектов после обновления: ${projectsCountAfterRefresh}`);
    
    // Анализ результатов
    console.log('\n📈 АНАЛИЗ:');
    console.log(`- Проект создан успешно: ${createResult.success}`);
    console.log(`- Проектов до: ${projectsCountBefore}`);
    console.log(`- Проектов после создания: ${projectsCountAfter}`);
    console.log(`- Проектов после обновления: ${projectsCountAfterRefresh}`);
    
    if (createResult.success && projectsCountAfterRefresh >= projectsCountAfter) {
      console.log('✅ УСПЕХ: Проект создается и сохраняется корректно');
    } else if (createResult.success && projectsCountAfterRefresh < projectsCountAfter) {
      console.log('❌ ПРОБЛЕМА: Проект создается, но исчезает после обновления');
    } else {
      console.log('❌ ПРОБЛЕМА: Не удалось создать проект');
    }
    
    console.log('\n🌐 API ВЫЗОВЫ:');
    apiCalls.forEach((call, i) => {
      console.log(`${i + 1}. ${call.method} ${call.url}`);
      if (call.data) {
        console.log(`   Data: ${call.data}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    if (browser) {
      console.log('🔚 Закрытие браузера через 5 секунд...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      await browser.close();
    }
  }
}

testCreateProject().catch(console.error);