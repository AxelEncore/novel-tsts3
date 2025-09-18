"use client";

import React from "react";
import { useApp } from "@/contexts/AppContext";
import { Users, Mail, Clock, FolderX, LogOut } from "lucide-react";

export function NoProjectsScreen() {
  const { state, logout } = useApp();

  const handleLogout = () => {
    if (confirm("Вы уверены, что хотите выйти$1")) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-2xl w-full">
        {/* No Projects Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 lg:p-12 text-center animate-bounce-in">
          {/* Logo/Icon */}
          <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <FolderX className="w-10 h-10 text-orange-400" />
          </div>

          {/* Welcome Message */}
          <h1 className="text-4xl lg:text-5xl text-white mb-4 animate-slide-in-left animate-delay-200">
             Добро пожаловать в <span className="font-black">ENCORE</span> <span className="text-primary-500 font-medium">TASKS</span>!
          </h1>
          
          <p className="text-xl text-gray-300 mb-2 animate-slide-in-left animate-delay-300">
            Привет, {state.currentUser$1.name}!
          </p>
          
          <p className="text-gray-400 mb-8 leading-relaxed">
            Ваш аккаунт активен, но вы пока не добавлены ни в один проект. 
            Обратитесь к администратору или менеджеру проекта, чтобы получить доступ к проектам и задачам.
          </p>

          {/* Status Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Аккаунт активен</p>
                <p className="text-gray-400 text-sm">Ваш профиль подтвержден и готов к работе</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Ожидание добавления в проект</p>
                <p className="text-gray-400 text-sm">Администратор должен добавить вас в проект</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg opacity-50">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FolderX className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Доступ к проектам</p>
                <p className="text-gray-400 text-sm">Будет доступен после добавления в проект</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Как получить доступ к проектам$1</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Обратитесь к администратору системы или менеджеру проекта для добавления в команду. 
              После добавления в проект вы получите доступ к задачам и всем функциям платформы.
            </p>
          </div>

          {/* User Info */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Вы вошли как: <span className="text-white font-medium">{state.currentUser$1.email}</span>
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              title="Выйти">
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}