// join.page.ts — Page Object da tela /join (registro + login em abas).
import type { Page } from '@playwright/test';

export class JoinPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/join');
  }

  async switchToRegister() {
    await this.page.getByTestId('join-tab-register').click();
  }

  async switchToLogin() {
    await this.page.getByTestId('join-tab-login').click();
  }

  async register(name: string, email: string, password: string) {
    await this.switchToRegister();
    await this.page.getByTestId('register-name').fill(name);
    await this.page.getByTestId('register-email').fill(email);
    await this.page.getByTestId('register-password').fill(password);
    await this.page.getByTestId('join-submit').click();
  }

  async login(email: string, password: string) {
    await this.switchToLogin();
    await this.page.getByTestId('login-email').fill(email);
    await this.page.getByTestId('login-password').fill(password);
    await this.page.getByTestId('login-submit').click();
  }
}
