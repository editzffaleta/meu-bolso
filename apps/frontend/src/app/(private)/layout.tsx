'use client';

import { useRouter } from 'next/navigation';
import { ShellProvider } from '@/shared/context/shell.context';
import { AdminShell } from '@/shared/template/admin-shell.component';
import { AppSidebarNavigation } from '@/shared/navigation/app-sidebar-navigation.component';
import { APP_NAVIGATION_SECTIONS, DASHBOARD_ROUTE } from '@/shared/navigation/app-navigation.config';
import { AuthGuard } from '@/modules/auth/guard/auth.guard';
import { useAuth } from '@/modules/auth/context/auth.context';

export default function PrivateGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PrivateShell>{children}</PrivateShell>
    </AuthGuard>
  );
}

function PrivateShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push('/join');
  }

  return (
    <ShellProvider defaultOpen>
      <AdminShell
        sidebar={<AppSidebarNavigation modules={APP_NAVIGATION_SECTIONS} defaultModuleId="meu-bolso" />}
        logoHref={DASHBOARD_ROUTE}
        userName={user?.name}
        userEmail={user?.email}
        onLogout={handleLogout}
      >
        {children}
      </AdminShell>
    </ShellProvider>
  );
}
