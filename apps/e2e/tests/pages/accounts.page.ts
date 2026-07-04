// accounts.page.ts — Page Object da tela /contas.
import type { Page } from '@playwright/test';

export class AccountsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/contas');
  }

  async createAccount(name: string, type: 'checking' | 'savings' | 'wallet' | 'credit' = 'checking') {
    await this.page.getByTestId('accounts-create-button').click();
    await this.page.getByTestId('account-form-name').fill(name);
    await this.page.getByTestId('account-form-type').click();
    await this.page.getByTestId(`account-form-type-option-${type}`).click();
    await this.page.getByTestId('account-form-submit').click();
  }

  rows() {
    return this.page.getByTestId('accounts-list-row');
  }
}
