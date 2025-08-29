/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  timeout: 60000,
  use: {
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000
  },
};
export default config;