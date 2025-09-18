"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { HomePage } from "./pages/HomePage";
import { CalendarPage } from "./pages/CalendarPage";
import { TeamPage } from "./pages/TeamPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import KanbanBoard from "./KanbanBoard";
import { AuthModal } from "./AuthModal";
import { WelcomeScreen } from "./WelcomeScreen";
import { NoProjectsScreen } from "./NoProjectsScreen";
import { AdminPanel } from "./AdminPanel";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children?: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { state, dispatch, loadProjects, loadUsers } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Debug logging
  console.log('🔍 Layout: Current state:', {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    currentUser: state.currentUser
  });
  const [currentPage, setCurrentPage] = useState("boards");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(
    !state.isAuthenticated
  );

  // Get the current active project
  const currentProject = state.selectedProject || (state.projects && state.projects.length > 0 ? state.projects[0] : undefined);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    
    // Mark all notifications as read when navigating to notifications page
    if (page === "notifications") {
      dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" });
    }
  };

  // Apply theme settings
  useEffect(() => {
    const theme = state.settings?.theme || 'dark';
    const root = document.documentElement;
    
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [state.settings?.theme]);

  // Apply language settings
  useEffect(() => {
    const language = state.settings?.language || 'ru';
    document.documentElement.lang = language;
  }, [state.settings?.language]);

  // Update auth modal state when authentication changes
  useEffect(() => {
    setIsAuthModalOpen(!state.isAuthenticated);
  }, [state.isAuthenticated]);

  // Load initial data when authenticated
  useEffect(() => {
    if (state.isAuthenticated && state.currentUser) {
      loadProjects();
      loadUsers();
    }
  }, [state.isAuthenticated]);

  // Listen for navigation events from calendar
  useEffect(() => {
    const handleNavigateToBoards = () => {
      handleNavigate("boards");
    };

    window.addEventListener("navigate-to-boards", handleNavigateToBoards);
    return () => {
      window.removeEventListener("navigate-to-boards", handleNavigateToBoards);
    };
  }, [handleNavigate]);

  // Show loading screen during initialization
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (isAuthModalOpen) {
    return (
      <AuthModal
        isOpen={true}
        onClose={() => setIsAuthModalOpen(false)}
        data-oid="auth-modal" />
    );
  }

  // Show welcome screen for unapproved users
  if (state.currentUser && !state.currentUser.isApproved && state.currentUser.role === 'user') {
    return <WelcomeScreen />;
  }

  // Show no projects screen for approved users without projects
  if (state.currentUser && state.currentUser.isApproved && state.currentUser.role === 'user') {
    const userProjects = state.projects.filter(project => 
      project.members?.some(member => member.userId === state.currentUser?.id)
    );
    if (userProjects.length === 0) {
      return <NoProjectsScreen />;
    }
  }

  // Show admin panel for admin users
  if (state.currentUser && state.currentUser.role === 'admin' && currentPage === 'admin') {
    return <AdminPanel onNavigate={handleNavigate} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={handleNavigate} data-oid="hvlzykk" />;
      case "projects":
        return <ProjectsPage onNavigate={handleNavigate} data-oid="projects-page" />;
      case "calendar":
        return <CalendarPage data-oid="37_ovjc" />;
      case "team":
        return <TeamPage data-oid="bknzp_w" />;
      case "notifications":
        return <NotificationsPage data-oid="69l3ox-" />;
      case "settings":
        return <SettingsPage data-oid="7klkex1" />;
      case "boards":
      default:
        if (children) {
          return children;
        }
        
        if (!currentProject) {
          return <div className="flex items-center justify-center h-full text-gray-500">Выберите проект для работы с досками</div>;
        }
        
        const currentBoard = currentProject?.boards?.[0];
        if (!currentBoard) {
          return <div className="flex items-center justify-center h-full text-gray-500">В проекте нет досок</div>;
        }
        
        return <KanbanBoard board={currentBoard} data-oid="z.s0h3k" />;
    }
  };

  return (
    <div
      className={cn(
        "app-container h-screen flex flex-col lg:flex-row overflow-hidden animate-fade-in",
        state.settings?.compactMode && "compact-mode",
        state.settings?.theme === 'light' && "light-theme"
      )}
      data-oid="gcj74jv">

      {/* Sidebar */}
      <div
        className={`${
        sidebarCollapsed ? "hidden lg:block lg:w-16" : "fixed lg:relative inset-y-0 left-0 z-50 w-80 lg:w-80"} transition-all duration-300 flex-shrink-0 sidebar-enter`
        }
        data-oid="-t-odoy">

        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={handleNavigate}
          currentPage={currentPage}
          data-oid="bnxtoq_" />

      </div>

      {/* Overlay for mobile sidebar */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0 animate-slide-in-right" data-oid="169v9vc">
        <TopBar
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          onNavigate={handleNavigate}
          currentPage={currentPage}
          currentProject={currentProject} />

        <main className="flex-1 overflow-auto page-enter" data-oid="v:znibt">
          {renderPage()}
        </main>
      </div>

      {/* Background effects */}
      <div className="background-effects" data-oid="13h43gs">
        <div className="bg-effect-1" data-oid="l.60xyu"></div>
        <div className="bg-effect-2" data-oid="x0h_vrf"></div>
      </div>
    </div>);

}