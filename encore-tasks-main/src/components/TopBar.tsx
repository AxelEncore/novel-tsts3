"use client";

import React, { useState } from "react";
import { Task } from "@/types";
import { useApp } from "@/contexts/AppContext";
import { cn, getInitials } from "@/lib/utils";
import {
  Plus,
  Filter,
  SortAsc,
  MoreHorizontal,
  Users,
  Calendar,
  Bell,
  Menu,
  X,
  Settings,
  LogOut,
  Activity
} from "lucide-react";
import { useConfirmation } from "@/hooks/useConfirmation";
import CreateTaskModal from "./CreateTaskModal";
import BoardManager from "./BoardManager";
import { CustomSelect } from "./CustomSelect";
import { TaskActionsModal } from "./TaskActionsModal";
import { UserProfile } from "./UserProfile";
import { logTaskCreated } from "@/utils/taskLogger";

interface TopBarProps {
  onToggleSidebar$1: () => void;
  sidebarCollapsed$2: boolean;
  onNavigate$3: (page: string) => void;
  currentPage$4: string;
  currentProject$5: any;
}

export function TopBar({
  onToggleSidebar,
  sidebarCollapsed,
  onNavigate,
  currentPage = "boards",
  currentProject
}: TopBarProps) {
  const { state, dispatch, createTask, logout } = useApp();
  const { ConfirmationComponent, confirm } = useConfirmation();
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isBoardManagerOpen, setIsBoardManagerOpen] = useState(false);
  const [isTaskActionsModalOpen, setIsTaskActionsModalOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const handleCreateTask = async (taskData: {
    title: string;
    description$1: string;
    status$2: string;
    priority$3: string;
    assigneeId$4: string;
    columnId: string;
    position$5: number;
    dueDate$6: Date;
    estimatedHours$7: number;
    tags$8: string[];
  }): Promise<boolean> => {
    try {
      const success = await createTask(taskData);
      if (success) {
        setIsCreateTaskModalOpen(false);
      }
      return success;
    } catch (error) {
      console.error("Ошибка при создании задачи:", error);
      return false;
    }
  };

  const handleSort = () => {
    const newSortOrder = state.sortOrder === "asc" ? "desc" : "asc";
    dispatch({
      type: "SET_SORT",
      payload: { sortBy: state.sortBy, sortOrder: newSortOrder }
    });
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Выход из системы",
      message: "Вы уверены, что хотите выйти?",
      confirmText: "Выйти",
      cancelText: "Отмена"
    });

    if (confirmed) {
      logout();
    }
  };

  const getUnreadNotificationsCount = () => {
    if (!state.notifications) return 0;
    return state.notifications.filter(n => !n.isRead).length;
  };

  const handleFilterChange = (filterType: string, value: string) => {
    dispatch({
      type: "SET_FILTERS",
      payload: { [filterType]: value }
    });
  };

  const clearFilters = () => {
    dispatch({
      type: "SET_FILTERS",
      payload: {
        assignee: "",
        priority: "",
        status: "",
        deadline: ""
      }
    });
  };

  const hasActiveFilters = () => {
    return state.filters.assignee || state.filters.priority || state.filters.status || state.filters.deadline;
  };

  const getFilteredTasksCount = () => {
    if (!state.selectedBoard) return 0;
    return state.tasks.filter(task => task.board_id === state.selectedBoard?.id).length;
  };

  const unreadNotifications = getUnreadNotificationsCount();

  return (
    <>
      <div
        className="relative h-16 bg-gray-900/50 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 flex items-center justify-between"
        data-oid="a9tf:m3">

        {/* Left section */}
        <div className="flex items-center gap-2 lg:gap-4" data-oid="9g7jnfn">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            data-oid="muj-i9-">

            <Menu className="w-5 h-5 text-gray-400" data-oid="9wujrs6" />
          </button>

          <div className="flex items-center gap-2 min-w-0" data-oid="9d_5n4q">
            {currentPage === "boards" ? (
              <>
                <h1 className="text-lg lg:text-xl font-semibold text-white truncate" data-oid="ys5n69y">
                  {state.selectedBoard?.name || "Выберите доску"}
                </h1>
                {(currentProject || state.selectedProject) &&
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full flex-shrink-0"
                  data-oid="4tht53h">

                    <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: (currentProject || state.selectedProject)?.color }}
                    data-oid="rfi5lh." />

                    <span className="text-sm text-gray-300" data-oid="fmtdcgr">
                      {(currentProject || state.selectedProject)?.name}
                    </span>
                  </div>
                }

                {/* Board management button - only for admins and managers */}
                {(state.currentUser?.role === 'admin' || state.currentUser?.role === 'manager') && (
                  <button
                    onClick={() => setIsBoardManagerOpen(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Управление досками"
                    data-oid="p-g-_z_">

                    <Settings className="w-4 h-4 text-gray-400" data-oid="_asezpr" />
                  </button>
                )}
              </>
            ) : (
              <h1 className="text-lg lg:text-xl font-semibold text-white truncate" data-oid="ys5n69y">
                {currentPage === "home" && "Главная"}
                {currentPage === "calendar" && "Календарь"}
                {currentPage === "team" && "Команда"}
                {currentPage === "notifications" && "Уведомления"}
                {currentPage === "settings" && "Настройки"}
                {currentPage === "admin" && "Администрирование"}
              </h1>
            )}
          </div>
        </div>

        {/* Center section - Filters (only on boards page) */}
        {currentPage === "boards" && (
          <div className="hidden md:flex items-center gap-2" data-oid="thb3i:p">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors glass hover-lift",
                showFilters ?
                "bg-primary-500/20 text-primary-300" :
                "text-gray-400 hover:text-white"
              )}
              data-oid="adwyo8.">

              <Filter className="w-4 h-4" data-oid="48n0x64" />
              <span className="text-sm" data-oid="1-ph:mq">
                Фильтры
              </span>
            </button>

            <button
              onClick={handleSort}
              className="hover-lift glass flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              data-oid="tz0xdvx">

              <SortAsc className="w-4 h-4" data-oid="rj7cq3d" />
              <span className="text-sm" data-oid="t3b-ifa">
                {state.sortOrder === "asc" ? "↑" : "↓"} {state.sortBy}
              </span>
            </button>

            <button
              onClick={() => onNavigate?.("team")}
              className="hover-lift glass flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              data-oid="oqoonsc">

              <Users className="w-4 h-4" data-oid="0n.wuwq" />
              <span className="text-sm" data-oid="..yd9jl">
                Команда ({((currentProject || state.selectedProject)?.members?.length) || 0})
              </span>
            </button>

            <button
              onClick={() => setIsTaskActionsModalOpen(true)}
              className="hover-lift glass flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              data-oid="oqoonsc">

              <MoreHorizontal className="w-4 h-4" data-oid="0n.wuwq" />
              <span className="text-sm" data-oid="..yd9jl">
                Действия
              </span>
            </button>
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center gap-2" data-oid="tz0xdvx">
          <button
            onClick={() => setIsCreateTaskModalOpen(true)}
            className="hover-lift glass flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            data-oid="tz0xdvx">

            <Plus className="w-4 h-4" data-oid="rj7cq3d" />
            <span className="hidden sm:inline text-sm" data-oid="t3b-ifa">
              Задача
            </span>
          </button>

          <button
            onClick={() => onNavigate?.("notifications")}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 hover-lift"
            title="Уведомления"
            data-oid="bbc4jzh">

            <Bell className="w-5 h-5 transition-transform duration-200" data-oid="dp.gfmc" />
            {unreadNotifications > 0 &&
            <div
              className="absolute -top-1 -right-1 w-5 h-5 bg-primary-700 rounded-full flex items-center justify-center text-xs text-white badge animate-pulse"
              data-oid="-xgw:5n">

                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </div>
            }
          </button>

          <button
            onClick={() => onNavigate?.("calendar")}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 hover-lift"
            title="Календарь"
            data-oid="rseo0ey">

            <Calendar className="w-5 h-5 transition-transform duration-200" data-oid="xscfnf6" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" data-oid="mmpjrmi"></div>

          <div className="flex items-center gap-2">
            {state.settings?.showAvatars && (
              state.currentUser?.avatar ?
              <button
                onClick={() => setIsUserProfileOpen(true)}
                className="hover-scale hover:ring-2 hover:ring-primary-500/50 rounded-full transition-all"
                title={`Профиль: ${state.currentUser.name}`}>
                <img
                  src={state.currentUser.avatar}
                  alt={state.currentUser.name}
                  className="w-8 h-8 rounded-full" />
              </button> :
              <button
                onClick={() => setIsUserProfileOpen(true)}
                className="hover-scale w-8 h-8 bg-primary-500 hover:bg-primary-600 rounded-full flex items-center justify-center text-sm text-white transition-all hover:ring-2 hover:ring-primary-500/50"
                title={`Профиль: ${state.currentUser?.name || "Пользователь"}`}>
                {state.currentUser ? getInitials(state.currentUser.name) : "?"}
              </button>
            )}
            
            <button
              onClick={handleLogout}
              className="hover-lift p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
              title="Выйти"
              data-oid="logout-btn">
              <LogOut className="w-5 h-5 text-gray-400 transition-transform duration-200" data-oid="logout-icon" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters dropdown - positioned relative to the page, not the topbar */}
      {showFilters &&
      <div
        className="fixed inset-0 z-40"
        onClick={() => setShowFilters(false)}
        data-oid="qkr3p:v">

          <div
            className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl p-6 min-w-96 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-oid="328">

            <div className="flex items-center justify-between mb-4" data-oid="filters-header">
              <h3 className="text-lg font-semibold text-white" data-oid="filters-title">
                Фильтры задач
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                data-oid="close-filters">
                <X className="w-5 h-5 text-gray-400" data-oid="close-icon" />
              </button>
            </div>

            <div className="space-y-4" data-oid="filters-content">
              <div data-oid="assignee-filter">
                <label className="block text-sm font-medium text-gray-300 mb-2" data-oid="assignee-label">
                  Исполнитель
                </label>
                <CustomSelect
                  value={state.filters.assignee || ""}
                  onChange={(value) => handleFilterChange("assignee", value)}
                  options={[
                    { value: "", label: "Все исполнители" },
                    ...((currentProject || state.selectedProject)?.members?.map(member => ({
                      value: member.userId,
                      label: member.userId // TODO: Need to get user name from users array
                    })) || [])
                  ]}
                  data-oid="assignee-select" />
              </div>

              <div data-oid="priority-filter">
                <label className="block text-sm font-medium text-gray-300 mb-2" data-oid="priority-label">
                  Приоритет
                </label>
                <CustomSelect
                  value={state.filters.priority || ""}
                  onChange={(value) => handleFilterChange("priority", value)}
                  options={[
                    { value: "", label: "Все приоритеты" },
                    { value: "low", label: "Низкий", color: "#a5b4fc" },
                    { value: "medium", label: "Средний", color: "#818cf8" },
                    { value: "high", label: "Высокий", color: "#6366f1" },
                    { value: "urgent", label: "Срочный", color: "#4f46e5" }
                  ]}
                  data-oid="priority-select" />
              </div>

              <div className="flex gap-2 pt-4" data-oid="filter-actions">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  data-oid="clear-filters">
                  Очистить
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  data-oid="apply-filters">
                  Применить
                </button>
              </div>

              {hasActiveFilters() && (
                <div className="text-sm text-gray-400 text-center" data-oid="filter-info">
                  Найдено задач: {getFilteredTasksCount()}
                </div>
              )}
            </div>
          </div>
        </div>
      }

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        project={currentProject || state.selectedProject}
        columnId={(currentProject || state.selectedProject)?.columns?.[0]?.id || ''}
        projectUsers={(currentProject || state.selectedProject)?.users || []}
      />

      {/* Board Manager Modal */}
      <BoardManager
        isOpen={isBoardManagerOpen}
        onClose={() => setIsBoardManagerOpen(false)}
        data-oid="mtiij.f" />

      {/* Task Actions Modal */}
      <TaskActionsModal
        isOpen={isTaskActionsModalOpen}
        onClose={() => setIsTaskActionsModalOpen(false)} />

      {/* User Profile Modal */}
      <UserProfile
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)} />

      {/* Confirmation Modal */}
      {ConfirmationComponent()}

    </>
  );
}