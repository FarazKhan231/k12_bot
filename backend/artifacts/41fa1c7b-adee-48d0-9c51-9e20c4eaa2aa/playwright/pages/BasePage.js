// Base page object with common functionality
export class BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page
  }
  
  async goto(url) {
    await this.page.goto(url, { waitUntil: 'networkidle' })
  }
  
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle')
  }
  
  async takeScreenshot(name) {
    const screenshotPath = `screenshots/${name}-${Date.now()}.png`
    await this.page.screenshot({ path: screenshotPath, fullPage: true })
    return screenshotPath
  }
  
  async waitForElement(selector, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout })
  }
  
  async clickElement(selector) {
    await this.page.click(selector)
  }
  
  async fillInput(selector, text) {
    await this.page.fill(selector, text)
  }
  
  async getText(selector) {
    return await this.page.textContent(selector)
  }
}