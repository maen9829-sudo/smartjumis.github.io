'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { LogOut, User, Menu, Settings, Briefcase, PlusCircle, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Main Links */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                SmartJumis
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {user?.role === 'CLIENT' ? 'Мои проекты' : 'Мои отклики'}
                </Link>
              ) : (
                <Link
                  href="/projects"
                  className="text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Find Work
                </Link>
              )}
              <Link
                href="/freelancers"
                className="text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Find Talent
              </Link>
            </div>
          </div>

          {/* User Actions */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className="flex flex-col items-end text-left">
                    <span className="text-sm font-medium text-slate-900">{user?.name}</span>
                    <span className="text-xs text-slate-500">{user?.role === 'CLIENT' ? 'Заказчик' : 'Фрилансер'}</span>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-slate-100 mb-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    
                    <Link
                      href="/projects"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      <Briefcase className="w-4 h-4" />
                      Найти работу (Find Work)
                    </Link>

                    {user?.role === 'CLIENT' && (
                      <Link
                        href="/projects/new"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Опубликовать заказ
                      </Link>
                    )}

                    <Link
                      href="/profile"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Мой профиль
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Настройки
                    </Link>

                    <div className="border-t border-slate-100 my-2"></div>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-base font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              >
                {user?.role === 'CLIENT' ? 'Мои проекты' : 'Мои отклики'}
              </Link>
            ) : (
              <Link
                href="/projects"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-base font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              >
                Find Work
              </Link>
            )}
            <Link
              href="/freelancers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-base font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            >
              Find Talent
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-slate-200">
            {isAuthenticated ? (
              <div className="px-4 space-y-3">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-slate-800">{user?.name}</div>
                    <div className="text-sm font-medium text-slate-500">{user?.email}</div>
                  </div>
                </div>
                
                <Link href="/projects" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-slate-500 hover:bg-slate-50">
                  Найти работу
                </Link>
                
                {user?.role === 'CLIENT' && (
                  <Link href="/projects/new" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-primary-600 hover:bg-primary-50">
                    Опубликовать заказ
                  </Link>
                )}
                
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-slate-500 hover:bg-slate-50">
                  Мой профиль
                </Link>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-red-500 hover:text-red-700 hover:bg-slate-50"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="px-4 flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-base font-medium text-slate-700 bg-white hover:bg-slate-50"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
