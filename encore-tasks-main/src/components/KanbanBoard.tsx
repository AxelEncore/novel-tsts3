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
  board: Board;
  onTaskUpdate?: () => void;
  onColumnUpdate?: () => void;
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
          tasks: [...(col.tasks || []), newTask]
        };
      }
      return col;
    }));
    
    if (onTaskUpdate) {
      onTaskUpdate();
    }
  };

  // Обработка создания новой колонки
  const handleColumnCreated = (newColumn: Column) => {
    setColumns(prev => [...prev, newColumn]);
    
    if (onColumnUpdate) {
      onColumnUpdate();
    }
  };

  // Обработка обновления задачи
  const handleTaskUpdated = (updatedTask: Task) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: (col.tasks || []).map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    })));
    
    if (onTaskUpdate) {
      onTaskUpdate();
    }
  };

  // Обработка удаления задачи
  const handleTaskDeleted = (taskId: number) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      tasks: (col.tasks || []).filter(task => task.id !== taskId)
    })));
    
    if (onTaskUpdate) {
      onTaskUpdate();
    }
  };

  // Обработка обновления колонки
  const handleColumnUpdated = (updatedColumn: Column) => {
    setColumns(prev => prev.map(col => 
      col.id === updatedColumn.id ? updatedColumn : col
    ));
    
    if (onColumnUpdate) {
      onColumnUpdate();
    }
  };

  // Обработка удаления колонки
  const handleColumnDeleted = (columnId: number) => {
    setColumns(prev => prev.filter(col => col.id !== columnId));
    
    if (onColumnUpdate) {
      onColumnUpdate();
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    type: 'task' | 'column',
    item: Task | Column
  ) => {
    if (type === 'task') {
      setDragState(prev => ({ ...prev, draggedTask: item as Task }));
    } else {
      setDragState(prev => ({ ...prev, draggedColumn: item as Column }));
    }
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragState(prev => ({ ...prev, dragOverColumn: columnId }));
  };

  const handleDragEnd = () => {
    setDragState({
      draggedTask: null,
      draggedColumn: null,
      dragOverColumn: null,
      dragOverTask: null,
    });
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    const { draggedTask, draggedColumn } = dragState;
    
    if (draggedTask) {
      // Перемещение задачи между колонками
      const sourceColumn = columns.find(col => 
        col.tasks?.some(task => task.id === draggedTask.id)
      );
      
      if (sourceColumn && sourceColumn.id.toString() !== targetColumnId) {
        try {
          // Обновляем задачу на сервере
          const updatedTask = {
            ...draggedTask,
            column_id: parseInt(targetColumnId)
          };
          
          await projectService.updateTask(draggedTask.id, updatedTask);
          
          // Обновляем локальное состояние
          setColumns(prev => prev.map(col => {
            if (col.id === sourceColumn.id) {
              return {
                ...col,
                tasks: (col.tasks || []).filter(task => task.id !== draggedTask.id)
              };
            }
            if (col.id === parseInt(targetColumnId)) {
              return {
                ...col,
                tasks: [...(col.tasks || []), updatedTask]
              };
            }
            return col;
          }));
          
          if (onTaskUpdate) {
            onTaskUpdate();
          }
          
        } catch (error) {
          console.error('Ошибка при перемещении задачи:', error);
          toast.error('Ошибка при перемещении задачи');
        }
      }
    }
    
    handleDragEnd();
  };

  // Открытие модального окна создания задачи
  const handleCreateTask = (column: Column) => {
    setSelectedColumn(column);
    setShowCreateTask(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{board.name}</h1>
          {board.description && (
            <p className="text-gray-400 mt-1">{board.description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateColumn(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Добавить колонку</span>
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex space-x-4 overflow-x-auto pb-4 h-full">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={column.tasks || []}
            users={users}
            onTaskCreate={() => handleCreateTask(column)}
            onTaskUpdate={handleTaskUpdated}
            onTaskDelete={handleTaskDeleted}
            onColumnUpdate={handleColumnUpdated}
            onColumnDelete={handleColumnDeleted}
            onDragStart={(e, type, item) => handleDragStart(e, type, item)}
            onDragOver={(e) => handleDragOver(e, column.id.toString())}
            onDrop={(e) => handleDrop(e, column.id.toString())}
            onDragEnd={handleDragEnd}
            isDragOver={dragState.dragOverColumn === column.id.toString()}
          />
        ))}
        
        {/* Add column placeholder */}
        {columns.length === 0 && (
          <div className="flex items-center justify-center w-80 h-96 border-2 border-dashed border-gray-600 rounded-lg">
            <button
              onClick={() => setShowCreateColumn(true)}
              className="flex flex-col items-center space-y-2 text-gray-400 hover:text-white transition-colors"
            >
              <Plus size={32} />
              <span>Создать первую колонку</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateTask && selectedColumn && (
        <CreateTaskModal
          isOpen={showCreateTask}
          onClose={() => {
            setShowCreateTask(false);
            setSelectedColumn(null);
          }}
          onTaskCreated={(task) => handleTaskCreated(task, selectedColumn.id)}
          columnId={selectedColumn.id}
          boardId={board.id}
          users={users}
        />
      )}

      {showCreateColumn && (
        <CreateColumnModal
          isOpen={showCreateColumn}
          onClose={() => setShowCreateColumn(false)}
          onColumnCreated={handleColumnCreated}
          boardId={board.id}
        />
      )}
    </div>
  );
};

export default KanbanBoard;