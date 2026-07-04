// auth.setup.ts — registra um usuario unico e persiste o estado autenticado
// em .auth/user.json. Os demais projetos (chromium) herdam esse storageState.
import { test as setup, expect } from '@playwright/test';
import { JoinPage } from './pages/join.page';

const STORAGE = '.auth/user.json';

setup('registra e autentica, salvando o estado', async ({ page }) => {
  const unique = Date.now();
  const email = `e2e.setup+${unique}@test.dev`;
  const password = 'Test1234!';

  const join = new JoinPage(page);
  await join.goto();
  await join.register('Usuario Setup Playwright', email, password);

  // apos o registro, o formulario limpa os campos (confirmacao via toast);
  // login em seguida com as credenciais recem-criadas.
  await expect(page.getByTestId('register-name')).toHaveValue('');

  await join.login(email, password);

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId('app-shell')).toBeVisible();

  await page.context().storageState({ path: STORAGE });
});
