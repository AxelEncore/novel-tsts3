import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Board {
  id: string;
  name: string;
  description$1: string;
  project_id: string;
  visibility: 'public' | 'private';
}

interface Project {
  id: string;
  name: string;
}

interface BoardFormData {
  name: string;
  description: string;
  project_id: string;
  visibility: 'public' | 'private';
}

interface ValidationErrors {
  name$1: string;
  description$2: string;
  project_id$3: string;
  visibility$4: string;
}

interface EditBoardModalProps {
  board: Board;
  projects: Project[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoardUpdated$5: (board: any) => void;
}

export function EditBoardModal({
  board,
  projects,
  open,
  onOpenChange,
  onBoardUpdated
}: EditBoardModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<BoardFormData>({
    name: board.name,
    description: board.description || '',
    project_id: board.project_id,
    visibility: board.visibility
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Обновляем форму при изменении доски
  useEffect(() => {
    setFormData({
      name: board.name,
      description: board.description || '',
      project_id: board.project_id,
      visibility: board.visibility
    });
    setErrors({});
  }, [board]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Название доски обязательно';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Название должно содержать минимум 2 символа';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Название не должно превышать 100 символов';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Описание не должно превышать 500 символов';
    }

    if (!formData.project_id) {
      newErrors.project_id = 'Выберите проект';
    }

    if (!['public', 'private'].includes(formData.visibility)) {
      newErrors.visibility = 'Выберите видимость доски';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Проверяем, есть ли изменения
    const hasChanges = 
      formData.name !== board.name ||
      formData.description !== (board.description || '') ||
      formData.project_id !== board.project_id ||
      formData.visibility !== board.visibility;

    if (!hasChanges) {
      toast.info('Нет изменений для сохранения');
      onOpenChange(false);
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          // Обработка ошибок валидации от сервера
          const serverErrors: ValidationErrors = {};
          data.errors.forEach((error: any) => {
            if (error.path && error.path.length > 0) {
              const field = error.path[0] as keyof ValidationErrors;
              serverErrors[field] = error.message;
            }
          });
          setErrors(serverErrors);
          toast.error('Проверьте правильность заполнения полей');
        } else {
          toast.error(data.error || 'Ошибка при обновлении доски');
        }
        return;
      }

      toast.success('Доска успешно обновлена');
      onOpenChange(false);
      
      if (onBoardUpdated) {
        onBoardUpdated(data.board);
      }
    } catch (error) {
      console.error('Error updating board:', error);
      toast.error('Произошла ошибка при обновлении доски');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof BoardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очистка ошибки при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Редактировать доску</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название доски *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Введите название доски"
              className={errors.name $1 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Введите описание доски (необязательно)"
              className={errors.description $1 'border-red-500' : ''}
              disabled={loading}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Проект *</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => handleInputChange('project_id', value)}
              disabled={loading}
            >
              <SelectTrigger className={errors.project_id $1 'border-red-500' : ''}>
                <SelectValue placeholder="Выберите проект" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.project_id && (
              <p className="text-sm text-red-500">{errors.project_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="visibility">Видимость *</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: 'public' | 'private') => handleInputChange('visibility', value)}
              disabled={loading}
            >
              <SelectTrigger className={errors.visibility $1 'border-red-500' : ''}>
                <SelectValue placeholder="Выберите видимость" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Публичная</SelectItem>
                <SelectItem value="private">Приватная</SelectItem>
              </SelectContent>
            </Select>
            {errors.visibility && (
              <p className="text-sm text-red-500">{errors.visibility}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить изменения
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}