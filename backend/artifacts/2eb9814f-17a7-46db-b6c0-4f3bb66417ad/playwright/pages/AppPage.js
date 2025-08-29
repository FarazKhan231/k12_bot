export class AppPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page){ this.page = page }
  async goto(){ await this.page.goto('https://laviniagro1stg.wpengine.com/', { waitUntil: 'networkidle' }) }
}