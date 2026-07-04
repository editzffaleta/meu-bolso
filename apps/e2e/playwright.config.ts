// playwright.config.ts — sobe backend (:4000) e frontend (:3000) e roda os specs
// no chromium, reusando o storageState salvo pelo projeto "setup".
import { defineConfig, devices } from '@playwright/test';

const FRONTEND_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const BACKEND_URL = process.env.E2E_API_URL ?? 'http://localhost:4000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    testIdAttribute: 'data-testid',
  },
  projects: [
    // 1) loga uma vez e salva o storageState
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    // 2) jornadas autenticadas reusam o estado
    {
      name: 'chromium',
      testMatch: /.*\.e2e\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  // sobe os dois apps; em CI prefira um job que ja deixou tudo em pe.
  webServer: [
    {
      command: 'npm --workspace apps/backend run start:dev',
      cwd: '../..',
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm --workspace apps/frontend run dev',
      cwd: '../..',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
