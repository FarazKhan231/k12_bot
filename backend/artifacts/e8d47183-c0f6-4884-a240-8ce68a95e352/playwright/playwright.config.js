/** @type {import('@playwright/test').PlaywrightTestConfig} */
import { devices } from '@playwright/test';

const config = {
  testDir: './tests',
  timeout: 30000, // 30 seconds per test
  retries: 1,
  workers: 1,
  reporter: [
    ['html'],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/results.xml' }]
  ],
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },
  use: {
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000, // 10 seconds for actions
    navigationTimeout: 30000, // 30 seconds for navigation
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
}

export default config