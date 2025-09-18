require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Функция для рекурсивного поиска файлов
function findFiles(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Пропускаем node_modules и .git
      if (!['node_modules', '.git', '.next'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Функция для замены SQLite плейсхолдеров на PostgreSQL
function convertSQLitePlaceholdersToPostgreSQL(content) {
  let modified = false;
  let newContent = content;
  
  // Ищем SQL запросы с плейсхолдерами ?
  const sqlPatterns = [
    // Паттерн для поиска SQL запросов в строках
    /(`[^`]*\?[^`]*`)/g,
    /("[^"]*\?[^"]*")/g,
    /('[^']*\?[^']*')/g
  ];
  
  sqlPatterns.forEach(pattern => {
    const matches = newContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Подсчитываем количество ? в строке
        const questionMarks = (match.match(/\?/g) || []).length;
        if (questionMarks > 0) {
          let convertedMatch = match;
          
          // Заменяем каждый ? на соответствующий $n
          let paramIndex = 1;
          convertedMatch = convertedMatch.replace(/\?/g, () => `$${paramIndex++}`);
          
          if (convertedMatch !== match) {
            newContent = newContent.replace(match, convertedMatch);
            modified = true;
            console.log(`  Заменено: ${match} -> ${convertedMatch}`);
          }
        }
      });
    }
  });
  
  return { content: newContent, modified };
}

// Основная функция
async function fixPostgreSQLPlaceholders() {
  console.log('🔧 Исправление SQLite плейсхолдеров на PostgreSQL синтаксис...');
  
  // Ищем все TypeScript и JavaScript файлы
  const files = findFiles('./src', ['.ts', '.tsx', '.js', '.jsx']);
  
  let totalFilesModified = 0;
  let totalReplacements = 0;
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = convertSQLitePlaceholdersToPostgreSQL(content);
      
      if (result.modified) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        console.log(`✅ Обновлен файл: ${filePath}`);
        totalFilesModified++;
      }
    } catch (error) {
      console.error(`❌ Ошибка при обработке файла ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Исправление завершено!`);
  console.log(`📊 Статистика:`);
  console.log(`   - Обработано файлов: ${files.length}`);
  console.log(`   - Изменено файлов: ${totalFilesModified}`);
  
  if (totalFilesModified === 0) {
    console.log('\n✨ Все файлы уже используют правильный PostgreSQL синтаксис!');
  } else {
    console.log('\n⚠️  Рекомендуется перезапустить сервер разработки после изменений.');
  }
}

// Запуск скрипта
fixPostgreSQLPlaceholders().catch(error => {
  console.error('❌ Критическая ошибка:', error);
  process.exit(1);
});