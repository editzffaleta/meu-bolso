'use client';

import { useRouter } from 'next/navigation';
import { ShellProvider } from '@/shared/context/shell.context';
import { AdminShell } from '@/shared/template/admin-shell.component';
import { AppSidebarNavigation } from '@/shared/navigation/app-sidebar-navigation.component';
import { APP_NAVIGATION_SECTIONS, DASHBOARD_ROUTE } from '@/shared/navigation/app-navigation.config';

export default function PrivateGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ShellProvider defaultOpen>
      {/* TODO: adicionar guard de autenticação se necessário */}
      <AdminShell
        sidebar={<AppSidebarNavigation modules={APP_NAVIGATION_SECTIONS} defaultModuleId="meu-bolso" />}
        logoHref={DASHBOARD_ROUTE}
        onLogout={() => router.push('/')}
      >
        {children}
      </AdminShell>
    </ShellProvider>
  );
}
