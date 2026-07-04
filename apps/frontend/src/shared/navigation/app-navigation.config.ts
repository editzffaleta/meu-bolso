import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tags,
  PieChart,
  Upload,
} from 'lucide-react';
import type { ModuleNavigationEntry } from '@/shared/components/ui/sidebar-menu.component';

// Rotas das seções do produto meu-bolso. Passam a existir a partir das
// mudanças 005-011; aqui a navegação é apenas config estática (sem gating
// por papel/RBAC — o meu-bolso não tem esse conceito).

export const DASHBOARD_ROUTE = '/dashboard';
export const TRANSACOES_ROUTE = '/transacoes';
export const CONTAS_ROUTE = '/contas';
export const CATEGORIAS_ROUTE = '/categorias';
export const ORCAMENTOS_ROUTE = '/orcamentos';
export const IMPORTAR_ROUTE = '/importar';

export const APP_NAVIGATION_SECTIONS: ModuleNavigationEntry[] = [
  {
    item: {
      id: 'meu-bolso',
      label: 'meu-bolso',
      shortLabel: 'MB',
      href: DASHBOARD_ROUTE,
      icon: LayoutDashboard,
    },
    sections: [
      {
        id: 'menu',
        label: 'Menu',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            href: DASHBOARD_ROUTE,
            icon: LayoutDashboard,
            match: 'exact',
          },
          {
            id: 'transacoes',
            label: 'Transações',
            href: TRANSACOES_ROUTE,
            icon: Receipt,
          },
          {
            id: 'contas',
            label: 'Contas',
            href: CONTAS_ROUTE,
            icon: Wallet,
          },
          {
            id: 'categorias',
            label: 'Categorias',
            href: CATEGORIAS_ROUTE,
            icon: Tags,
          },
          {
            id: 'orcamentos',
            label: 'Orçamentos',
            href: ORCAMENTOS_ROUTE,
            icon: PieChart,
          },
          {
            id: 'importar',
            label: 'Importar',
            href: IMPORTAR_ROUTE,
            icon: Upload,
          },
        ],
      },
    ],
  },
];
