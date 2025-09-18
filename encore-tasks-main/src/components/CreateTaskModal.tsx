import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Flag, Paperclip, Plus } from 'lucide-react';
import { Task, User, Project } from '@/types';
import { format } from 'date-fns';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => Promise<void>;
  project: Project;
  columnId: number;
  projectUsers: User[];
}

interface TaskFormData {
  title: string;
  description: string;
  priority: Task['priority'];
  dueDate: string;
  assigneeIds: number[];
  tags: string[];
  estimatedHours: number | null;
}

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Низкий', color: 'text-green-600 bg-green-100' },
  { value: 'MEDIUM', label: 'Средний', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'HIGH', label: 'Высокий', color: 'text-orange-600 bg-orange-100' },
  { value: 'URGENT', label: 'Срочный', color: 'text-red-600 bg-red-100' },
] as const;

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project,
  columnId,
  projectUsers,
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assigneeIds: [],
    tags: [],
    estimatedHours: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  // Сброс формы при открытии/закрытии модального окна
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assigneeIds: [],
        tags: [],
        estimatedHours: null,
      });
      setErrors({});
      setNewTag('');
    }
  }, [isOpen]);

  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название задачи обязательно';
    }

    if (formData.title.length > 200) {
      newErrors.title = 'Название не должно превышать 200 символов';
    }

    if (formData.description.length > 1000) {
      newErrors.description = 'Описание не должно превышать 1000 символов';
    }

    if (formData.estimatedHours !== null && formData.estimatedHours < 0) {
      newErrors.estimatedHours = 'Время не может быть отрицательным';
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

    setIsSubmitting(true);
    try {
      const taskData: Partial<Task> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours || undefined,
        projectId: project.id,
        columnId,
        status: 'TODO',
        assignees: formData.assigneeIds.map(userId => ({ userId, assignedAt: new Date().toISOString() })),
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      await onSubmit(taskData);
      onClose();
    } catch (error) {
      console.error('Ошибка при создании задачи:', error);
      setErrors({ submit: 'Не удалось создать задачу. Попробуйте еще раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработка изменения полей формы
  const handleInputChange = (field: keyof TaskFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Добавление тега
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  // Удаление тега
  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  // Переключение исполнителя
  const toggleAssignee = (userId: number) => {
    const newAssigneeIds = formData.assigneeIds.includes(userId)
      ? formData.assigneeIds.filter(id => id !== userId)
      : [...formData.assigneeIds, userId];
    handleInputChange('assigneeIds', newAssigneeIds);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Создать задачу</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Название задачи */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Название задачи *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Введите название задачи"
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Введите описание задачи"
              maxLength={1000}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Приоритет и дата выполнения */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Приоритет */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                <Flag size={16} className="inline mr-1" />
                Приоритет
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as Task['priority'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PRIORITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Дата выполнения */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Дата выполнения
              </label>
              <input
                type="date"
                id="dueDate"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Оценка времени */}
          <div>
            <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-2">
              Оценка времени (часы)
            </label>
            <input
              type="number"
              id="estimatedHours"
              value={formData.estimatedHours || ''}
              onChange={(e) => handleInputChange('estimatedHours', e.target.value ? parseFloat(e.target.value) : null)}
              min="0"
              step="0.5"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.estimatedHours ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Введите количество часов"
            />
            {errors.estimatedHours && (
              <p className="mt-1 text-sm text-red-600">{errors.estimatedHours}</p>
            )}
          </div>

          {/* Исполнители */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="inline mr-1" />
              Исполнители
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {projectUsers.map(user => (
                <label key={user.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={formData.assigneeIds.includes(user.id)}
                    onChange={() => toggleAssignee(user.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-900">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Теги */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Теги
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Добавить тег"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Ошибка отправки */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Создание...' : 'Создать задачу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;