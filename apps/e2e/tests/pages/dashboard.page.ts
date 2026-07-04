// dashboard.page.ts — Page Object da tela /dashboard.
import type { Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  kpiBalance() {
    return this.page.getByTestId('dashboard-kpi-balance');
  }

  chartCategory() {
    return this.page.getByTestId('dashboard-chart-category');
  }
}
