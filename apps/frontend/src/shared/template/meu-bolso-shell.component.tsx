'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/shared/components/ui/icon';
import { useTheme } from '@/shared/hooks/theme.hook';
import { APP_NAV_ITEMS, PAGE_TITLES } from '@/shared/navigation/app-navigation.config';
import { formatCurrencyBRL } from '@/modules/transactions/util/format-currency.util';

type MeuBolsoShellProps = {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
  saldoConsolidado: number | null;
  onLogout: () => void;
};

function isItemActive(pathname: string, href: string, match: 'exact' | 'prefix') {
  if (match === 'exact') return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name?: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return `${first}${second}`.toUpperCase() || 'U';
}

/**
 * Shell do app (sidebar + topbar) — reproduz verbatim o markup/estilos do
 * mockup Claude Design (linhas 122-186 de
 * changes-templates/011-dashboard-graficos/mockups/dashboard/meu-bolso.dc.html),
 * trocando dados fake por dados reais (usuário autenticado, saldo consolidado,
 * título/subtítulo por rota).
 */
export function MeuBolsoShell({ children, userName, userEmail, saldoConsolidado, onLogout }: MeuBolsoShellProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const pageMeta = PAGE_TITLES[pathname] ?? { title: '', subtitle: '' };
  const themeIcon = theme === 'dark' ? 'light_mode' : 'dark_mode';

  return (
    <div data-testid="app-shell" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: 250,
          flexShrink: 0,
          background: 'var(--nav-bg)',
          borderRight: '1px solid var(--nav-border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ padding: '24px 22px 20px', display: 'flex', alignItems: 'center', gap: 11 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: 'var(--primary)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            m
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, color: '#fff' }}>
              meu-bolso
            </div>
            <div style={{ fontSize: 11, color: 'var(--nav-muted)', marginTop: 3 }}>Finanças pessoais</div>
          </div>
        </div>

        <div
          style={{
            padding: '6px 15px',
            fontSize: 10.5,
            fontWeight: 600,
            color: 'var(--nav-muted)',
            textTransform: 'uppercase',
            letterSpacing: '.09em',
            marginTop: 6,
          }}
        >
          Menu
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
          {APP_NAV_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href, item.match);
            return (
              <Link
                key={item.id}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  height: 42,
                  borderRadius: 10,
                  padding: '0 11px',
                  background: active ? 'var(--nav-active-bg)' : 'transparent',
                  color: active ? 'var(--nav-active)' : 'var(--nav-text)',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    width: 3,
                    height: 18,
                    borderRadius: 3,
                    background: 'var(--primary)',
                    opacity: active ? 1 : 0,
                  }}
                />
                <Icon name={item.icon} size={21} />
                <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: 16 }}>
          <div
            style={{
              background: 'var(--nav-active-bg)',
              border: '1px solid var(--nav-border)',
              borderRadius: 14,
              padding: '15px 16px',
            }}
          >
            <div style={{ fontSize: 11.5, color: 'var(--nav-muted)', marginBottom: 5 }}>Saldo consolidado</div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 20, fontWeight: 700, color: '#fff' }}>
              {saldoConsolidado === null ? '—' : formatCurrencyBRL(saldoConsolidado)}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* TOPBAR */}
        <header
          style={{
            height: 68,
            flexShrink: 0,
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.02em' }}>{pageMeta.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 1 }}>{pageMeta.subtitle}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={toggleTheme}
              title="Alternar tema"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name={themeIcon} size={20} />
            </button>

            <div style={{ width: 1, height: 26, background: 'var(--border)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  border: '1px solid var(--primary-line)',
                }}
              >
                {getInitials(userName)}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{userName ?? 'Usuário'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{userEmail ?? ''}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Sair"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icon name="logout" size={20} />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, padding: 28, maxWidth: 1360, width: '100%' }}>{children}</main>
      </div>
    </div>
  );
}
