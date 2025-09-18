import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Board } from '@/types';
import { projectService } from '@/services/ProjectService';
import { toast } from 'sonner';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoardCreated: (board: Board) => void;
  projectId: number;
}

interface BoardFormData {
  name: string;
  description: string;
  color: string;
  isPrivate: boolean;
}

const BOARD_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const DEFAULT_COLUMNS = [
  { name: 'К выполнению', type: 'TODO' as const },
  { name: 'В работе', type: 'IN_PROGRESS' as const },
  { name: 'На проверке', type: 'REVIEW' as const },
  { name: 'Выполнено', type: 'DONE' as const },
];

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  onBoardCreated,
  projectId,
}) => {
  const [formData, setFormData] = useState<BoardFormData>({
    name: '',
    description: '',
    color: BOARD_COLORS[0],
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<BoardFormData>>({});

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Partial<BoardFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название доски обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно содержать минимум 2 символа';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Название не должно превышать 100 символов';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Описание не должно превышать 500 символов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Создание доски
      const boardResponse = await projectService.createBoard({
        projectId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        isPrivate: formData.isPrivate,
      });

      if (!boardResponse.success || !boardResponse.data) {
        throw new Error(boardResponse.error || 'Ошибка при создании доски');
      }

      const newBoard = boardResponse.data;

      // Создание колонок по умолчанию
      const columnPromises = DEFAULT_COLUMNS.map((column, index) =>
        projectService.createColumn({
          boardId: newBoard.id,
          name: column.name,
          type: column.type,
          position: index,
        })
      );

      const columnResults = await Promise.all(columnPromises);
      
      // Проверка успешности создания колонок
      const failedColumns = columnResults.filter(result => !result.success);
      if (failedColumns.length > 0) {
        console.warn('Некоторые колонки не были созданы:', failedColumns);
        toast.warning('Доска создана, но некоторые колонки не удалось создать');
      }

      // Добавление созданных колонок к доске
      const createdColumns = columnResults
        .filter(result => result.success && result.data)
        .map(result => result.data!);

      const boardWithColumns = {
        ...newBoard,
        columns: createdColumns,
      };

      onBoardCreated(boardWithColumns);
      handleClose();
      toast.success('Доска успешно создана');
    } catch (error) {
      console.error('Ошибка создания доски:', error);
      toast.error(
        error instanceof Error 
          $1 error.message 
          : 'Ошибка при создании доски'
      );
    } finally {
      setLoading(false);
    }
  };

  // Закрытие модального окна
  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        color: BOARD_COLORS[0],
        isPrivate: false,
      });
      setErrors({});
      onClose();
    }
  };

  // Обработка изменений в форме
  const handleInputChange = (field: keyof BoardFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Создать новую доску
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название доски *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Введите название доски"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name $1 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Краткое описание доски (необязательно)"
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.description $1 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.description.length}/500 символов
            </p>
          </div>

          {/* Цвет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цвет доски
            </label>
            <div className="flex flex-wrap gap-2">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange('color', color)}
                  disabled={loading}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      $1 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Выбрать цвет ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Приватность */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
              disabled={loading}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-700">
              Приватная доска (доступна только участникам проекта)
            </label>
          </div>

          {/* Предварительный просмотр */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-2">Предварительный просмотр:</p>
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: formData.color }}
              ></div>
              <span className="font-medium text-gray-900">
                {formData.name || 'Название доски'}
              </span>
            </div>
            {formData.description && (
              <p className="text-sm text-gray-600 mt-1 ml-6">
                {formData.description}
              </p>
            )}
          </div>
        </form>

        {/* Кнопки действий */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading $1 (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Создание...</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Создать доску</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBoardModal;