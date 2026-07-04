// fluxo-critico.e2e.ts — fluxo critico ponta a ponta do meu-bolso:
// registro -> login -> criar conta -> importar CSV -> ver transacoes
// categorizadas -> dashboard renderiza KPI/grafico.
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { JoinPage } from '../pages/join.page';
import { AccountsPage } from '../pages/accounts.page';
import { ImportPage } from '../pages/import.page';
import { TransactionsPage } from '../pages/transactions.page';
import { DashboardPage } from '../pages/dashboard.page';
import { loginUser, createCategory, createCategorizationRule } from '../pages/api.helper';

// Este fluxo NAO usa o usuario logado do setup: cria conta nova para exercitar
// a tela de registro de verdade (isolamento total por execucao).
test.use({ storageState: { cookies: [], origins: [] } });

const CSV_FIXTURE = path.join(__dirname, '..', '..', 'fixtures', 'extrato-exemplo.csv');

test.describe('fluxo critico: registro -> login -> conta -> importacao -> transacoes -> dashboard', () => {
  test('cobre a jornada completa do usuario', async ({ page, request }) => {
    const unique = Date.now();
    const email = `e2e+${unique}@test.dev`;
    const password = 'Test1234!';
    const accountName = `Conta E2E ${unique}`;

    // 1) Registro via UI (tela /join)
    const join = new JoinPage(page);
    await join.goto();
    await join.register('Usuario Playwright', email, password);
    await expect(page.getByTestId('register-name')).toHaveValue('');

    // 2) Login via UI
    await join.login(email, password);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByTestId('app-shell')).toBeVisible();

    // 3) Criar conta via UI
    const accounts = new AccountsPage(page);
    await accounts.goto();
    await accounts.createAccount(accountName, 'checking');
    await expect(accounts.rows().filter({ hasText: accountName })).toBeVisible();

    // Regra de categorizacao de teste: criada via API antes da importacao,
    // para validar que a transacao importada chega ja categorizada.
    const token = await loginUser(request, { email, password });
    const category = await createCategory(request, token, {
      name: 'Transporte E2E',
      type: 'expense',
      color: '#f59e0b',
    });
    await createCategorizationRule(request, token, {
      keyword: 'MERCADO',
      categoryId: category.id,
    });

    // 4) Importar o CSV fixture, apontando para a conta criada
    const importPage = new ImportPage(page);
    await importPage.goto();
    await importPage.selectAccountByName(accountName);
    await importPage.uploadStatement(CSV_FIXTURE);
    await expect(importPage.resultSummary()).toBeVisible();

    // 5) Ver as transacoes na listagem, categorizadas quando houver regra
    const transactions = new TransactionsPage(page);
    await transactions.goto();
    await expect(transactions.rows().first()).toBeVisible();
    await expect(
      transactions.rows().filter({ hasText: 'MERCADO SUPERMERCADO' }).first(),
    ).toContainText('Transporte E2E');

    // 6) Abrir o dashboard e validar que KPI e grafico renderizaram com dados
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await expect(dashboard.kpiBalance()).toBeVisible();
    await expect(dashboard.chartCategory()).toBeVisible();
  });
});
