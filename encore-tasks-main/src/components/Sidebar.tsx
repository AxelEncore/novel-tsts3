"use client";

import React, { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { cn, getInitials } from "@/lib/utils";
import {
  Activity, AlertCircle, AlertTriangle, Anchor, Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  AtSign, Atom, Award, BarChart3, Battery, Bluetooth, Book, BookOpen, Bookmark, Box, Briefcase,
  Brush, Bug, Building, Calculator, Calendar, Camera, Car, Check, CheckCircle, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, Clipboard, Clock, Cloud, CloudRain,
  Code, Code2, Coffee, Cpu, CreditCard, Crown, Database, DollarSign, Download, Edit, Edit2, Edit3,
  Eye, Feather, File, FileText, Film, Fingerprint, Flag, Flame, Folder, Gamepad, Gamepad2, Gem,
  Gift, GitBranch, Github, Glasses, Globe, GraduationCap, Hammer, HardDrive, Headphones, Heart,
  HelpCircle, Home, Image, Infinity, Info, Kanban, Key, Laptop, Layers, Leaf, Lightbulb, Link,
  Lock, Mail, MapPin, MessageCircle, MessageSquare, Mic, MinusCircle, Monitor, Moon, Music,
  Navigation, Network, Package, Palette, Paperclip, Pause, PenTool, Phone, PieChart, Pill, Plane,
  Play, Plus, PlusCircle, Printer, RefreshCw, Rocket, RotateCcw, RotateCw, Save, Scissors,
  Server, Settings, Share, Share2, Shield, ShoppingBag, ShoppingCart, SkipBack, SkipForward,
  Smartphone, Sparkles, Square, Star, Store, Sun, Tag, Target, Terminal, Trash, TrendingUp,
  Trophy, Tv, Type, Umbrella, Unlock, Upload, Users, Utensils, Video, Volume, Volume2, Wallet,
  Watch, Wifi, Wrench, X, XCircle, Zap
} from "lucide-react";
import { CreateProjectModal } from "./CreateProjectModal";
import { useConfirmation } from "@/hooks/useConfirmation";

interface SidebarProps {
  isCollapsed$1: boolean;
  onToggle$2: () => void;
  onNavigate$3: (page: string) => void;
  currentPage$4: string;
}

// Function to get icon component by name
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: any } = {
    Activity, AlertCircle, AlertTriangle, Anchor, Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
    AtSign, Atom, Award, BarChart3, Battery, Bluetooth, Book, BookOpen, Bookmark, Box, Briefcase,
    Brush, Bug, Building, Calculator, Camera, Car, Check, CheckCircle, CheckCircle2, ChevronDown,
    ChevronLeft, ChevronRight, ChevronUp, Circle, Clipboard, Clock, Cloud, CloudRain, Code, Code2,
    Coffee, Cpu, CreditCard, Crown, Database, DollarSign, Download, Edit, Edit2, Edit3, Eye,
    Feather, File, FileText, Film, Fingerprint, Flag, Flame, Folder, Gamepad, Gamepad2, Gem,
    Gift, GitBranch, Github, Glasses, Globe, GraduationCap, Hammer, HardDrive, Headphones, Heart,
    HelpCircle, Home, Image, Infinity, Info, Kanban, Key, Laptop, Layers, Leaf, Lightbulb, Link,
    Lock, Mail, MapPin, MessageCircle, MessageSquare, Mic, MinusCircle, Monitor, Moon, Music,
    Navigation, Network, Package, Palette, Paperclip, Pause, PenTool, Phone, PieChart, Pill,
    Plane, Play, PlusCircle, Printer, RefreshCw, Rocket, RotateCcw, RotateCw, Save, Scissors,
    Server, Share, Share2, ShoppingBag, ShoppingCart, SkipBack, SkipForward, Smartphone, Sparkles,
    Square, Star, Store, Sun, Tag, Target, Terminal, Trash, TrendingUp, Trophy, Tv,
    Type, Umbrella, Unlock, Upload, Users, Utensils, Video, Volume, Volume2, Wallet, Watch,
    Wifi, Wrench, X, XCircle, Zap
  };
  return iconMap[iconName] || Kanban; // Default to Kanban if icon not found
};

export function Sidebar({
  isCollapsed = false,
  onNavigate,
  currentPage = "boards"
}: SidebarProps) {
  const { state, dispatch, createProject, loadProjects } = useApp();
  const { ConfirmationComponent, confirm } = useConfirmation();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(state.selectedProject ? [state.selectedProject.id] : [])
  );
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);


  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const handleProjectSelect = (project: any) => {
    dispatch({ type: "SELECT_PROJECT", payload: project });
    if (!expandedProjects.has(project.id)) {
      setExpandedProjects((prev) => new Set([...prev, project.id]));
    }
  };

  const handleCreateProject = async (projectData: any) => {
    console.log('handleCreateProject called with data:', projectData);
    try {
      console.log('Calling createProject...');
      const createdProject = await createProject(projectData);
      
      if (!createdProject) {
        console.log('createProject returned false');
        return false;
      }
      
      console.log('createProject completed, loading projects...');
      await loadProjects();
      console.log('loadProjects completed, closing modal...');
      setIsCreateProjectModalOpen(false);
      return true;
    } catch (error) {
      console.error('Failed to create project:', error);
      // Закрываем модальное окно даже при ошибке, чтобы пользователь мог попробовать снова
      setIsCreateProjectModalOpen(false);
      return false;
    }
  };


  const handleBoardSelect = (board: any) => {
    // Найти и выбрать проект, к которому принадлежит доска
    const project = state.projects.find(p => p.id === board.project_id);
    if (project && state.selectedProject?.id !== project.id) {
      dispatch({ type: "SELECT_PROJECT", payload: project });
    }
    
    dispatch({ type: "SELECT_BOARD", payload: board });
    // Navigate to boards page when selecting a board
    if (currentPage !== "boards") {
      onNavigate?.("boards");
    }
  };

  const menuItems = [
  {
    icon: Home,
    label: "Главная",
    active: currentPage === "home",
    page: "home"
  },
  {
    icon: Kanban,
    label: "Доски",
    active: currentPage === "boards",
    page: "boards"
  },
  {
    icon: Calendar,
    label: "Календарь",
    active: currentPage === "calendar",
    page: "calendar"
  },
  {
    icon: Users,
    label: "Команда",
    active: currentPage === "team",
    page: "team"
  },
  ...(state.currentUser?.role === 'admin' ? [{
    icon: Shield,
    label: "Администрирование",
    active: currentPage === "admin",
    page: "admin",
    badge: state.pendingUserNotifications?.length || 0
  }] : []),
  {
    icon: Settings,
    label: "Настройки",
    active: currentPage === "settings",
    page: "settings"
  }];


  return (
    <>
      <div
        className={cn(
          "h-full bg-gray-900/95 lg:bg-gray-900/50 backdrop-blur-xl border-r border-white/10 transition-all duration-300 overflow-y-auto",
          isCollapsed ? "w-16" : "w-80"
        )}
        data-oid="lxi59qh">

        {/* Header */}
        <div className="p-4 border-b border-white/10 flex-shrink-0" data-oid="v9s61at">
          {!isCollapsed && (
              <div className="flex items-center gap-2">
                <h1
                className="text-xl text-white font-montserrat"
                data-oid="-tyxp.t">

                  <span className="font-black">ENCORE</span> <span className="relative -top-0.5">|</span> <span className="text-primary-500 font-medium">TASKS</span>
                </h1>
                <span className="text-xs text-white bg-blue-500/30 px-2 py-0.5 rounded-full font-medium relative -top-px">
                   team
                 </span>
              </div>
          )}
        </div>



        {/* Navigation */}
        <nav className="px-4 py-2" data-oid="-5p8.9j">
          <ul className="space-y-1" data-oid="o.t7f2z">
            {menuItems.map((item, index) => (
              <li key={item.page} data-oid="_-mo9hq">
                <button
                  onClick={() => onNavigate?.(item.page)}
                  className={cn(
                    "sidebar-button",
                    item.active ? "active" : ""
                  )}
                  data-oid="78an39p">

                  <item.icon
                    className="sidebar-button-icon"
                    data-oid="8onxj39" />

                  {!isCollapsed && (
                    <span className="sidebar-button-text" data-oid="7a.ykm-">
                      {item.label}
                    </span>
                  )}
                  {!isCollapsed && item.badge && item.badge > 0 && (
                    <span className="sidebar-button-badge">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Projects */}
        {!isCollapsed && (
          <div className="px-4 py-4" data-oid="dt79tzq">
            <div
            className="flex items-center justify-between mb-3"
            data-oid="wb0b8d-">

              <h3
              className="text-sm font-medium text-gray-300"
              data-oid="b.s3t45">

                Проекты
              </h3>
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Создать проект"
              >
                <Plus className="w-4 h-4 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-1" data-oid="-w9-kot">
              {state.projects
                .filter(project => 
                  // Администраторы видят все проекты
                  state.currentUser?.role === 'admin' ||
                  // Обычные пользователи видят только проекты, где они участники
                  project.members?.some(member => member.userId === state.currentUser?.id) ||
                  // Или проекты, где пользователь является владельцем
                  project.created_by === state.currentUser?.id
                )
                .map((project) => (
                  <div key={project.id} data-oid="84we0r7">
                  <div className="group flex items-center">
                    <button
                  onClick={() => {
                    handleProjectSelect(project);
                    // Разворачиваем список досок
                    if (!expandedProjects.has(project.id)) {
                      setExpandedProjects((prev) => new Set([...prev, project.id]));
                    }
                  }}
                  className={cn(
                    "flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                    state.selectedProject?.id === project.id ?
                    "bg-primary-500/20 text-primary-300" :
                    "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                  data-oid="pg1f6uz">

                      {expandedProjects.has(project.id) ?
                  <ChevronDown className="w-4 h-4" data-oid="kdc:96m" /> :

                  <ChevronRight className="w-4 h-4" data-oid="q_xy_2_" />
                  }
                      <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                    data-oid="dcrcm_o" />

                      <span className="text-sm truncate" data-oid=".rqjx9y">
                        {project.name}
                      </span>
                    </button>
                    

                  </div>

                  {expandedProjects.has(project.id) && (
                    <div className="ml-6 mt-1 space-y-1" data-oid="g760dol">
                      {state.boards
                        .filter((board) => {
                          // Доска должна принадлежать проекту
                          if (board.project_id !== project.id) return false;
                          
                          // Администраторы видят все доски
                          if (state.currentUser?.role === 'admin') return true;
                          
                          // Обычные пользователи видят доски только тех проектов, где они участники
                          return project.members?.some(member => member.userId === state.currentUser?.id) || false;
                        })
                        .map((board) => (
                  <button
                  key={board.id}
                  onClick={() => handleBoardSelect(board)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded text-left transition-colors",
                    state.selectedBoard?.id === board.id ?
                    "bg-primary-500/10 text-primary-400" :
                    "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  )}
                  data-oid="90azt_n">

                            {React.createElement(getIconComponent('Kanban'), { className: "w-4 h-4" })}
                            <span
                    className="text-sm truncate"
                    data-oid="c0ff9i.">

                              {board.name}
                            </span>
                          </button>
                        ))
                      }
                    </div>
                  )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {!isCollapsed && (
        <div
          className="px-4 py-4 border-t border-white/10 mt-auto"
          data-oid="s.e.94j">

            <h3
            className="text-sm font-medium text-gray-300 mb-3"
            data-oid=".7.yddc">

              Статистика
            </h3>
            <div className="space-y-2" data-oid="8-i5enu">
              <div className="flex justify-between text-sm" data-oid="cbsuq5y">
                <span className="text-gray-400" data-oid="szvwry1">
                  Всего задач:
                </span>
                <span className="text-white" data-oid="hx-3kgh">
                  {
                state.tasks.filter(
                  (t) =>
                  t.project_id === state.selectedProject?.id &&
                  t.board_id === state.selectedBoard?.id
                ).length
                }
                </span>
              </div>
              <div className="flex justify-between text-sm" data-oid="y1z88ni">
                <span className="text-gray-400" data-oid="ltw35p8">
                  В работе:
                </span>
                <span className="text-yellow-400" data-oid="9tx:e8i">
                  {
                state.tasks.filter(
                  (t) =>
                  t.status === "in_progress" &&
                  t.project_id === state.selectedProject$1.id &&
                  t.board_id === state.selectedBoard$2.id
                ).length
                }
                </span>
              </div>

              <div className="flex justify-between text-sm" data-oid="f-_t:5s">
                <span className="text-gray-400" data-oid="2xk77q7">
                  Выполнено:
                </span>
                <span className="text-green-400" data-oid=":9j5spk">
                  {
                state.tasks.filter(
                  (t) =>
                  t.status === "done" &&
                  t.project_id === state.selectedProject?.id &&
                  t.board_id === state.selectedBoard?.id
                ).length
                }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onProjectCreated={handleCreateProject}
      />

      {/* Confirmation Modal */}
      {ConfirmationComponent()}

    </>);

}