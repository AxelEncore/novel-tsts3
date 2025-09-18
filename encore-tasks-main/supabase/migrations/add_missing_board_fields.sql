-- Добавляем недостающие поля в таблицу boards
ALTER TABLE boards ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';
ALTER TABLE boards ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Обновляем существующие записи, устанавливая created_by как первого найденного пользователя
UPDATE boards 
SET created_by = (
  SELECT id FROM users LIMIT 1
) 
WHERE created_by IS NULL;

-- Комментарии для документации
COMMENT ON COLUMN boards.color IS 'Цвет доски в формате HEX (#RRGGBB)';
COMMENT ON COLUMN boards.created_by IS 'ID пользователя, создавшего доску';