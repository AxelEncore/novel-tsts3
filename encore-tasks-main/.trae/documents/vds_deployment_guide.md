# Руководство по развертыванию на VDS сервере

## 1. Требования к серверу

### 1.1 Минимальные характеристики

- **CPU**: 2 ядра (рекомендуется 4)
- **RAM**: 4 GB (рекомендуется 8 GB)
- **Диск**: 50 GB SSD (рекомендуется 100 GB)
- **ОС**: Ubuntu 20.04 LTS или выше
- **Сеть**: Статический IP адрес

### 1.2 Необходимое ПО

- Node.js 18+ (рекомендуется 20 LTS)
- PostgreSQL 14+
- Nginx (веб-сервер и прокси)
- PM2 (менеджер процессов)
- Certbot (SSL сертификаты)
- Git

## 2. Подготовка сервера

### 2.1 Обновление системы

```bash
# Обновляем пакеты
sudo apt update && sudo apt upgrade -y

# Устанавливаем необходимые утилиты
sudo apt install -y curl wget git unzip software-properties-common

# Настраиваем firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5432  # PostgreSQL (только для внутренних подключений)
```

### 2.2 Установка Node.js

```bash
# Устанавливаем Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверяем версии
node --version
npm --version

# Устанавливаем PM2 глобально
sudo npm install -g pm2
```

### 2.3 Установка PostgreSQL

```bash
# Устанавливаем PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Запускаем и включаем автозапуск
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Настраиваем пользователя PostgreSQL
sudo -u postgres psql
```

```sql
-- В консоли PostgreSQL
CREATE USER encore_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE encore_tasks OWNER encore_user;
GRANT ALL PRIVILEGES ON DATABASE encore_tasks TO encore_user;

-- Включаем необходимые расширения
\c encore_tasks
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\q
```

### 2.4 Настройка PostgreSQL

```bash
# Редактируем конфигурацию PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
```

```ini
# В файле postgresql.conf
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
wal_buffers = 16MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1
effective_io_concurrency = 200

# Логирование
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

```bash
# Настраиваем доступ
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

```ini
# В файле pg_hba.conf (добавить в конец)
local   encore_tasks    encore_user                     md5
host    encore_tasks    encore_user     127.0.0.1/32    md5
host    encore_tasks    encore_user     ::1/128         md5
```

```bash
# Перезапускаем PostgreSQL
sudo systemctl restart postgresql

# Проверяем подключение
psql -h localhost -U encore_user -d encore_tasks -c "SELECT version();"
```

### 2.5 Установка Nginx

```bash
# Устанавливаем Nginx
sudo apt install -y nginx

# Запускаем и включаем автозапуск
sudo systemctl start nginx
sudo systemctl enable nginx

# Проверяем статус
sudo systemctl status nginx
```

## 3. Развертывание приложения

### 3.1 Создание пользователя для приложения

```bash
# Создаем пользователя
sudo adduser --system --group --home /opt/encore-tasks encore

# Переключаемся на пользователя
sudo su - encore
```

### 3.2 Клонирование и настройка проекта

```bash
# Клонируем репозиторий
cd /opt/encore-tasks
git clone https://github.com/your-username/encore-tasks.git app
cd app

# Устанавливаем зависимости
npm ci --production

# Создаем файл окружения
cp .env.example .env
nano .env
```

```env
# Содержимое .env файла
NODE_ENV=production
PORT=3000

# База данных
DATABASE_URL=postgresql://encore_user:your_secure_password_here@localhost:5432/encore_tasks
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=encore_tasks
POSTGRES_USER=encore_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_SSL=false
POSTGRES_MAX_CONNECTIONS=20

# Безопасность
JWT_SECRET=your_very_long_random_jwt_secret_here_min_32_chars
SESSION_SECRET=your_very_long_random_session_secret_here
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Приложение
APP_URL=https://your-domain.com
APP_NAME="Encore Tasks"
APP_VERSION=1.0.0

# Email (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com

# Файлы
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain

# Логирование
LOG_LEVEL=info
LOG_FILE=/opt/encore-tasks/logs/app.log
```

### 3.3 Создание схемы базы данных

```bash
# Создаем схему
node scripts/create-schema.js

# Проверяем создание таблиц
psql -h localhost -U encore_user -d encore_tasks -c "\dt"

# Создаем тестовые данные (опционально)
node scripts/seed-data.js
```

### 3.4 Сборка приложения

```bash
# Собираем фронтенд
npm run build

# Проверяем сборку
ls -la dist/
```

### 3.5 Настройка PM2

```bash
# Создаем конфигурацию PM2
nano ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'encore-tasks',
    script: './dist/server.js',
    cwd: '/opt/encore-tasks/app',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/opt/encore-tasks/logs/err.log',
    out_file: '/opt/encore-tasks/logs/out.log',
    log_file: '/opt/encore-tasks/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

```bash
# Создаем директорию для логов
sudo mkdir -p /opt/encore-tasks/logs
sudo chown encore:encore /opt/encore-tasks/logs

# Запускаем приложение через PM2
pm2 start ecosystem.config.js

# Сохраняем конфигурацию PM2
pm2 save

# Настраиваем автозапуск
pm2 startup
# Выполните команду, которую покажет PM2

# Проверяем статус
pm2 status
pm2 logs
```

## 4. Настройка Nginx

### 4.1 Конфигурация виртуального хоста

```bash
# Создаем конфигурацию сайта
sudo nano /etc/nginx/sites-available/encore-tasks
```

```nginx
# /etc/nginx/sites-available/encore-tasks
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL сертификаты (будут настроены позже)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Безопасность
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Основная конфигурация
    root /opt/encore-tasks/app/dist;
    index index.html;
    
    # Логирование
    access_log /var/log/nginx/encore-tasks.access.log;
    error_log /var/log/nginx/encore-tasks.error.log;
    
    # Сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Статические файлы
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # API запросы
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket поддержка
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Основное приложение
    location / {
        try_files $uri $uri/ @fallback;
    }
    
    location @fallback {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Ограничения загрузки
    client_max_body_size 10M;
    
    # Блокировка доступа к служебным файлам
    location ~ /\. {
        deny all;
    }
    
    location ~ /(logs|scripts|database)/ {
        deny all;
    }
}
```

```bash
# Включаем сайт
sudo ln -s /etc/nginx/sites-available/encore-tasks /etc/nginx/sites-enabled/

# Удаляем дефолтный сайт
sudo rm /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
sudo nginx -t

# Перезапускаем Nginx
sudo systemctl reload nginx
```

### 4.2 Настройка SSL сертификатов

```bash
# Устанавливаем Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получаем SSL сертификат
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Настраиваем автообновление
sudo crontab -e
```

```cron
# Добавить в crontab
0 12 * * * /usr/bin/certbot renew --quiet
```

## 5. Мониторинг и обслуживание

### 5.1 Настройка логирования

```bash
# Создаем конфигурацию logrotate
sudo nano /etc/logrotate.d/encore-tasks
```

```
/opt/encore-tasks/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 encore encore
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/encore-tasks.*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
```

### 5.2 Скрипты мониторинга

```bash
# Создаем скрипт проверки здоровья
sudo nano /opt/encore-tasks/scripts/health-check.sh
```

```bash
#!/bin/bash
# health-check.sh

APP_URL="https://your-domain.com"
LOG_FILE="/opt/encore-tasks/logs/health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Проверка HTTP ответа
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)

if [ $HTTP_CODE -eq 200 ]; then
    echo "[$DATE] OK: Application is responding (HTTP $HTTP_CODE)" >> $LOG_FILE
else
    echo "[$DATE] ERROR: Application not responding (HTTP $HTTP_CODE)" >> $LOG_FILE
    
    # Перезапуск приложения
    sudo -u encore pm2 restart encore-tasks
    echo "[$DATE] INFO: Application restarted" >> $LOG_FILE
fi

# Проверка использования памяти
MEM_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
echo "[$DATE] INFO: Memory usage: ${MEM_USAGE}%" >> $LOG_FILE

# Проверка места на диске
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo "[$DATE] INFO: Disk usage: ${DISK_USAGE}%" >> $LOG_FILE

if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage is high (${DISK_USAGE}%)" >> $LOG_FILE
fi

# Проверка PostgreSQL
PG_STATUS=$(sudo -u postgres psql -c "SELECT 1;" 2>/dev/null | grep -c "1 row")
if [ $PG_STATUS -eq 1 ]; then
    echo "[$DATE] OK: PostgreSQL is responding" >> $LOG_FILE
else
    echo "[$DATE] ERROR: PostgreSQL not responding" >> $LOG_FILE
fi
```

```bash
# Делаем скрипт исполняемым
sudo chmod +x /opt/encore-tasks/scripts/health-check.sh

# Добавляем в crontab для запуска каждые 5 минут
sudo crontab -e
```

```cron
# Добавить в crontab
*/5 * * * * /opt/encore-tasks/scripts/health-check.sh
```

### 5.3 Резервное копирование

```bash
# Создаем скрипт резервного копирования
sudo nano /opt/encore-tasks/scripts/backup.sh
```

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/encore-tasks/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="encore_tasks"
DB_USER="encore_user"

# Создаем директорию для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап базы данных
echo "Creating database backup..."
PGPASSWORD="your_secure_password_here" pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Бэкап файлов приложения
echo "Creating application backup..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /opt/encore-tasks app --exclude=node_modules --exclude=logs --exclude=.git

# Удаляем старые бэкапы (старше 7 дней)
find $BACKUP_DIR -name "*backup*" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Делаем скрипт исполняемым
sudo chmod +x /opt/encore-tasks/scripts/backup.sh

# Добавляем в crontab для ежедневного бэкапа в 2:00
sudo crontab -e
```

```cron
# Добавить в crontab
0 2 * * * /opt/encore-tasks/scripts/backup.sh
```

## 6. Безопасность

### 6.1 Настройка fail2ban

```bash
# Устанавливаем fail2ban
sudo apt install -y fail2ban

# Создаем конфигурацию
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
```

```bash
# Запускаем fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 6.2 Обновление системы

```bash
# Создаем скрипт автообновления
sudo nano /opt/encore-tasks/scripts/update-system.sh
```

```bash
#!/bin/bash
# update-system.sh

echo "Starting system update..."

# Обновляем пакеты
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
sudo apt autoclean

# Проверяем необходимость перезагрузки
if [ -f /var/run/reboot-required ]; then
    echo "Reboot required. Please restart the server."
fi

echo "System update completed."
```

```bash
# Делаем скрипт исполняемым
sudo chmod +x /opt/encore-tasks/scripts/update-system.sh

# Добавляем в crontab для еженедельного обновления
sudo crontab -e
```

```cron
# Добавить в crontab (каждое воскресенье в 3:00)
0 3 * * 0 /opt/encore-tasks/scripts/update-system.sh
```

## 7. Проверка развертывания

### 7.1 Финальная проверка

```bash
# Проверяем статус всех сервисов
sudo systemctl status postgresql
sudo systemctl status nginx
sudo -u encore pm2 status

# Проверяем подключение к базе данных
psql -h localhost -U encore_user -d encore_tasks -c "SELECT COUNT(*) FROM users;"

# Проверяем доступность приложения
curl -I https://your-domain.com

# Проверяем логи
sudo tail -f /var/log/nginx/encore-tasks.access.log
sudo -u encore pm2 logs encore-tasks
```

### 7.2 Тестирование функциональности

```bash
# Запускаем тесты на сервере
cd /opt/encore-tasks/app
sudo -u encore npm test

# Проверяем API endpoints
curl -X GET https://your-domain.com/api/health
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

## 8. Заключение

После выполнения всех шагов у вас будет:

- ✅ **Полностью настроенный VDS сервер**
- ✅ **Развернутое приложение Encore Tasks**
- ✅ **Настроенная PostgreSQL база данных**
- ✅ **SSL сертификаты и безопасность**
- ✅ **Мониторинг и резервное копирование**
- ✅ **Автоматические обновления**

Приложение готово к production использованию!

---

**Важные команды для администрирования:**

```bash
# Перезапуск приложения
sudo -u encore pm2 restart encore-tasks

# Просмотр логов
sudo -u encore pm2 logs encore-tasks

# Обновление приложения
cd /opt/encore-tasks/app
git pull
npm ci --production
npm run build
sudo -u encore pm2 restart encore-tasks

# Резервное копирование
/opt/encore-tasks/scripts/backup.sh

# Проверка здоровья
/opt/encore-tasks/scripts/health-check.sh
```

**Версия документа**: 1.0  
**Дата создания**: $(date)  
**Автор**: SOLO Document  
**Статус**: Готово к использованию