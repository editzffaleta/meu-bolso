'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MeuBolsoShell } from '@/shared/template/meu-bolso-shell.component';
import { AuthGuard } from '@/modules/auth/guard/auth.guard';
import { useAuth } from '@/modules/auth/context/auth.context';
import { listAccounts } from '@/modules/accounts/util/accounts-api.util';

export default function PrivateGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PrivateShell>{children}</PrivateShell>
    </AuthGuard>
  );
}

function PrivateShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [saldoConsolidado, setSaldoConsolidado] = useState<number | null>(null);

  const loadSaldo = useCallback(async () => {
    if (!token) return;
    try {
      const accounts = await listAccounts(token);
      const total = accounts.reduce((sum, account) => sum + account.initialBalance, 0);
      setSaldoConsolidado(total);
    } catch {
      setSaldoConsolidado(null);
    }
  }, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carregamento inicial de dados via API externa
    loadSaldo();
  }, [loadSaldo]);

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
