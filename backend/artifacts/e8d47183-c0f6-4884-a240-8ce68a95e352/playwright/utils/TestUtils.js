// Test utilities and helpers
export class TestUtils {
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  static generateRandomEmail() {
    return `test${Date.now()}@example.com`
  }
  
  static formatDate(date = new Date()) {
    return date.toISOString().split('T')[0]
  }
}