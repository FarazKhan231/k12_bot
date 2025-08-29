// Application-specific page object
import { BasePage } from './BasePage.js'

export class AppPage extends BasePage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page)
    this.baseUrl = 'https://laviniagro1stg.wpengine.com/'
  }
  
  async goto() {
    await this.goto(this.baseUrl)
  }
  
  // Add application-specific methods here
  async login(username, password) {
    // Implement login functionality based on your app
    await this.fillInput('input[name="username"]', username)
    await this.fillInput('input[name="password"]', password)
    await this.clickElement('button[type="submit"]')
  }
  
  async waitForDashboard() {
    await this.waitForElement('text=Dashboard', 20000)
  }
}