// transactions.page.ts — Page Object da tela /transacoes.
import type { Page } from '@playwright/test';

export class TransactionsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/transacoes');
  }

  rows() {
    return this.page.getByTestId('transactions-table-row');
  }

  categoryBadges() {
    return this.page.getByTestId('transaction-category-badge');
  }
}
