import { OpenAI } from 'openai'
import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import fetch from 'node-fetch'
import { chromium } from 'playwright'
import { testingProfiles } from './testingProfiles.js'
import xlsx from 'xlsx'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const artifactsRoot = path.resolve(process.cwd(), 'artifacts')

// ---- Rate-limit settings (tweak via .env) ----
const AGENT_BATCH_SIZE = Number(process.env.AGENT_BATCH_SIZE || 4)       // how many actions GPT returns per call
const OPENAI_MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES || 5)   // how many 429 retries
const OPENAI_MIN_GAP_MS = Number(process.env.OPENAI_MIN_GAP_MS || 0)     // force spacing between calls (e.g., 22000 for 3 RPM)
// ------------------------------------------------

function nowISO(){ return new Date().toISOString() }

function slackNotify(blocks){
  const url = process.env.SLACK_WEBHOOK_URL
  if(!url) {
    console.log('Slack webhook not configured, skipping notification')
    return
  }
  console.log('Slack notification sent:', JSON.stringify(blocks, null, 2))
  return fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ blocks })
  }).catch(err => console.warn('Slack notify failed:', err?.message || err))
}

// Fail-safe email
async function emailNotify({subject, html, attachments=[]}){
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env
  if(!(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && MAIL_FROM && MAIL_TO)){
    console.log('Email not configured; skipping.')
    return
  }
  const secure = String(SMTP_PORT) === '465'
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  })
  try{
    await transporter.sendMail({ from: MAIL_FROM, to: MAIL_TO, subject, html, attachments })
  }catch(err){
    console.warn('Email notify failed:', err?.code || err?.message || err)
  }
}

function artifactLink(rel){
  const base = process.env.PUBLIC_BASE_URL || 'http://localhost:8787'
  return base.replace(/\/$/,'') + '/artifacts/' + rel.replace(/^\//,'')
}
function relFromArtifacts(absPath) {
  return path.relative(path.resolve(process.cwd(), 'artifacts'), absPath).replace(/\\/g, '/')
}
function publicUrlFromAbs(absPath) {
  return artifactLink(relFromArtifacts(absPath))
}
// ---------- Test case ingestion (Excel) ----------
function toLowerKeys(obj){
  const out = {}
  for(const k of Object.keys(obj||{})) out[String(k).toLowerCase()] = obj[k]
  return out
}
function normalizeDecisionFromRow(row){
  const r = toLowerKeys(row)
  const action = String(r.action || '').toLowerCase()
  const notes = r.notes || ''
  const value = r.value ?? null
  const selector = r.selector || r.css || null
  const id = r.targetid || r.id || null
  const name = r.name || null
  const placeholder = r.placeholder || null
  const text = r.text || r.label || null
  const press = r.press || null
  const navigate = r.navigate || null
  const decision = { action, notes }
  if (value != null) decision.value = value
  if (press) { decision.action = 'press'; decision.value = press }
  if (navigate) { decision.action = 'navigate'; decision.value = navigate }
  if (selector) decision.selector = selector
  if (id || name || placeholder || text) decision.target = { id, name, placeholder, text }
  return decision
}
// Very simple BDD line -> decisions
function parseBddLine(line){
  const t = String(line || '').trim()
  if(!t) return []
  
  console.log(`BDD parsing line: "${t}"`)
  
  // ignore purely descriptive givens
  if(/^given\b/i.test(t) && /logged\s*in|login|authenticated/i.test(t)) {
    console.log(`BDD parsing: ignored Given line as note`)
    return [{ action: 'note', notes: t }]
  }
  
  // navigate to URL
  const navUrl = t.match(/navigate(?:s|d)?\s*(?:to|towards)\s+(https?:[^\s]+|\/[\w\-\/]+)\b/i)
  if(navUrl) {
    console.log(`BDD parsing: detected navigate action to "${navUrl[1]}"`)
    return [{ action: 'navigate', value: navUrl[1], notes: t }]
  }
  
  // hover over text
  const hov = t.match(/hover(?:s|ed)?\s*(?:over|on)\s+(.+)/i)
  if(hov) {
    console.log(`BDD parsing: detected hover action over "${hov[1].trim()}"`)
    return [{ action: 'hover', text: hov[1].trim(), notes: t }]
  }
  
  // click/select/open/go to <text>
  const clickText = t.match(/\b(click|select|choose|open|go to)\b\s+(.+)/i)
  if(clickText) {
    console.log(`BDD parsing: detected click action on "${clickText[2].trim()}"`)
    return [{ action: 'click', text: clickText[2].trim(), notes: t }]
  }
  
  // fill <field> with <value>
  const fill = t.match(/fill\s+(.+?)\s+with\s+(.+)/i)
  if(fill) {
    console.log(`BDD parsing: detected fill action for "${fill[1].trim()}" with "${fill[2].trim()}"`)
    return [{ action: 'fill', target: { placeholder: fill[1].trim(), name: fill[1].trim() }, value: fill[2].trim(), notes: t }]
  }
  
  // press key
  const press = t.match(/\bpress\b\s+(Enter|Tab|Escape|Space|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)/i)
  if(press) {
    console.log(`BDD parsing: detected press action for key "${press[1]}"`)
    return [{ action: 'press', value: press[1], notes: t }]
  }
  
  // expectation: Then/Expect/Should see <text>
  const exp = t.match(/\b(then|expect|should\s+see)\b\s+(.+)/i)
  if(exp) {
    console.log(`BDD parsing: detected assertText action for "${exp[2].trim()}"`)
    return [{ action: 'assertText', value: exp[2].trim(), notes: t }]
  }
  
  // default: try to click matching text
  console.log(`BDD parsing: defaulting to click action on "${t}"`)
  return [{ action: 'click', text: t }]
}
function expandBddToDecisions(bddCell){
  const lines = String(bddCell || '').split(/\r?\n+/)
  const out = []
  for(const line of lines){
    out.push(...parseBddLine(line))
  }
  return out
}
function parseTestCasesFromXlsx(filePath, testType){
  try{
    const wb = xlsx.readFile(filePath)
    const want = String(testType || '').toLowerCase()
    let sheetName = wb.SheetNames.find(n => String(n).toLowerCase() === want)
    if (!sheetName) sheetName = wb.SheetNames.find(n => String(n).toLowerCase() === 'all')
    if (!sheetName) sheetName = wb.SheetNames[0]
    console.log(`Excel parsing: found sheets [${wb.SheetNames.join(', ')}], selected "${sheetName}" for test type "${testType}"`)
    
    const ws = wb.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(ws, { defval: '' })
    console.log(`Excel parsing: found ${rows.length} rows in sheet "${sheetName}"`)
    
    const filtered = (String(sheetName).toLowerCase() === want)
      ? rows
      : rows.filter(row => {
          const r = toLowerKeys(row)
          const suite = String(r.suite || r.type || r.category || 'all').toLowerCase()
          return suite === 'all' || suite === '' || suite === want
        })
    console.log(`Excel parsing: filtered to ${filtered.length} rows`)
    
    // If a BDD column exists, expand it into decisions; else use action/selector/value columns
    const hasBdd = filtered.length && Object.keys(toLowerKeys(filtered[0])).some(k => /bdd|test\s*script/i.test(k))
    console.log(`Excel parsing: BDD detection - hasBdd=${hasBdd}, columns=${filtered.length ? Object.keys(filtered[0]).join(', ') : 'none'}`)
    
    if (hasBdd) {
      const key = Object.keys(toLowerKeys(filtered[0])).find(k => /bdd|test\s*script/i.test(k))
      console.log(`Excel parsing: BDD column key="${key}"`)
      console.log(`Excel parsing: First row data:`, JSON.stringify(filtered[0], null, 2))
      
      const all = []
      for(const row of filtered){
        // Try multiple ways to get the BDD text
        let bddText = null
        
        // Method 1: Direct key access
        if (row[key]) {
          bddText = row[key]
        }
        // Method 2: Case-insensitive key search
        else {
          const foundKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase())
          if (foundKey) {
            bddText = row[foundKey]
          }
        }
        // Method 3: Look for any column containing BDD-like content
        if (!bddText) {
          for (const colKey of Object.keys(row)) {
            const value = row[colKey]
            if (value && typeof value === 'string' && value.length > 20 && 
                (value.includes('Given') || value.includes('When') || value.includes('Then') || 
                 value.includes('navigate') || value.includes('click') || value.includes('hover'))) {
              bddText = value
              console.log(`Excel parsing: Found BDD content in column "${colKey}"`)
              break
            }
          }
        }
        
        console.log(`Excel parsing: BDD text from row: "${bddText}"`)
        
        if (bddText && bddText !== 'undefined' && bddText.trim()) {
          const decisions = expandBddToDecisions(bddText)
          console.log(`Excel parsing: expanded to ${decisions.length} decisions:`, decisions)
          all.push(...decisions)
        } else {
          console.log(`Excel parsing: Skipping empty/undefined BDD text`)
        }
      }
      console.log(`Excel parsing: total decisions: ${all.length}`)
      return all
    }
    return filtered.map(normalizeDecisionFromRow).filter(d => d.action)
  }catch(err){
    console.warn('Failed to parse Excel test cases:', err?.message || err)
    return []
  }
}

// ---------- UI/Report helpers ----------
function buildAssetsIndexHTML({ projectName, runId, files }) {
  const items = files.map(f =>
    `<li><a href="${f.url}" target="_blank" rel="noopener">${f.filename}</a> <small>(${f.type})</small></li>`
  ).join('\n')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Assets · ${projectName} · ${runId}</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;background:#f7f7fb;color:#111}
  h1{margin:0 0 8px}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px}
  ul{line-height:1.7}
</style>
</head>
<body>
  <h1>Assets</h1>
  <div class="card">
    <p><strong>Project:</strong> ${projectName} &nbsp; <strong>Run:</strong> ${runId}</p>
    <ul>${items}</ul>
  </div>
</body>
</html>`
}

function buildReportHTML({ projectName, testType, startedAt, plan, checks = [], heuristics = [], artifacts = [], actions = [] }) {
  const imgs = artifacts.filter(a => a.type === 'screenshot')
  const vids = artifacts.filter(a => a.type === 'video')

  const imgHtml = imgs.map(a =>
    `<figure style="margin:0 0 24px">
       <img src="${a.url}" alt="${a.filename}" style="max-width:100%;border-radius:12px;border:1px solid #e5e7eb"/>
       <figcaption style="color:#6b7280;font-size:12px">${a.filename}</figcaption>
     </figure>`
  ).join('\n')

  const vidHtml = vids.map(a =>
    `<div style="margin:0 0 24px">
       <video controls src="${a.url}" style="max-width:100%;border-radius:12px;border:1px solid #e5e7eb"></video>
       <div style="color:#6b7280;font-size:12px">${a.filename}</div>
     </div>`
  ).join('\n')

  const total = actions.length
  const passed = actions.filter(a => a.status === 'ok').length
  const failed = actions.filter(a => a.status === 'error').length

  const checksHtml = (checks || []).map(c =>
    `<li><strong>${c.title || c.id}</strong>${c.rationale ? ` — <em>${c.rationale}</em>` : ''}</li>`
  ).join('\n')

  const heurHtml = (heuristics || []).map(h => `<li>${h}</li>`).join('\n')

  const actionRows = actions.map((a,i) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${i+1}</td>
      <td style="padding:8px;border-bottom:1px solid #eee"><code>${a.action}</code></td>
      <td style="padding:8px;border-bottom:1px solid #eee">${a.target?.label || a.target?.selector || a.target?.uid || ''}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${a.value ?? ''}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${a.status}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;color:#6b7280">${a.notes || ''}</td>
    </tr>`).join('')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>${projectName} · ${testType} Report</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;background:#f7f7fb;color:#111}
  h1{margin:0 0 8px}
  .grid{display:grid;grid-template-columns:1fr;gap:16px}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px}
  .muted{color:#6b7280}
  table{width:100%;border-collapse:collapse}
  th,td{font-size:14px}
  th{background:#f3f4f6;text-align:left;padding:8px;border-bottom:1px solid #e5e7eb}
  .metrics{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
  .badge{display:inline-block;border-radius:999px;padding:6px 12px;font-weight:600;border:1px solid #e5e7eb}
  .ok{background:#ecfdf5;color:#065f46;border-color:#a7f3d0}
  .fail{background:#fef2f2;color:#991b1b;border-color:#fecaca}
</style>
</head>
<body>
  <h1>${projectName} · ${testType} Report</h1>
  <p class="muted">Started: ${startedAt}</p>

  <div class="grid">
    <div class="card">
      <h2>Summary</h2>
      <div class="metrics">
        <span class="badge">Total steps: ${total}</span>
        <span class="badge ok">Passed: ${passed}</span>
        <span class="badge fail">Failed: ${failed}</span>
      </div>
    </div>

    <div class="card">
      <h2>Plan</h2>
      <div>${plan ? String(plan).replace(/\n/g,'<br/>') : '—'}</div>
    </div>

    <div class="card">
      <h2>Checks</h2>
      <ol>${checksHtml || '<li>—</li>'}</ol>
      <h3>Heuristics</h3>
      <ul>${heurHtml || '<li>—</li>'}</ul>
    </div>

    <div class="card">
      <h2>Actions</h2>
      <table>
        <thead><tr><th>#</th><th>Action</th><th>Target</th><th>Value</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>${actionRows || '<tr><td colspan="6" class="muted" style="padding:8px">—</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Video</h2>
      ${vidHtml || '<p class="muted">No video captured.</p>'}
    </div>

    <div class="card">
      <h2>Screenshots</h2>
      ${imgHtml || '<p class="muted">No screenshots.</p>'}
    </div>
  </div>
</body>
</html>`
}

// Recursively gather files (Playwright may nest videos)
function walkFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkFiles(p))
    else out.push(p)
  }
  return out
}

// ---------- OpenAI rate-limit helpers ----------
function sleep(ms){ return new Promise(r => setTimeout(r, ms)) }
let lastOAICall = 0

async function callOpenAI(makeRequest, label='openai') {
  for (let attempt = 0; attempt <= OPENAI_MAX_RETRIES; attempt++) {
    // simple spacing between calls if configured
    const now = Date.now()
    const gap = OPENAI_MIN_GAP_MS - (now - lastOAICall)
    if (gap > 0) await sleep(gap)

    try {
      const res = await makeRequest()
      lastOAICall = Date.now()
      return res
    } catch (err) {
      const is429 = err?.status === 429 || err?.code === 'rate_limit_exceeded'
      if (!is429 || attempt === OPENAI_MAX_RETRIES) throw err

      // backoff with jitter; respect "try again in Xs" if present
      let waitMs = 2000 * Math.pow(attempt + 1, 2) // 2s, 8s, 18s, 32s...
      const msg = err?.error?.message || err?.message || ''
      const m = msg.match(/try again in\s+(\d+)s/i)
      if (m) waitMs = Math.max(waitMs, (parseInt(m[1], 10) + 1) * 1000)
      waitMs += Math.floor(Math.random() * 500) // jitter

      console.warn(`[${label}] 429 rate-limited. Retry ${attempt + 1}/${OPENAI_MAX_RETRIES} in ${waitMs}ms`)
      await sleep(waitMs)
    }
  }
}

// ---------- Agent utilities ----------
const DANGEROUS_RE = /(delete|remove|destroy|drop|logout|sign\s*out|deactivate|close\s*account|unsubscribe|checkout|purchase|pay|buy)/i

function genValueFor(desc, runId){
  const seed = runId.slice(0,8)
  const type = (desc.type || '').toLowerCase()
  const name = (desc.name || '').toLowerCase()
  const placeholder = (desc.placeholder || '').toLowerCase()
  const tag = (desc.tag || '').toLowerCase()
  const hint = `${type} ${name} ${placeholder}`

  if (/email/.test(hint)) return `qa.${seed}@example.com`
  if (/phone|tel/.test(hint)) return '5550101234'
  if (/pass/.test(hint)) return 'QAtest1234!'
  if (/url|link/.test(hint)) return 'https://example.com/test'
  if (/zip|pincode|postal/.test(hint)) return '12345'
  if (/city/.test(hint)) return 'Testville'
  if (/name|first|last|full/.test(hint)) return 'QA Tester'
  if (/search|query/.test(hint)) return 'test query'
  if (/address/.test(hint)) return '123 Test St'
  if (/company|org/.test(hint)) return 'QA Org'
  if (type === 'number') return '42'
  if (tag === 'textarea') return 'Automated exploratory input.'
  return 'Test value'
}

function cssEscape(s) {
  return String(s).replace(/["\\]/g, '\\$&')
}

async function summarizeInteractables(page){
  return await page.evaluate(() => {
    function visible(el){
      const style = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return style && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
    }
    const nodes = Array.from(document.querySelectorAll('input, textarea, select, button, a, [role="button"]'))
    const items = []
    let idx = 0
    for(const el of nodes){
      if(!visible(el)) continue
      const tag = (el.tagName || '').toLowerCase()
      const role = el.getAttribute('role') || ''
      const type = (el.getAttribute('type') || '').toLowerCase()
      const name = el.getAttribute('name') || ''
      const id = el.id || ''
      const placeholder = el.getAttribute('placeholder') || ''
      const href = (el instanceof HTMLAnchorElement && el.href) ? el.href : ''
      const label = (el.labels && el.labels[0] && el.labels[0].innerText) || el.getAttribute('aria-label') || el.innerText || ''
      const required = !!el.getAttribute('required') || el.getAttribute('aria-required') === 'true'
      const disabled = !!el.getAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
      const text = (el.innerText || '').trim().slice(0,120)

      // compute a simple selector
      let selector = ''
      if(id) selector = `#${id}`
      else if(name) selector = `[name="${name.replace(/["\\]/g,'\\$&')}"]`
      else if(placeholder) selector = `[placeholder="${placeholder.replace(/["\\]/g,'\\$&')}"]`
      else if(tag === 'button' && text) selector = `button:has-text("${text.replace(/["\\]/g,'\\$&')}")`
      else if(tag === 'a' && text) selector = `a:has-text("${text.replace(/["\\]/g,'\\$&')}")`

      items.push({
        uid: 'e'+(idx++),
        tag, role, type, name, id, placeholder, href, label, text, required, disabled,
        selector
      })
    }
    return { url: location.href, title: document.title, interactables: items }
  })
}

function locatorFor(page, desc){
  if (desc.selector && !/has-text/.test(desc.selector)) return page.locator(desc.selector)
  if (desc.id) return page.locator(`#${cssEscape(desc.id)}`)
  if (desc.name) return page.locator(`[name="${cssEscape(desc.name)}"]`)
  if (desc.placeholder) return page.locator(`[placeholder="${cssEscape(desc.placeholder)}"]`)
  // fallback to role/name heuristics
  if ((desc.tag === 'button' || desc.role === 'button') && desc.text) return page.getByRole('button', { name: desc.text, exact: false })
  if (desc.tag === 'a' && desc.text) return page.getByRole('link', { name: desc.text, exact: false })
  if (desc.text) return page.getByText(desc.text, { exact: false })
  // ultimate fallback: first visible input
  return page.locator('input, textarea, select').first()
}

// Single-step agent (kept for reference)
async function agentDecide({ testType, current, history }){
  const prompt = `You are an expert QA agent performing ${testType} testing.
Given the current page summary and recent actions, choose ONE next action.

Return STRICT JSON:
{"action":"fill|click|select|press|navigate|end","target_uid": "...", "value": "...", "notes":"..."}`

  const res = await callOpenAI(() => client.responses.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    input: [
      { role: 'system', content: 'You output ONLY JSON. No prose.' },
      { role: 'user', content: prompt },
      { role: 'user', content: JSON.stringify({ current, history }).slice(0, 15000) }
    ]
  }), 'agentDecide')
  const text = res.output_text || ''
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('Agent did not return JSON')
  return JSON.parse(m[0])
}

// Batched agent: ask for N actions at once (reduces RPM)
async function agentDecideBatch({ testType, current, history, batchSize = AGENT_BATCH_SIZE }){
  const prompt = `You are an expert QA agent performing ${testType} testing.
Based on the current page summary and recent actions, propose up to ${batchSize} SAFE next actions.

Return STRICT JSON ARRAY:
[
  {"action":"fill|click|select|press|navigate|end","target_uid":"...","value":null_or_string,"notes":"..."},
  ...
]

Rules:
- Prefer required/empty fields; validate forms and navigation.
- Avoid destructive actions (delete, remove, logout, checkout, purchase).
- Keep actions within the same site; if nothing reasonable remains, include a final {"action":"end"} as the last item.`

  const res = await callOpenAI(() => client.responses.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    input: [
      { role: 'system', content: 'You output ONLY JSON. No prose.' },
      { role: 'user', content: prompt },
      { role: 'user', content: JSON.stringify({ current, history }).slice(0, 15000) }
    ]
  }), 'agentDecideBatch')

  const text = res.output_text || ''
  const arrMatch = text.match(/\[[\s\S]*\]/)
  const objMatch = text.match(/\{[\s\S]*\}/)
  let parsed = []
  try {
    parsed = JSON.parse(arrMatch ? arrMatch[0] : (objMatch ? `[${objMatch[0]}]` : '[]'))
  } catch {
    parsed = []
  }
  if (!Array.isArray(parsed)) parsed = []
  return parsed.slice(0, batchSize)
}

// ---------- Main runner ----------
export function createRunner(config){
  const runDir = path.join(artifactsRoot, config.runId)
  fs.mkdirSync(runDir, { recursive: true })
  const profile = testingProfiles[config.projectId] || testingProfiles._default

  async function planWithAI({testType, urlProvided, extraDirectives}){
    const prompt = `You are a senior QA engineer. Create a concise ${testType} testing plan.
Context:
- Target is ${urlProvided ? 'a live URL: ' + urlProvided : 'a static screenshot image'}
- Output JSON with fields: plan (markdown), checks (array of test steps each with id, title, rationale), heuristics (array of strings). Keep it compact.
- Additional directives (priorities/flows/acceptance hints):
${extraDirectives || '(none)'}`
    const response = await callOpenAI(() => client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "Be structured, brief, and practical. Output must be valid JSON."},
        { role: "user", content: prompt }
      ],
      temperature: 0.2
    }), 'planWithAI')
    const text = response.output_text
    const m = text.match(/\{[\s\S]*\}/)
    if(!m) throw new Error('Model did not return JSON')
    return JSON.parse(m[0])
  }

  async function runAgent({ url, screenshotPath, testType, outDir, runId, maxSteps = 40, profile, basicAuthUser = null, basicAuthPass = null, testCases = null }){
    const browser = await chromium.launch()
    const context = await browser.newContext({
      recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
      httpCredentials: (basicAuthUser && basicAuthPass) ? { username: basicAuthUser, password: basicAuthPass } : undefined
    })
    const page = await context.newPage()
    const artifacts = []
    const actions = []
    const startOrigin = url ? new URL(url).origin : null

    // capture console errors
    const consoleErrors = []
    page.on('pageerror', e => consoleErrors.push(String(e)))
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

    try{
      if(url){
        await page.goto(url, { waitUntil: 'load', timeout: 60000 })
      } else if(screenshotPath){
        const img = fs.readFileSync(screenshotPath).toString('base64')
        await page.setContent(
          `<html><body style="margin:0;background:#0b0b0b;display:grid;place-items:center;min-height:100vh">
             <img src="data:image/*;base64,${img}" style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.35)"/>
           </body></html>`
        )
      }

      // Optional login phase
      async function maybeLogin(){
        if (!profile?.login) return { didLogin: false, note: 'no login profile' }
        const { path: loginPath, usernameSelector, passwordSelector, submitSelector, usernameEnv, passwordEnv } = profile.login
        const username = process.env[usernameEnv]
        const password = process.env[passwordEnv]
        if (!(username && password)) return { didLogin: false, note: 'credentials missing' }
        try {
          if (url && loginPath) {
            const u = new URL(url)
            const loginUrl = new URL(loginPath, u.origin).toString()
            await page.goto(loginUrl, { waitUntil: 'load', timeout: 60000 })
          }
          if (usernameSelector) { await page.locator(usernameSelector).fill(username) }
          if (passwordSelector) { await page.locator(passwordSelector).fill(password) }
          if (submitSelector)   { await page.locator(submitSelector).click({ timeout: 10000 }) }
          await page.waitForLoadState('load', { timeout: 15000 }).catch(()=>{})
          return { didLogin: true, note: 'login attempted' }
        } catch (e) {
          return { didLogin: false, note: 'login failed: ' + e.message }
        }
      }

      // login first (if configured)
      const loginRes = await maybeLogin()

      // helper to snapshot
      async function snapshot(label){
        const file = path.join(outDir, `${String(actions.length+1).padStart(2,'0')}_${label}.png`)
        await page.screenshot({ path: file, fullPage: true })
        artifacts.push({ type: 'screenshot', path: file })
      }

      // initial shot
      await snapshot('initial')

      const history = []
      let queued = []  // batched actions received from model

      for(let step=0; step<maxSteps; step++){
        const current = await summarizeInteractables(page)

        // stop if no interactables
        if(!current.interactables || current.interactables.length === 0){
          actions.push({ action:'end', status:'end', notes:'No interactable elements found' })
          break
        }

        // If explicit test cases provided, use those first; else fall back to AI batch
        if (queued.length === 0) {
          if (testCases && Array.isArray(testCases) && testCases.length > 0) {
            queued = testCases.splice(0, AGENT_BATCH_SIZE)
          } else {
            const goalDirectives = (profile?.prompts?.[testType]) || ''
            queued = await agentDecideBatch({ testType: `${testType}. ${goalDirectives}`, current, history, batchSize: AGENT_BATCH_SIZE })
            if (!queued.length) {
              actions.push({ action:'end', status:'end', notes:'Agent returned no actions' })
              break
            }
          }
        }

        // consume one action from the queue
        const decision = queued.shift()

        // End requested
        if (decision.action === 'end') {
          actions.push({ action:'end', status:'end', notes: decision.notes || 'Agent ended' })
          break
        }

        // resolve target (by queued uid or explicit selector/fields)
        let target = current.interactables.find(i => i.uid === decision.target_uid) || null
        if (!target && decision.target && typeof decision.target === 'object') target = decision.target
        if (!target && decision.selector) target = { selector: decision.selector }
        if (!target && (decision.id || decision.name || decision.placeholder || decision.text)) {
          target = {
            id: decision.id || null,
            name: decision.name || null,
            placeholder: decision.placeholder || null,
            text: decision.text || null,
            selector: decision.selector || ''
          }
        }
        const record = { action: decision.action, target: target || null, value: decision.value ?? null, status: 'pending', notes: decision.notes || '' }

        try{
          // safety checks
          if(decision.action === 'click' && target) {
            const text = `${target.text || target.label || ''} ${target.href || ''}`
            if (DANGEROUS_RE.test(text)) throw new Error('Blocked potentially destructive click')
          }
          if(decision.action === 'navigate' && decision.value) {
            const dest = new URL(decision.value, current.url)
            if (startOrigin && dest.origin !== startOrigin) throw new Error('Blocked cross-origin navigate')
            await page.goto(dest.toString(), { waitUntil: 'load', timeout: 60000 })
            record.status = 'ok'
            actions.push(record)
            await snapshot('navigate')
            history.push({ ts: nowISO(), ...record })
            continue
          }

          // locate element and act
          if(target){
            const loc = locatorFor(page, target)
            await loc.waitFor({ state: 'visible', timeout: 10000 })

            if(decision.action === 'fill' || decision.action === 'type'){
              const val = decision.value ?? genValueFor(target, runId)
              await loc.fill('')
              await loc.type(val, { delay: 10 })
              const looksSecret =
                (target?.type === 'password') ||
                /pass/i.test(target?.name || '') ||
                /pass/i.test(target?.placeholder || '')
              record.value = looksSecret ? '***' : val
            } else if(decision.action === 'select'){
              // pick first non-disabled option or provided value
              try {
                if (decision.value) {
                  await loc.selectOption({ label: decision.value }).catch(async()=> await loc.selectOption({ value: decision.value }))
                } else {
                  const first = await loc.evaluate((el)=>{
                    const opts = Array.from(el.options || [])
                    const cand = opts.find(o => !o.disabled && o.value) || opts[0]
                    return cand ? { value: cand.value, label: cand.label } : null
                  })
                  if (first) await loc.selectOption(first.value)
                  record.value = first?.label || first?.value || null
                }
              } catch (e) {
                throw new Error('select failed: ' + e.message)
              }
            } else if(decision.action === 'click'){
              await loc.click({ timeout: 10000 })
            } else if(decision.action === 'hover'){
              await loc.hover({ timeout: 10000 })
            } else if(decision.action === 'press'){
              await page.keyboard.press(decision.value || 'Enter')
            } else if(decision.action === 'assertText'){
              await page.getByText(decision.value, { exact: false }).waitFor({ state: 'visible', timeout: 10000 })
            } else {
              throw new Error('Unsupported action: ' + decision.action)
            }

            // brief wait for UI updates
            await page.waitForTimeout(500)
          } else {
            throw new Error('Target not found')
          }

          record.status = 'ok'
          actions.push(record)
          await snapshot(decision.action)
          history.push({ ts: nowISO(), ...record })
        }catch(err){
          record.status = 'error'
          record.notes = (record.notes ? record.notes + ' | ' : '') + (err?.message || String(err))
          actions.push(record)
          await snapshot('error')
          history.push({ ts: nowISO(), ...record })
          // continue loop—agent can try something else
        }
      }

      // Close to flush video
      await page.close()
      await context.close()
      await browser.close()

      // Gather videos and step shots
      const all = walkFiles(outDir)
      const videos = all.filter(f => f.endsWith('.webm'))
      for(const v of videos) artifacts.push({ type: 'video', path: v })

      // Return artifacts + actions + console errors (as note)
      return { artifacts, actions, consoleErrors }
    }catch(err){
      try { await page.close() } catch {}
      try { await context.close() } catch {}
      try { await browser.close() } catch {}
      throw err
    }
  }

  return {
    async start(){
      const { runId, projectName, testType, targetKind, url, screenshotPath, testCasesPath } = config
      const outDir = path.join(runDir, 'assets')
      fs.mkdirSync(outDir, { recursive: true })

      const startedAt = nowISO()

      // Optional: parse Excel test cases if provided (before planning)
      let explicitCases = null
      if (testCasesPath) {
        explicitCases = parseTestCasesFromXlsx(testCasesPath, testType)
      }

      // Plan (project/type directives included). If explicit test cases exist, skip AI planning.
      const planObj = explicitCases && explicitCases.length
        ? { plan: `Using uploaded test cases for ${testType}.`, checks: [], heuristics: [] }
        : await planWithAI({
            testType,
            urlProvided: url || null,
            extraDirectives: (testingProfiles[config.projectId] || testingProfiles._default)?.prompts?.[testType]
          })

      // Agent run
      const profile = testingProfiles[config.projectId] || testingProfiles._default
      const { artifacts, actions, consoleErrors } = await runAgent({
        url: targetKind === 'url' ? url : null,
        screenshotPath: targetKind === 'screenshot' ? screenshotPath : null,
        testType,
        outDir,
        runId,
        profile,
        basicAuthUser: config.basicAuthUser || null,
        basicAuthPass: config.basicAuthPass || null,
        testCases: explicitCases
      })

      // Map to public URLs
      const publicArtifacts = artifacts.map(a => ({
        ...a,
        filename: path.basename(a.path),
        url: publicUrlFromAbs(a.path),
      }))

      // Assets index
      const assetsIndexHtml = buildAssetsIndexHTML({ projectName, runId, files: publicArtifacts })
      fs.writeFileSync(path.join(outDir, 'index.html'), assetsIndexHtml, 'utf8')

      // Action log JSON
      fs.writeFileSync(path.join(runDir, 'actions.json'), JSON.stringify({ actions, consoleErrors }, null, 2), 'utf8')

      // Report with embedded media + action table
      const html = buildReportHTML({
        projectName,
        testType,
        startedAt,
        plan: planObj.plan,
        checks: planObj.checks,
        heuristics: planObj.heuristics,
        artifacts: publicArtifacts,
        actions
      })
      const reportPath = path.join(runDir, 'report.html')
      fs.writeFileSync(reportPath, html, 'utf8')

      // Links
      const reportUrl = artifactLink(relFromArtifacts(reportPath))
      const assetUrl = artifactLink(relFromArtifacts(path.join(outDir, 'index.html')))

      // Slack
      const blocks = [
        { type: "header", text: { type: "plain_text", text: `✅ Test finished: ${projectName} (${testType})` } },
        { type: "section", text: { type: "mrkdwn", text:
`*Run ID:* ${runId}
*Started:* ${startedAt}
*Report:* ${reportUrl}
*Assets:* ${assetUrl}
${consoleErrors?.length ? `*Console errors:* ${consoleErrors.length}` : ''}` } }
      ]
      await slackNotify(blocks)

      // Email (attach a few screenshots from disk)
      await emailNotify({
        subject: `QA Agent · ${projectName} (${testType}) finished`,
        html: `<p>Run ID: ${runId}</p>
<p>Started: ${startedAt}</p>
<p><a href="${reportUrl}">Open HTML Report</a></p>
<p><a href="${assetUrl}">Browse assets</a></p>`,
        attachments: publicArtifacts
          .filter(a=>a.type==='screenshot')
          .slice(0,3)
          .map(a=>({ filename: a.filename, path: a.path })) // use disk paths for reliability
      })

      console.log('Run complete:', runId, reportUrl)
    }
  }
}
