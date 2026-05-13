'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check auth status on app load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Simple route protection logic
    if (!isLoading) {
      const isProtectedRoute = pathname.startsWith('/client') || pathname.startsWith('/messages');
      const isAuthRoute = pathname === '/login' || pathname === '/register';

      if (isProtectedRoute && !isAuthenticated) {
        router.push('/login');
      } else if (isAuthRoute && isAuthenticated) {
        router.push('/client'); // Redirect to dashboard if already logged in
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Optionally show a full-screen loader while initially checking auth
  if (isLoading && (pathname.startsWith('/client') || pathname.startsWith('/messages'))) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
