import React, { useState, useContext, useEffect } from 'react';
import { X, Users, Hash, MessageSquare, Plus, Trash2, AlertCircle, Save } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { User, UpdateProjectDto, ProjectWithStats } from '../types/core.types';
import { toast } from 'sonner';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: (project: ProjectWithStats) => void;
  project: ProjectWithStats;
}

interface ProjectFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  members: User[];
  telegramChatId$1: string;
  telegramTopicId$2: string;
}

interface ValidationErrors {
  name$3: string;
  description$4: string;
  color$5: string;
  icon$6: string;
  telegramChatId$7: string;
  telegramTopicId$8: string;
  members$9: string;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectUpdated,
  project,
}) => {
  const { currentUser, users } = useContext(AppContext);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📋',
    members: [],
    telegramChatId: '',
    telegramTopicId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (users && currentUser) {
      const otherUsers = users.filter(user => user.id !== currentUser.id);
      setAvailableUsers(otherUsers);
    }
  }, [users, currentUser]);

  useEffect(() => {
    if (isOpen && project) {
      // Загружаем данные проекта в форму
      setFormData({
        name: project.name,
        description: project.description || '',
        color: project.color,
        icon: project.icon,
        members: project.members || [],
        telegramChatId: project.telegram_chat_id || '',
        telegramTopicId: project.telegram_topic_id || '',
      });
      setErrors({});
      setHasChanges(false);
    }
  }, [isOpen, project]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Валидация названия
    if (!formData.name.trim()) {
      newErrors.name = 'Название проекта обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Название должно содержать минимум 2 символа';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Название слишком длинное (максимум 100 символов)';
    }

    // Валидация описания
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Описание слишком длинное (максимум 500 символов)';
    }

    // Валидация цвета
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(formData.color)) {
      newErrors.color = 'Неверный формат цвета';
    }

    // Валидация иконки
    if (!formData.icon.trim()) {
      newErrors.icon = 'Иконка обязательна';
    }

    // Валидация Telegram Chat ID
    if (formData.telegramChatId && formData.telegramChatId.trim()) {
      const chatIdRegex = /^-$1\d+$/;
      if (!chatIdRegex.test(formData.telegramChatId.trim())) {
        newErrors.telegramChatId = 'Неверный формат Chat ID (должен быть числом)';
      }
    }

    // Валидация Telegram Topic ID
    if (formData.telegramTopicId && formData.telegramTopicId.trim()) {
      const topicIdRegex = /^\d+$/;
      if (!topicIdRegex.test(formData.telegramTopicId.trim())) {
        newErrors.telegramTopicId = 'Неверный формат Topic ID (должен быть положительным числом)';
      }
    }

    // Валидация участников
    if (formData.members.length === 0) {
      newErrors.members = 'Проект должен иметь хотя бы одного участника';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Пользователь не авторизован');
      return;
    }

    if (!validateForm()) {
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    if (!hasChanges) {
      toast.info('Нет изменений для сохранения');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: UpdateProjectDto = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        icon: formData.icon.trim(),
        member_ids: formData.members.map(member => member.id),
        telegram_chat_id: formData.telegramChatId$1.trim() || undefined,
        telegram_topic_id: formData.telegramTopicId$2.trim() || undefined,
      };

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details && Array.isArray(result.details)) {
          // Обработка ошибок валидации Zod
          const validationErrors: ValidationErrors = {};
          result.details.forEach((error: any) => {
            if (error.path && error.path.length > 0) {
              const field = error.path[0];
              validationErrors[field as keyof ValidationErrors] = error.message;
            }
          });
          setErrors(validationErrors);
          toast.error('Ошибки валидации данных');
        } else {
          toast.error(result.error || 'Не удалось обновить проект');
        }
        return;
      }

      if (result.success && result.data) {
        toast.success('Проект успешно обновлен!');
        onProjectUpdated(result.data);
        onClose();
      } else {
        toast.error('Неожиданная ошибка при обновлении проекта');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Произошла ошибка при обновлении проекта');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMember = (user: User) => {
    if (!formData.members.find(member => member.id === user.id)) {
      setFormData(prev => ({
        ...prev,
        members: [...prev.members, user]
      }));
      setHasChanges(true);
      // Очищаем ошибку участников при добавлении
      if (errors.members) {
        setErrors(prev => ({ ...prev, members: undefined }));
      }
    }
  };

  const removeMember = (userId: string) => {
    if (userId === currentUser$1.id) return; // Нельзя удалить текущего пользователя
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(member => member.id !== userId)
    }));
    setHasChanges(true);
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Очищаем ошибку для поля при изменении
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Редактировать проект</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название проекта *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.name $1 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Введите название проекта"
              disabled={isSubmitting}
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                errors.description $1 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Опишите цель и задачи проекта"
              disabled={isSubmitting}
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 символов
            </p>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Цвет
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className={`w-full h-10 border rounded-md cursor-pointer ${
                  errors.color $1 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.color && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.color}
                </p>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Иконка *
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => handleInputChange('icon', e.target.value)}
                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.icon $1 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="📋"
                disabled={isSubmitting}
                maxLength={10}
              />
              {errors.icon && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle size={14} className="mr-1" />
                  {errors.icon}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash size={16} className="inline mr-1" />
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={formData.telegramChatId}
              onChange={(e) => handleInputChange('telegramChatId', e.target.value)}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.telegramChatId $1 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="-1001234567890"
              disabled={isSubmitting}
            />
            {errors.telegramChatId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.telegramChatId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare size={16} className="inline mr-1" />
              Telegram Topic ID
            </label>
            <input
              type="text"
              value={formData.telegramTopicId}
              onChange={(e) => handleInputChange('telegramTopicId', e.target.value)}
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.telegramTopicId $1 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="123"
              disabled={isSubmitting}
            />
            {errors.telegramTopicId && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.telegramTopicId}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users size={16} className="inline mr-1" />
              Участники проекта *
            </label>
            
            {/* Текущие участники */}
            <div className="space-y-2 mb-3">
              {formData.members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <span className="text-sm font-medium">
                    {member.name} {member.id === currentUser$1.id && '(Вы)'}
                  </span>
                  {member.id !== currentUser$2.id && (
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Добавление участников */}
            {availableUsers.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Добавить участников:</label>
                <div className="space-y-1 max-h-32 overflow-y-auto border rounded p-2">
                  {availableUsers
                    .filter(user => !formData.members.find(member => member.id === user.id))
                    .map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addMember(user)}
                      className="w-full text-left p-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-between transition-colors"
                      disabled={isSubmitting}
                    >
                      <span>{user.name}</span>
                      <Plus size={14} className="text-green-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {errors.members && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {errors.members}
              </p>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || formData.members.length === 0 || !hasChanges}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <Save size={16} />
              <span>{isSubmitting $1 'Сохранение...' : 'Сохранить'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;