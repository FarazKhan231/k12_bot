# Playwright Test Framework

## Generated for Ticket: DP-5532
## Business Unit: lavinia
## Base URL: https://laviniagro1stg.wpengine.com/

## Directory Structure
- `pages/` - Base Page Object Models
- `page-objects/` - Generated Page Object Models (from test scripts)
- `tests/` - Test files
- `fixtures/` - Test data and fixtures
- `utils/` - Utility functions
- `screenshots/` - Screenshots
- `reports/` - Test reports

## Running Tests
```bash
# Install dependencies
npm install

# Run all tests
npx playwright test

# Run specific test
npx playwright test tests/DP_5532.spec.js

# Run with specific browser
npx playwright test --project=chromium

# Generate report
npx playwright show-report
```

## Test Files
- `DP_5532.spec.js` - Main test file generated from JIRA ticket

## Page Objects
- `BasePage.js` - Base page with common functionality
- `AppPage.js` - Application-specific page object
- `page-objects/` - Auto-generated page objects from test scripts

## Utilities
- `TestUtils.js` - Test utility functions
- `testData.js` - Test data and fixtures
