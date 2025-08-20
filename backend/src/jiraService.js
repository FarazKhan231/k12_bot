import JiraApi from 'jira-client'
import { OpenAI } from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })



export class JiraService {
  constructor() {
    this.jira = null
    this.initializeJira()
  }

  initializeJira() {
    try {
      console.log('JIRA Configuration check:')
      console.log('- JIRA_HOST:', process.env.JIRA_HOST ? 'Set' : 'Missing')
      console.log('- JIRA_USERNAME:', process.env.JIRA_USERNAME ? 'Set' : 'Missing')
      console.log('- JIRA_API_TOKEN:', process.env.JIRA_API_TOKEN ? 'Set' : 'Missing')

      if (!process.env.JIRA_HOST || !process.env.JIRA_USERNAME || !process.env.JIRA_API_TOKEN) {
        throw new Error('JIRA configuration missing. Please set JIRA_HOST, JIRA_USERNAME, and JIRA_API_TOKEN in your .env file')
      }

      this.jira = new JiraApi({
        protocol: 'https',
        host: process.env.JIRA_HOST,
        username: process.env.JIRA_USERNAME,
        password: process.env.JIRA_API_TOKEN,
        apiVersion: '2',
        strictSSL: true
      })
      console.log('JIRA client initialized successfully')
    } catch (error) {
      console.error('Failed to initialize JIRA client:', error)
      this.jira = null
    }
  }

  // Fetch tickets assigned to a specific user
  async getAssignedTickets(username) {
    if (!this.jira) {
      throw new Error('JIRA client not initialized. Check your JIRA configuration.')
    }

    try {
      console.log(`Fetching tickets for user: ${username}`)
      console.log(`JIRA Host: ${process.env.JIRA_HOST}`)
      
      const jql = `assignee = "${username}" AND status != "Done" AND status != "Closed" ORDER BY priority DESC, updated DESC`
      console.log(`JQL Query: ${jql}`)
      
      const issues = await this.jira.searchJira(jql, {
        maxResults: 50,
        fields: ['summary', 'description', 'priority', 'status', 'issuetype', 'key', 'updated']
      })

      console.log(`Found ${issues.issues?.length || 0} tickets`)

      return (issues.issues || []).map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description || 'No description provided',
        priority: issue.fields.priority?.name || 'Medium',
        status: issue.fields.status?.name || 'Unknown',
        type: issue.fields.issuetype?.name || 'Task',
        updated: issue.fields.updated,
        url: `https://${process.env.JIRA_HOST}/browse/${issue.key}`
      }))
    } catch (error) {
      console.error('Error fetching JIRA tickets:', error)
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        statusText: error.statusText,
        response: error.response
      })
      
      if (error.statusCode === 401) {
        throw new Error('JIRA authentication failed. Check your username and API token.')
      } else if (error.statusCode === 403) {
        throw new Error('JIRA access denied. Check your permissions.')
      } else if (error.statusCode === 404) {
        throw new Error('JIRA host not found. Check your JIRA_HOST configuration.')
      } else {
        throw new Error(`Failed to fetch JIRA tickets: ${error.message || 'Unknown error'}`)
      }
    }
  }

  // Generate test cases from JIRA ticket using AI
  async generateTestCasesFromTicket(ticketSummary, ticketDescription) {
    try {
      const prompt = `You are a senior QA engineer. Based on this JIRA ticket, generate comprehensive test cases in BDD (Behavior-Driven Development) format.

Ticket Summary: ${ticketSummary}
Ticket Description: ${ticketDescription}

Generate test cases that cover:
1. Happy path scenarios
2. Edge cases and error conditions
3. User acceptance criteria
4. Cross-browser compatibility
5. Mobile responsiveness (if applicable)

Format each test case as a BDD scenario with Given-When-Then steps. Use natural language that can be executed by a browser automation tool.

Return the response as a JSON array with this structure:
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
]`

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a QA expert. Generate only valid JSON test cases.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const content = response.choices[0].message.content
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      } else {
        throw new Error('AI response was not in expected JSON format')
      }
    } catch (error) {
      console.error('Error generating test cases:', error)
      throw new Error(`Failed to generate test cases: ${error.message}`)
    }
  }

  // Generate Playwright script from test cases
  async generatePlaywrightScript(testCases) {
    try {
      const prompt = `You are a Playwright expert. Convert these BDD test cases into a working Playwright script.

Test Cases: ${JSON.stringify(testCases, null, 2)}

Generate a complete Playwright test file that:
1. Uses proper Playwright syntax and best practices
2. Includes proper assertions and error handling
3. Has descriptive test names and comments
4. Uses page object model principles
5. Includes setup and teardown hooks

Return only the Playwright script code, no explanations.`

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a Playwright expert. Generate only valid Playwright test code.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 3000
      })

      return response.choices[0].message.content
    } catch (error) {
      console.error('Error generating Playwright script:', error)
      throw new Error(`Failed to generate Playwright script: ${error.message}`)
    }
  }

  // Get ticket details by key
  async getTicketDetails(ticketKey) {
    try {
      const issue = await this.jira.findIssue(ticketKey)
      return {
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description || 'No description provided',
        priority: issue.fields.priority?.name || 'Medium',
        status: issue.fields.status?.name || 'Unknown',
        type: issue.fields.issuetype?.name || 'Task',
        assignee: issue.fields.assignee?.displayName || 'Unassigned',
        reporter: issue.fields.reporter?.displayName || 'Unknown',
        created: issue.fields.created,
        updated: issue.fields.updated,
        url: `${process.env.JIRA_HOST}/browse/${issue.key}`
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error)
      throw new Error(`Failed to fetch ticket details: ${error.message}`)
    }
  }
}
