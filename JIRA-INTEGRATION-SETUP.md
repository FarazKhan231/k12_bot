# JIRA Integration Setup Guide

## 🎯 What's New

The QA Agent now integrates with JIRA to:
1. **Fetch your assigned tickets** automatically
2. **Generate test cases** from ticket summary and description using AI
3. **Create Playwright scripts** from the generated test cases
4. **Download both** as CSV and JavaScript files

## 🔧 Setup Steps

### Step 1: Get Your JIRA API Token

1. Go to [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click **"Create API token"**
3. Give it a name: `QA Agent Integration`
4. Copy the generated token (starts with `ATATT...`)

### Step 2: Configure Environment Variables

Add these to your `backend/.env` file:

```bash
# JIRA Configuration
JIRA_HOST=your-domain.atlassian.net
JIRA_USERNAME=faraz.khan@yourcompany.com
JIRA_API_TOKEN=ATATT3xFfGF0...
```

**Example:**
```bash
JIRA_HOST=mycompany.atlassian.net
JIRA_USERNAME=faraz.khan@mycompany.com
JIRA_API_TOKEN=ATATT3xFfGF0abc123...
```

### Step 3: Restart the Backend

```bash
cd backend
npm run dev:safe
```

## 🚀 How to Use

### 1. Access JIRA Tickets
- Open the QA Agent UI
- Click the **"🎫 JIRA Tickets"** tab
- Your username is pre-filled as "Faraz.khan"
- Click **"Fetch Tickets"** to load your assigned tickets

### 2. Generate Test Cases
- Click on any ticket to select it
- Click **"Generate Test Cases"** button
- AI will analyze the ticket and create comprehensive test cases
- Test cases include:
  - Happy path scenarios
  - Edge cases and error conditions
  - User acceptance criteria
  - Cross-browser compatibility
  - Mobile responsiveness

### 3. Download Generated Content
- **Test Cases**: Download as CSV (can be opened in Excel)
- **Playwright Script**: Download as JavaScript file ready to run

## 📊 What You Get

### Generated Test Cases Format
```json
[
  {
    "testCaseId": "TC-001",
    "title": "User can successfully complete the main workflow",
    "priority": "High",
    "bddSteps": [
      "Given the user is on the application",
      "When they navigate to the main feature",
      "And they fill in required fields",
      "Then the form should submit successfully",
      "And a success message should appear"
    ]
  }
]
```

### Playwright Script Features
- Proper Playwright syntax and best practices
- Assertions and error handling
- Descriptive test names and comments
- Page object model principles
- Setup and teardown hooks

## 🔍 Troubleshooting

### Common Issues

**"Failed to fetch JIRA tickets"**
- Check your JIRA_HOST (should be like `company.atlassian.net`)
- Verify your username and API token
- Ensure your JIRA account has API access

**"Failed to generate test cases"**
- Check your OpenAI API key in `.env`
- Ensure the ticket has sufficient description content

**"No tickets found"**
- Verify the username matches your JIRA username exactly
- Check if you have any active assigned tickets
- Ensure tickets are not in "Done" or "Closed" status

### Debug Steps

1. **Check backend logs** for detailed error messages
2. **Verify JIRA credentials** in your `.env` file
3. **Test JIRA connection** manually with curl:
   ```bash
   curl -u "your-email:your-api-token" \
        "https://your-domain.atlassian.net/rest/api/2/myself"
   ```

## 📱 UI Features

### JIRA Tickets Tab
- **Username Input**: Change to fetch different users' tickets
- **Ticket List**: Shows priority, status, type, and last updated
- **Priority Colors**: High (red), Medium (yellow), Low (green)
- **Interactive Selection**: Click tickets to select them

### Generated Content Panel
- **Test Cases Display**: Formatted with BDD steps
- **Playwright Script**: Syntax-highlighted code preview
- **Download Buttons**: CSV for test cases, JS for Playwright
- **Real-time Generation**: Watch as AI creates content

## 🔄 Workflow Integration

### Complete Testing Workflow
1. **JIRA Ticket** → Create/assign ticket
2. **Generate Test Cases** → AI creates comprehensive test scenarios
3. **Download Test Cases** → Save as CSV for manual review
4. **Download Playwright** → Ready-to-run automation script
5. **Run Tests** → Execute with Playwright or import to QA Agent

### Benefits
- **Faster Test Creation**: AI generates test cases in seconds
- **Consistent Coverage**: Systematic approach to test planning
- **Immediate Execution**: Playwright scripts ready to run
- **Documentation**: Test cases automatically documented
- **Traceability**: Link tests back to JIRA tickets

## 🚀 Next Steps

### Customization Options
- **Modify AI Prompts**: Edit prompts in `jiraService.js`
- **Add Test Templates**: Customize test case generation
- **Integrate with CI/CD**: Use generated Playwright scripts in pipelines
- **Add More Fields**: Include additional JIRA fields in test generation

### Advanced Features
- **Bulk Generation**: Generate test cases for multiple tickets
- **Test Case Management**: Store and version generated test cases
- **Automated Execution**: Run generated tests automatically
- **Reporting Integration**: Link test results back to JIRA

## 📞 Support

If you encounter issues:
1. Check the backend console logs
2. Verify all environment variables are set
3. Test JIRA API access manually
4. Ensure OpenAI API key is valid

The integration is designed to be robust and provide clear error messages for troubleshooting.
