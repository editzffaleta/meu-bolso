'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MeuBolsoShell } from '@/shared/template/meu-bolso-shell.component';
import { AuthGuard } from '@/modules/auth/guard/auth.guard';
import { useAuth } from '@/modules/auth/context/auth.context';
import { getConsolidatedBalance } from '@/modules/analytics/util/analytics-api.util';

export default function PrivateGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PrivateShell>{children}</PrivateShell>
    </AuthGuard>
  );
}

function PrivateShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const [saldoConsolidado, setSaldoConsolidado] = useState<number | null>(null);

  const loadSaldo = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;
      try {
        const { balance } = await getConsolidatedBalance(token, signal);
        setSaldoConsolidado(balance);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // mantém o último valor conhecido em caso de erro, evitando "sumiço" do saldo
      }
    },
    [token],
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch ao navegar entre rotas privadas
    loadSaldo(controller.signal);
    return () => controller.abort();
  }, [loadSaldo, pathname]);

  function handleLogout() {
    logout();
    router.push('/join');
  }

  return (
    <MeuBolsoShell
      userName={user?.name}
      userEmail={user?.email}
      saldoConsolidado={saldoConsolidado}
      onLogout={handleLogout}
    >
      {children}
    </MeuBolsoShell>
  );
}
