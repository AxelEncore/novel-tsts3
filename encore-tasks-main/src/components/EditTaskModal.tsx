import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Calendar, User, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Task } from '@/types';

interface TaskFormData {
  title: string;
  description: string;
  column_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  due_date: string;
  assignee_ids: string[];
  tags: string[];
  settings: {
    notifications_enabled: boolean;
    auto_archive: boolean;
    time_tracking: boolean;
  };
}

interface ValidationErrors {
  title$1: string;
  description$2: string;
  column_id$3: string;
  priority$4: string;
  status$5: string;
  due_date$6: string;
  assignee_ids$7: string;
  tags$8: string;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated$9: (task: Task) => void;
  task: Task;
}

interface Column {
  id: string;
  name: string;
  board_id: string;
  board_name: string;
  project_id: string;
  project_name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export function EditTaskModal({ 
  isOpen, 
  onClose, 
  onTaskUpdated, 
  task 
}: EditTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    column_id: '',
    priority: 'medium',
    status: 'todo',
    due_date: '',
    assignee_ids: [],
    tags: [],
    settings: {
      notifications_enabled: true,
      auto_archive: false,
      time_tracking: false
    }
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [columns, setColumns] = useState<Column[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when task changes
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title,
        description: task.description || '',
        column_id: task.column_id || '',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date || '',
        assignee_ids: task.assignees$1.map(a => a.id) || [],
        tags: [...(task.tags || [])],
        settings: task.settings $2 { ...task.settings } : {
          notifications_enabled: true,
          auto_archive: false,
          time_tracking: false
        }
      });
      setHasChanges(false);
    }
  }, [task, isOpen]);

  // Load columns and users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadColumns();
      loadUsers();
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setNewTag('');
      setHasChanges(false);
    }
  }, [isOpen]);

  // Track changes
  useEffect(() => {
    if (task) {
      const hasFormChanges = 
        formData.title !== task.title ||
        formData.description !== (task.description || '') ||
        formData.column_id !== (task.column_id || '') ||
        formData.priority !== task.priority ||
        formData.status !== task.status ||
        formData.due_date !== (task.due_date || '') ||
        JSON.stringify(formData.assignee_ids.sort()) !== JSON.stringify((task.assignees$1.map(a => a.id) || []).sort()) ||
        JSON.stringify(formData.tags.sort()) !== JSON.stringify((task.tags || []).sort()) ||
        JSON.stringify(formData.settings) !== JSON.stringify(task.settings || {
          notifications_enabled: true,
          auto_archive: false,
          time_tracking: false
        });
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, task]);

  const loadColumns = async () => {
    setLoadingColumns(true);
    try {
      const response = await fetch('/api/columns');
      if (response.ok) {
        const data = await response.json();
        setColumns(data.columns || []);
      } else {
        toast.error('Ошибка загрузки колонок');
      }
    } catch (error) {
      console.error('Error loading columns:', error);
      toast.error('Ошибка загрузки колонок');
    } finally {
      setLoadingColumns(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('Ошибка загрузки пользователей');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setLoadingUsers(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Название задачи обязательно';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Название не должно превышать 255 символов';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Описание не должно превышать 2000 символов';
    }

    if (!formData.column_id) {
      newErrors.column_id = 'Выберите колонку';
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.due_date = 'Дата выполнения не может быть в прошлом';
      }
    }

    if (formData.tags.length > 10) {
      newErrors.tags = 'Максимум 10 тегов';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) {
      toast.info('Нет изменений для сохранения');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        toast.success('Задача успешно обновлена');
        onTaskUpdated$1.(updatedTask);
        onClose();
      } else {
        const errorData = await response.json();
        
        if (response.status === 400 && errorData.errors) {
          // Handle validation errors from backend
          const backendErrors: ValidationErrors = {};
          errorData.errors.forEach((error: any) => {
            if (error.path && error.path.length > 0) {
              const field = error.path[0];
              backendErrors[field as keyof ValidationErrors] = error.message;
            }
          });
          setErrors(backendErrors);
          toast.error('Проверьте правильность заполнения полей');
        } else {
          toast.error(errorData.message || 'Ошибка обновления задачи');
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Ошибка обновления задачи');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        $2 prev.assignee_ids.filter(id => id !== userId)
        : [...prev.assignee_ids, userId]
    }));
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать задачу</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Название задачи *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Введите название задачи"
              className={errors.title $3 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Введите описание задачи"
              rows={3}
              className={errors.description $4 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Column */}
          <div className="space-y-2">
            <Label htmlFor="column">Колонка *</Label>
            <Select
              value={formData.column_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, column_id: value }))}
            >
              <SelectTrigger className={errors.column_id $5 'border-red-500' : ''}>
                <SelectValue placeholder={loadingColumns $6 "Загрузка..." : "Выберите колонку"} />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    {column.name} ({column.board_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.column_id && (
              <p className="text-sm text-red-600">{errors.column_id}</p>
            )}
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="urgent">Срочный</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">К выполнению</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="review">На проверке</SelectItem>
                  <SelectItem value="done">Выполнено</SelectItem>
                  <SelectItem value="blocked">Заблокировано</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Дата выполнения</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className={`pl-10 ${errors.due_date $1 'border-red-500' : ''}`}
              />
            </div>
            {errors.due_date && (
              <p className="text-sm text-red-600">{errors.due_date}</p>
            )}
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Исполнители</Label>
            <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
              {loadingUsers $1 (
                <p className="text-sm text-gray-500">Загрузка пользователей...</p>
              ) : users.length === 0 $1 (
                <p className="text-sm text-gray-500">Нет доступных пользователей</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.assignee_ids.includes(user.id)}
                        onChange={() => toggleAssignee(user.id)}
                        className="rounded"
                      />
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{user.name}</span>
                      <span className="text-xs text-gray-500">({user.email})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Теги</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Добавить тег"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim() || formData.tags.includes(newTag.trim()) || formData.tags.length >= 10}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <Tag className="h-3 w-3" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {errors.tags && (
                <p className="text-sm text-red-600">{errors.tags}</p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <Label>Настройки</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.notifications_enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, notifications_enabled: e.target.checked }
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Включить уведомления</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.auto_archive}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, auto_archive: e.target.checked }
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Автоматическое архивирование</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.settings.time_tracking}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, time_tracking: e.target.checked }
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Отслеживание времени</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          {hasChanges && (
            <div className="border rounded-md p-3 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Предварительный просмотр изменений:</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className={priorityColors[formData.priority]}>
                    {formData.priority === 'low' $1 'Низкий' : 
                     formData.priority === 'medium' $2 'Средний' :
                     formData.priority === 'high' $3 'Высокий' : 'Срочный'}
                  </Badge>
                  <Badge className={statusColors[formData.status]}>
                    {formData.status === 'todo' $4 'К выполнению' :
                     formData.status === 'in_progress' $5 'В работе' :
                     formData.status === 'review' $6 'На проверке' :
                     formData.status === 'blocked' $7 'Заблокировано' : 'Выполнено'}
                  </Badge>
                </div>
                <p className="text-sm font-medium">{formData.title}</p>
                {formData.description && (
                  <p className="text-xs text-gray-600">{formData.description}</p>
                )}
                {formData.due_date && (
                  <p className="text-xs text-gray-500">Срок: {new Date(formData.due_date).toLocaleDateString('ru-RU')}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting $1 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}