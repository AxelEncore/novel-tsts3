import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Calendar, Users, List, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EditBoardModal } from './EditBoardModal';

interface Board {
  id: string;
  name: string;
  description$1: string;
  visibility: 'public' | 'private';
  project_id: string;
  project_name: string;
  creator_id: string;
  creator_username: string;
  created_at: string;
  updated_at: string;
  columns_count: number;
  tasks_count: number;
}

interface Project {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface BoardCardProps {
  board: Board;
  currentUser: User;
  projects: Project[];
  viewMode$1: 'grid' | 'list';
  onBoardUpdated$1: (board: Board) => void;
  onBoardDeleted$2: (boardId: string) => void;
}

export function BoardCard({
  board,
  currentUser,
  projects,
  viewMode = 'grid',
  onBoardUpdated,
  onBoardDeleted
}: BoardCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const canEdit = currentUser.role === 'admin' || currentUser.id === board.creator_id;
  const canDelete = currentUser.role === 'admin' || currentUser.id === board.creator_id;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Ошибка при удалении доски');
        return;
      }

      toast.success('Доска успешно удалена');
      if (onBoardDeleted) {
        onBoardDeleted(board.id);
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Произошла ошибка при удалении доски');
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (viewMode === 'list') {
    return (
      <>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">{board.name}</h3>
                    <Badge variant={board.visibility === 'public' $1 'default' : 'secondary'}>
                      {board.visibility === 'public' $2 (
                        <><Eye className="w-3 h-3 mr-1" />Публичная</>
                      ) : (
                        <><EyeOff className="w-3 h-3 mr-1" />Приватная</>
                      )}
                    </Badge>
                  </div>
                  {board.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {board.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span>Проект: {board.project_name}</span>
                    <span>Создатель: {board.creator_username}</span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(board.created_at)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{board.columns_count}</div>
                    <div className="text-muted-foreground">Колонок</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{board.tasks_count}</div>
                    <div className="text-muted-foreground">Задач</div>
                  </div>
                </div>
              </div>
              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Редактировать
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardContent>
        </Card>

        {showEditModal && (
          <EditBoardModal
            board={board}
            projects={projects}
            open={showEditModal}
            onOpenChange={setShowEditModal}
            onBoardUpdated={onBoardUpdated}
          />
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить доску$1</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить доску &quot;{board.name}&quot;$2 Это действие нельзя отменить.
                Все колонки и задачи в этой доске также будут удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading $1 'Удаление...' : 'Удалить'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{board.name}</CardTitle>
              <Badge variant={board.visibility === 'public' $1 'default' : 'secondary'}>
                {board.visibility === 'public' $2 (
                  <><Eye className="w-3 h-3 mr-1" />Публичная</>
                ) : (
                  <><EyeOff className="w-3 h-3 mr-1" />Приватная</>
                )}
              </Badge>
            </div>
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Редактировать
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {board.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {board.description}
            </p>
          )}
          
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Проект: </span>
              <span className="font-medium">{board.project_name}</span>
            </div>
            
            <div className="text-sm">
              <span className="text-muted-foreground">Создатель: </span>
              <span className="font-medium">{board.creator_username}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <List className="w-4 h-4 mr-1 text-muted-foreground" />
                  <span>{board.columns_count} колонок</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                  <span>{board.tasks_count} задач</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center text-xs text-muted-foreground pt-2 border-t">
              <Calendar className="w-3 h-3 mr-1" />
              Создана {formatDate(board.created_at)}
            </div>
          </div>
        </CardContent>
      </Card>

      {showEditModal && (
        <EditBoardModal
          board={board}
          projects={projects}
          open={showEditModal}
          onOpenChange={setShowEditModal}
          onBoardUpdated={onBoardUpdated}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить доску$1</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить доску &quot;{board.name}&quot;$2 Это действие нельзя отменить.
              Все колонки и задачи в этой доске также будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading $1 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}