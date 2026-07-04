// Rotas das seções do produto meu-bolso. Passam a existir a partir das
// mudanças 005-011; aqui a navegação é apenas config estática (sem gating
// por papel/RBAC — o meu-bolso não tem esse conceito).
//
// Os ícones seguem os nomes do Material Symbols Rounded usados no mockup
// (changes-templates/011-dashboard-graficos/mockups/dashboard/meu-bolso.dc.html,
// linhas 136-142).

export const DASHBOARD_ROUTE = '/dashboard';
export const TRANSACOES_ROUTE = '/transacoes';
export const CONTAS_ROUTE = '/contas';
export const CATEGORIAS_ROUTE = '/categorias';
export const ORCAMENTOS_ROUTE = '/orcamentos';
export const IMPORTAR_ROUTE = '/importar';

export type AppNavItem = {
  id: string;
  label: string;
  href: string;
  icon: string;
  match: 'exact' | 'prefix';
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: DASHBOARD_ROUTE, icon: 'dashboard', match: 'exact' },
  { id: 'transacoes', label: 'Transações', href: TRANSACOES_ROUTE, icon: 'receipt_long', match: 'prefix' },
  { id: 'contas', label: 'Contas', href: CONTAS_ROUTE, icon: 'account_balance_wallet', match: 'prefix' },
  { id: 'categorias', label: 'Categorias', href: CATEGORIAS_ROUTE, icon: 'sell', match: 'prefix' },
  { id: 'orcamentos', label: 'Orçamentos', href: ORCAMENTOS_ROUTE, icon: 'donut_small', match: 'prefix' },
  { id: 'importar', label: 'Importar', href: IMPORTAR_ROUTE, icon: 'upload_file', match: 'prefix' },
];

export const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  [DASHBOARD_ROUTE]: { title: 'Dashboard', subtitle: 'Visão geral das suas finanças' },
  [TRANSACOES_ROUTE]: { title: 'Transações', subtitle: 'Receitas e despesas lançadas' },
  [CONTAS_ROUTE]: { title: 'Contas', subtitle: 'Contas correntes, poupanças e carteiras' },
  [CATEGORIAS_ROUTE]: { title: 'Categorias', subtitle: 'Organização e regras de categorização' },
  [ORCAMENTOS_ROUTE]: { title: 'Orçamentos', subtitle: 'Limites de gastos por categoria' },
  [IMPORTAR_ROUTE]: { title: 'Importar', subtitle: 'Importação de extratos CSV e OFX' },
};
