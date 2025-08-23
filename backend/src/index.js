import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import xlsx from 'xlsx'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createRunner } from './testRunner.js'
import { JiraService } from './jiraService.js'
import { v4 as uuidv4 } from 'uuid'
import fetch from 'node-fetch'
import { exec, spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const jiraService = new JiraService()

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }))

// Serve artifacts (screenshots/videos) statically
const artifactsDir = path.join(__dirname, '..', 'artifacts')
fs.mkdirSync(artifactsDir, { recursive: true })
app.use('/artifacts', express.static(artifactsDir))

// CORS for local dev
app.use((req, res, next)=>{
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if(req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(artifactsDir, 'uploads')
    fs.mkdirSync(dir, {recursive: true})
    cb(null, dir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    cb(null, uuidv4() + ext)
  }
})
const upload = multer({ storage })

app.get('/api/health', (_, res)=> res.json({ok: true}))

// Playwright Script Generation Only
app.post('/api/playwright/generate', async (req, res) => {
  try {
    const { testScenario, url, testType } = req.body
    
    if (!testScenario || !url) {
      return res.status(400).json({ 
        error: 'testScenario and url are required' 
      })
    }

    console.log('🎭 Generating Playwright script for:', testScenario)
    
    // Generate Playwright script using OpenAI
    const script = await generatePlaywrightScript(testScenario, url, testType)
    
    res.json({
      success: true,
      script,
      testScenario,
      url,
      testType
    })
    
  } catch (error) {
    console.error('Playwright generation failed:', error)
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to generate Playwright script'
    })
  }
})

// Playwright Script Generation and Execution
app.post('/api/playwright/generate-and-run', async (req, res) => {
  try {
    const { testScenario, url, projectId, testType } = req.body
    
    if (!testScenario || !url) {
      return res.status(400).json({ 
        error: 'testScenario and url are required' 
      })
    }

    console.log('🎭 Generating Playwright script for:', testScenario)
    
    // Generate Playwright script using OpenAI
    const script = await generatePlaywrightScript(testScenario, url, testType)
    
    // Create a unique run ID
    const runId = uuidv4()
    const runDir = path.join(artifactsDir, runId)
    const scriptPath = path.join(runDir, 'test.spec.js')
    
    // Ensure directory exists
    fs.mkdirSync(runDir, { recursive: true })
    
    // Write the script to file
    fs.writeFileSync(scriptPath, script, 'utf8')
    
    // Run the Playwright test
    const result = await runPlaywrightTest(scriptPath, runDir)
    
    res.json({
      success: true,
      runId,
      script,
      result,
      reportUrl: `/artifacts/${runId}/report.html`
    })
    
  } catch (error) {
    console.error('Playwright generation/execution failed:', error)
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to generate or run Playwright script'
    })
  }
})

// Generate Playwright script from test scenario
async function generatePlaywrightScript(testScenario, url, testType = 'functional') {
  const prompt = `Generate a complete Playwright test script for the following test scenario:

Test Scenario: ${testScenario}
URL: ${url}
Test Type: ${testType}

Requirements:
1. Create a complete, runnable Playwright test
2. Include proper imports and setup
3. Add meaningful assertions and checks
4. Handle errors gracefully
5. Include screenshots at key points
6. Make it robust and reliable

Return ONLY the JavaScript code, no explanations or markdown.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a Playwright testing expert. Generate only valid JavaScript code.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('OpenAI API call failed:', error)
    // Fallback to a basic template
    return generateFallbackScript(testScenario, url)
  }
}

// Fallback script template
function generateFallbackScript(testScenario, url) {
  return `import { test, expect } from '@playwright/test';

test('${testScenario.replace(/[^a-zA-Z0-9\s]/g, ' ').trim()}', async ({ page }) => {
  // Navigate to the URL
  await page.goto('${url}');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take initial screenshot
  await page.screenshot({ path: '01_initial.png', fullPage: true });
  
  // Basic page validation
  await expect(page).toHaveTitle(/./);
  
  // Add your test steps here based on: ${testScenario}
  
  // Example: Check if page contains expected content
  // await expect(page.locator('body')).toContainText('expected text');
  
  // Final screenshot
  await page.screenshot({ path: '02_final.png', fullPage: true });
});`
}

// Run Playwright test
async function runPlaywrightTest(scriptPath, runDir) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright', 'test', scriptPath, '--reporter=html'], {
      cwd: runDir,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          exitCode: code,
          output: stdout,
          errors: stderr
        })
      } else {
        resolve({
          success: false,
          exitCode: code,
          output: stdout,
          errors: stderr
        })
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

// JIRA API endpoints
app.get('/api/jira/test-connection', async (req, res) => {
  try {
    if (!jiraService.jira) {
      return res.status(500).json({ 
        success: false, 
        error: 'JIRA client not initialized',
        config: {
          host: process.env.JIRA_HOST || 'Not set',
          username: process.env.JIRA_USERNAME || 'Not set',
          hasToken: !!process.env.JIRA_API_TOKEN
        }
      })
    }

    // Test JIRA connection by getting current user
    const user = await jiraService.jira.getCurrentUser()
    res.json({ 
      success: true, 
      user: user.displayName,
      email: user.emailAddress,
      config: {
        host: process.env.JIRA_HOST,
        username: process.env.JIRA_USERNAME,
        hasToken: !!process.env.JIRA_API_TOKEN
      }
    })
  } catch (error) {
    console.error('JIRA connection test failed:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message,
      config: {
        host: process.env.JIRA_HOST || 'Not set',
        username: process.env.JIRA_USERNAME || 'Not set',
        hasToken: !!process.env.JIRA_API_TOKEN
      }
    })
  }
})

app.get('/api/jira/tickets/:username', async (req, res) => {
  try {
    const { username } = req.params
    const tickets = await jiraService.getAssignedTickets(username)
    res.json(tickets)
  } catch (error) {
    console.error('Error fetching JIRA tickets:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/jira/ticket/:ticketKey', async (req, res) => {
  try {
    const { ticketKey } = req.params
    const ticket = await jiraService.getTicketDetails(ticketKey)
    res.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket details:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/jira/generate-test-cases', async (req, res) => {
  try {
    const { summary, description } = req.body
    const testCases = await jiraService.generateTestCasesFromTicket(summary, description)
    res.json(testCases)
  } catch (error) {
    console.error('Error generating test cases:', error)
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/jira/generate-playwright', async (req, res) => {
  try {
    const { testCases } = req.body
    const playwrightScript = await jiraService.generatePlaywrightScript(testCases)
    res.json({ script: playwrightScript })
  } catch (error) {
    console.error('Error generating Playwright script:', error)
    res.status(500).json({ error: error.message })
  }
})

// Playwright materialization: write files and run tests
app.post('/api/playwright/materialize', async (req, res) => {
  try {
    const { files } = req.body // [{ path: 'tests/file.spec.js', content: '...' }, ...]
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' })
    }
    const baseDir = path.join(__dirname, '..', 'playwright')
    for (const f of files) {
      const filePath = path.join(baseDir, f.path)
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
      fs.writeFileSync(filePath, f.content, 'utf8')
    }
    res.json({ ok: true, baseDir })
  } catch (err) {
    console.error('Materialize error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/playwright/run', async (req, res) => {
  try {
    const baseDir = path.join(__dirname, '..', 'playwright')
    const backendRoot = path.join(__dirname, '..')
    const testsDir = path.join(baseDir, 'tests')
    const configPath = path.join(baseDir, 'playwright.config.js')

    let output = ''

    const runCmd = (command, args, cwd) => new Promise((resolve) => {
      const child = spawn(command, args, { cwd, shell: true })
      child.stdout.on('data', (d) => { output += d.toString() })
      child.stderr.on('data', (d) => { output += d.toString() })
      child.on('close', (code) => resolve(code))
    })

    // Ensure browsers installed (no-op if already installed)
    await runCmd('npx', ['--yes', 'playwright', 'install', '--with-deps'], backendRoot)

    // Run tests pointing to tests directory and explicit config
    const code = await runCmd('npx', ['--yes', 'playwright', 'test', testsDir, `--config=${configPath}`, '--reporter=list'], backendRoot)

    res.json({ code, output })
  } catch (err) {
    console.error('Run error:', err)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/test-runs', upload.fields([
  { name: 'screenshot', maxCount: 1 },
  { name: 'testCases', maxCount: 1 }
]), async (req, res) => {
  try{
    const runId = uuidv4()
    const {
      projectId,
      projectName,
      testType,
      targetKind,
      url,
      basicAuthUser,
      basicAuthPass
    } = req.body

    const screenshotPath = req.files?.screenshot?.[0]?.path || null
    const testCasesPath = req.files?.testCases?.[0]?.path || null

    const runner = createRunner({
      runId,
      projectId,
      projectName,
      testType,
      targetKind,
      url,
      screenshotPath,
      testCasesPath,
      basicAuthUser: basicAuthUser || null,
      basicAuthPass: basicAuthPass || null
    })

    // Fire-and-forget (non-blocking). Logs errors to server console.
    runner.start().catch(err=>{
      console.error('Runner error', err)
    })

    res.json({ runId })
  }catch(err){
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

const port = process.env.PORT || 8787
app.listen(port, () => {
  console.log('Backend listening on http://localhost:' + port)
})
