import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Edit, Trash2, Users } from 'lucide-react';
import { Board, Column, Task, User } from '@/types';
import { projectService } from '@/services';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';
import KanbanColumn from './KanbanColumn';
import CreateTaskModal from './CreateTaskModal';
import CreateColumnModal from './CreateColumnModal';

interface KanbanBoardProps {
  board$1: Board;
  onTaskUpdate$2: () => void;
  onColumnUpdate$3: () => void;
}

interface DragState {
  draggedTask: Task | null;
  draggedColumn: Column | null;
  dragOverColumn: string | null;
  dragOverTask: string | null;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  board,
  onTaskUpdate,
  onColumnUpdate,
}) => {
  const { user, users } = useApp();
  
  // Проверка наличия доски
  if (!board) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Доска не найдена
      </div>
    );
  }
  
  const [columns, setColumns] = useState<Column[]>(board.columns || []);
  const [loading, setLoading] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateColumn, setShowCreateColumn] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    draggedTask: null,
    draggedColumn: null,
    dragOverColumn: null,
    dragOverTask: null,
  });

  // Загрузка колонок с задачами
  const loadColumns = async () => {
    try {
      setLoading(true);
      const response = await projectService.getBoardColumns(board.id.toString(), {
        includeTasks: true,
      });
      
      if (response.success && response.data) {
        setColumns(response.data);
      } else {
        toast.error(response.error || 'Ошибка при загрузке колонок');
      }
    } catch (error) {
      console.error('Ошибка загрузки колонок:', error);
      toast.error('Ошибка при загрузке колонок доски');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (board.columns && board.columns.length > 0) {
      setColumns(board.columns);
    } else {
      loadColumns();
    }
  }, [board.id]);

  // Обработка создания новой задачи
  const handleTaskCreated = (newTask: Task, columnId: number) => {
    setColumns(prev => prev.map(col => {
      if (col.id === columnId) {
        return {
          ...col,
          tasks: [...(col.tasks || []), newTask],
        };
      }
      return col;
    }));
    setShowCreateTask(false);
    onTaskUpdate?.();
    toast.success('Задача успешно создана');
  };

  // Обработка обновления задачи
  const handleTaskUpdate = (taskId: number, updates: Partial<Task>) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks?.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      ) || []
    })));
  };

  // Обработка удаления задачи
  const handleTaskDelete = (taskId: number) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks?.filter(task => task.id !== taskId) || []
    })));
  };

  // Обработка создания новой колонки
  const handleColumnCreated = (newColumn: Column) => {
    setColumns(prev => [...prev, newColumn]);
    setShowCreateColumn(false);
    onColumnUpdate?.();
    toast.success('Колонка успешно создана');
  };

  // Обработка перетаскивания задач
  const handleTaskDragStart = (task: Task) => {
    setDragState(prev => ({ ...prev, draggedTask: task }));
  };

  const handleTaskDragEnd = () => {
    setDragState({
      draggedTask: null,
      draggedColumn: null,
      dragOverColumn: null,
      dragOverTask: null,
    });
  };

  const handleColumnDragOver = (columnId: string, event: React.DragEvent) => {
    event.preventDefault();
    setDragState(prev => ({ ...prev, dragOverColumn: columnId }));
  };

  const handleColumnDragLeave = () => {
    setDragState(prev => ({ ...prev, dragOverColumn: null }));
  };

  const handleTaskDrop = async (targetColumnId: number, targetPosition: number) => {
    const { draggedTask } = dragState;
    if (!draggedTask) return;

    const sourceColumn = columns.find(col => 
      col.tasks?.some(task => task.id === draggedTask.id)
    );
    const targetColumn = columns.find(col => col.id === targetColumnId);

    if (!sourceColumn || !targetColumn) return;

    // Если задача перемещается в ту же колонку на то же место
    if (sourceColumn.id === targetColumnId && targetPosition === draggedTask.position) {
      return;
    }

    try {
      // Оптимистичное обновление UI
      const updatedColumns = columns.map(col => {
        if (col.id === sourceColumn.id) {
          return {
            ...col,
            tasks: col.tasks?.filter(task => task.id !== draggedTask.id) || [],
          };
        }
        if (col.id === targetColumnId) {
          const newTasks = [...(col.tasks || [])];
          const insertPosition = targetPosition ?? newTasks.length;
          newTasks.splice(insertPosition, 0, {
            ...draggedTask,
            columnId: targetColumnId,
            position: insertPosition,
          });
          return {
            ...col,
            tasks: newTasks,
          };
        }
        return col;
      });

      setColumns(updatedColumns);

      // Обновление позиций задач на сервере
      const targetTasks = updatedColumns.find(col => col.id === targetColumnId)?.tasks || [];
      const taskUpdates = targetTasks.map((task, index) => ({
        id: task.id,
        position: index,
        columnId: targetColumnId,
      }));

      const response = await projectService.updateTaskPositions(targetColumnId.toString(), {
        tasks: taskUpdates,
      });

      if (!response.success) {
        // Откат изменений при ошибке
        setColumns(columns);
        toast.error(response.error || 'Ошибка при перемещении задачи');
      } else {
        onTaskUpdate?.();
      }
    } catch (error) {
      // Откат изменений при ошибке
      setColumns(columns);
      console.error('Ошибка перемещения задачи:', error);
      toast.error('Ошибка при перемещении задачи');
    }
  };

  // Обработка перетаскивания колонок
  const handleColumnDragStart = (column: Column) => {
    setDragState(prev => ({ ...prev, draggedColumn: column }));
  };

  const handleColumnDrop = async (targetPosition: number) => {
    const { draggedColumn } = dragState;
    if (!draggedColumn || draggedColumn.position === targetPosition) return;

    try {
      // Оптимистичное обновление UI
      const updatedColumns = [...columns];
      const draggedIndex = updatedColumns.findIndex(col => col.id === draggedColumn.id);
      const [movedColumn] = updatedColumns.splice(draggedIndex, 1);
      updatedColumns.splice(targetPosition, 0, movedColumn);

      // Обновление позиций
      const reorderedColumns = updatedColumns.map((col, index) => ({
        ...col,
        position: index,
      }));

      setColumns(reorderedColumns);

      // Обновление позиций на сервере
      const columnUpdates = reorderedColumns.map((col, index) => ({
        id: col.id,
        position: index,
      }));

      const response = await projectService.updateColumnPositions(board.id.toString(), {
        columns: columnUpdates,
      });

      if (!response.success) {
        // Откат изменений при ошибке
        setColumns(columns);
        toast.error(response.error || 'Ошибка при перемещении колонки');
      } else {
        onColumnUpdate?.();
      }
    } catch (error) {
      // Откат изменений при ошибке
      setColumns(columns);
      console.error('Ошибка перемещения колонки:', error);
      toast.error('Ошибка при перемещении колонки');
    }
  };

  // Получение пользователей проекта
  const getProjectUsers = (): User[] => {
    if (!board.project?.members) return [];
    return board.project.members
      .map(member => users.find(u => u.id === member.userId))
      .filter((user): user is User => user !== undefined);
  };

  // Проверка прав доступа
  const canManageBoard = () => {
    const member = board.project?.members?.find(m => m.userId === user?.id);
    return member && ['OWNER', 'ADMIN', 'MEMBER'].includes(member.role);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Заголовок доски */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: board.color || '#3B82F6' }}
          ></div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{board.name}</h1>
            {board.description && (
              <p className="text-gray-600 text-sm">{board.description}</p>
            )}
          </div>
        </div>

        {canManageBoard() && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateColumn(true)}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Колонка</span>
            </button>
            <button
              onClick={() => {
                if (columns.length > 0) {
                  setSelectedColumn(columns[0]);
                  setShowCreateTask(true);
                }
              }}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Задача</span>
            </button>
          </div>
        )}
      </div>

      {/* Канбан доска */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex space-x-4 h-full min-w-max pb-4">
          {columns
            .sort((a, b) => (a.position || 0) - (b.position || 0))
            .map((column, index) => (
              <KanbanColumn
                key={column.id}
                column={column}
                index={index}
                isDragOver={dragState.dragOverColumn === column.id.toString()}
                canManage={canManageBoard()}
                projectUsers={getProjectUsers()}
                onTaskDragStart={handleTaskDragStart}
                onTaskDragEnd={handleTaskDragEnd}
                onTaskDrop={(targetPosition) => handleTaskDrop(column.id, targetPosition)}
                onColumnDragStart={() => handleColumnDragStart(column)}
                onColumnDragEnd={handleTaskDragEnd}
                onColumnDrop={() => handleColumnDrop(index)}
                onColumnDragOver={(e) => handleColumnDragOver(column.id.toString(), e)}
                onColumnDragLeave={handleColumnDragLeave}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onColumnUpdate={onColumnUpdate}
                onCreateTask={() => {
                  setSelectedColumn(column);
                  setShowCreateTask(true);
                }}
              />
            ))}

          {/* Кнопка добавления колонки */}
          {canManageBoard() && (
            <div className="flex-shrink-0">
              <button
                onClick={() => setShowCreateColumn(true)}
                className="w-72 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                <div className="text-center">
                  <Plus size={24} className="mx-auto mb-2" />
                  <span className="text-sm font-medium">Добавить колонку</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Модальные окна */}
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => {
          setShowCreateTask(false);
          setSelectedColumn(null);
        }}
        onTaskCreated={handleTaskCreated}
        column={selectedColumn}
        projectUsers={getProjectUsers()}
      />

      <CreateColumnModal
        isOpen={showCreateColumn}
        onClose={() => setShowCreateColumn(false)}
        onColumnCreated={handleColumnCreated}
        boardId={board.id}
        existingColumns={columns}
      />
    </div>
  );
};

export default KanbanBoard;