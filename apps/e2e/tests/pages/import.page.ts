// import.page.ts — Page Object da tela /importar.
import type { Page } from '@playwright/test';

export class ImportPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/importar');
  }

  async selectAccountByName(accountName: string) {
    await this.page.getByTestId('import-account-select').selectOption({ label: accountName });
  }

  async uploadStatement(filePath: string) {
    await this.page.getByTestId('import-submit').setInputFiles(filePath);
  }

  resultSummary() {
    return this.page.getByTestId('import-result-summary');
  }
}
