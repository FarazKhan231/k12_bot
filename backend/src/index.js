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
