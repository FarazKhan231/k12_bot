import React, { useState, useEffect } from 'react'

export default function JiraTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [testCases, setTestCases] = useState([])
  const [playwrightScript, setPlaywrightScript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [username, setUsername] = useState('faraz.khan@k12coalition.com')
  const [statusFilter, setStatusFilter] = useState('all')
  const [materializing, setMaterializing] = useState(false)
  const [running, setRunning] = useState(false)
  const [runOutput, setRunOutput] = useState('')

  // Fetch JIRA tickets
  const fetchTickets = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/jira/tickets/${username}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      setTickets(data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      alert('Failed to fetch JIRA tickets. Check your JIRA configuration.')
    } finally {
      setLoading(false)
    }
  }

  // Generate test cases from ticket
  const generateTestCases = async (ticket) => {
    setGenerating(true)
    setSelectedTicket(ticket)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/jira/generate-test-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: ticket.summary,
          description: ticket.description
        })
      })
      
      if (!response.ok) throw new Error('Failed to generate test cases')
      const data = await response.json()

      // Normalize response to a safe array of test cases with array bddSteps
      const normalized = (Array.isArray(data) ? data : []).map((tc, idx) => {
        const steps = Array.isArray(tc?.bddSteps)
          ? tc.bddSteps
          : typeof tc?.bddSteps === 'string'
            ? tc.bddSteps.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
            : []
        return {
          testCaseId: tc?.testCaseId || `TC-${String(idx + 1).padStart(3, '0')}`,
          title: tc?.title || 'Untitled Test Case',
          priority: tc?.priority || 'Medium',
          bddSteps: steps
        }
      })
      setTestCases(normalized)
      
      // Generate Playwright script
      const scriptResponse = await fetch(`${import.meta.env.VITE_API_BASE}/api/jira/generate-playwright`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases: normalized })
      })
      
      if (scriptResponse.ok) {
        const scriptData = await scriptResponse.json()
        setPlaywrightScript(scriptData.script)
      } else {
        setPlaywrightScript('')
      }
    } catch (error) {
      console.error('Error generating test cases:', error)
      alert('Failed to generate test cases. Check your OpenAI configuration.')
      setTestCases([])
      setPlaywrightScript('')
    } finally {
      setGenerating(false)
    }
  }

  // Materialize Playwright project files from generated script
  const materializePlaywright = async () => {
    try {
      setMaterializing(true)
      if (!selectedTicket || !playwrightScript) {
        alert('No generated script to materialize')
        return
      }

      // Helper: extract code blocks from fenced markdown or raw
      const extractBlocks = (text) => {
        const blocks = []
        const regex = /```[a-zA-Z]*\n([\s\S]*?)```/g
        let m
        while ((m = regex.exec(text)) !== null) {
          blocks.push(m[1].trim())
        }
        if (blocks.length === 0) {
          blocks.push(text.trim())
        }
        return blocks
      }

      const toSafeName = (s) => s.replace(/[^A-Za-z0-9_-]/g, '_')

      const ensureExport = (code, className) => {
        if (!className) return code
        if (!/export\s*\{\s*[^}]+\}/.test(code) && !/export\s+default/.test(code)) {
          return `${code}\n\nexport { ${className} };\n`
        }
        return code
      }

      const ensureJsExt = (p) => (p.endsWith('.js') ? p : `${p}.js`)

      const fixImports = (code, isSpec = false) => {
        // Normalize import path to ../pages for specs and ./pages for page modules
        // 1) Convert page-objects -> pages
        let out = code.replace(/from\s+['"]\.\/(page-objects|pages)\//g, (m) => `from '${isSpec ? '../pages/' : './pages/'}`)
        // 2) Also handle without leading ./
        out = out.replace(/from\s+['"](page-objects|pages)\//g, (m) => `from '${isSpec ? '../pages/' : './pages/'}`)
        // 3) Ensure .js extension for pages imports
        out = out.replace(/from\s+['"]([^'"\n]+\/pages\/[^'"\n]+)['"]/g, (full, p1) => {
          return `from '${ensureJsExt(p1)}'`
        })
        return out
      }

      const transformSpec = (code) => {
        let out = code
        // Ensure @playwright/test import is present
        if (!/from\s+['"]@playwright\/test['"]/.test(out)) {
          out = `import { test, expect } from '@playwright/test'\n` + out
        }
        // If code uses playwright[browserName], ensure playwright import
        if (/playwright\s*\[/.test(out) && !/from\s+['"]playwright['"]/.test(out)) {
          out = `import playwright from 'playwright'\n` + out
        }
        // Replace Puppeteer-style page.emulate(...) with viewport setup
        out = out.replace(/await\s+page\.emulate\([^)]*\);?/g, (m) => {
          const vp = m.match(/viewport\s*:\s*\{\s*width\s*:\s*(\d+)\s*,\s*height\s*:\s*(\d+)\s*\}/)
          const width = vp ? parseInt(vp[1], 10) : 375
          const height = vp ? parseInt(vp[2], 10) : 667
          return `await page.setViewportSize({ width: ${width}, height: ${height} });`
        })
        return out
      }

      const guessFileFromBlock = (block) => {
        const lines = block.split(/\r?\n/)
        for (let i = 0; i < Math.min(5, lines.length); i++) {
          const ln = lines[i].trim()
          const m = ln.match(/^\/\/\s*([^\s].*\.js)$/)
          if (m) {
            const rel = m[1].replace(/^page-objects\//, 'pages/')
            const isSpecHint = /tests\//.test(rel) || /\.spec\.js$/.test(rel)
            return { path: rel.startsWith('pages/') || rel.startsWith('tests/') ? rel : (isSpecHint ? `tests/${rel}` : `pages/${rel}`), content: block }
          }
        }

        const isTest = /@playwright\/test|\btest\.describe\(|\btest\(/.test(block)
        if (isTest) {
          const specName = `${toSafeName(selectedTicket.key)}.spec.js`
          return { path: `tests/${specName}`, content: fixImports(block, true) }
        }

        const classMatch = block.match(/class\s+([A-Za-z0-9_]+)/)
        if (classMatch) {
          const className = classMatch[1]
          let content = block
          content = content.replace(/export\s*\{[\s\S]*?\};?/g, '').trim()
          content = ensureExport(content, className)
          return { path: `pages/${className}.js`, content }
        }

        const specName = `${toSafeName(selectedTicket.key)}.spec.js`
        return { path: `tests/${specName}`, content: fixImports(block, true) }
      }

      const blocks = extractBlocks(playwrightScript)
      const filesMap = new Map()

      blocks.forEach((block) => {
        const file = guessFileFromBlock(block)
        if (file.path.startsWith('tests/')) {
          file.content = transformSpec(fixImports(file.content, true))
        } else {
          file.content = fixImports(file.content, false)
        }
        if (filesMap.has(file.path)) {
          filesMap.set(file.path, filesMap.get(file.path) + "\n\n" + file.content)
        } else {
          filesMap.set(file.path, file.content)
        }
      })

      const files = Array.from(filesMap.entries()).map(([path, content]) => ({ path, content }))

      if (files.length === 0) {
        alert('Could not derive files from generated script')
        return
      }

      // Ensure minimal config files
      files.push({ path: `playwright.config.js`, content: `// Auto-generated config\nimport { defineConfig } from '@playwright/test';\nexport default defineConfig({ testDir: './tests', use: { headless: true } });\n` })
      files.push({ path: `package.json`, content: `{"private": true, "type": "module"}` })

      const resp = await fetch(`${import.meta.env.VITE_API_BASE}/api/playwright/materialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      })
      if (!resp.ok) throw new Error('Failed to write files')
      const json = await resp.json()
      alert(`Playwright files written under: ${json.baseDir}`)
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setMaterializing(false)
    }
  }

  const runPlaywright = async () => {
    try {
      setRunning(true)
      setRunOutput('')
      const resp = await fetch(`${import.meta.env.VITE_API_BASE}/api/playwright/run`, { method: 'POST' })
      const json = await resp.json()
      setRunOutput(json.output || `Exit code: ${json.code}`)
    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setRunning(false)
    }
  }

  // Download test cases as CSV
  const downloadTestCases = () => {
    try {
      if (!Array.isArray(testCases) || testCases.length === 0) {
        alert('No test cases to download')
        return
      }
      const rows = testCases.map(tc => ({
        'Test Case ID': tc?.testCaseId || '',
        'Title': tc?.title || '',
        'Priority': tc?.priority || '',
        'Test Script (BDD)': Array.isArray(tc?.bddSteps) ? tc.bddSteps.join('\n') : ''
      }))
      const headers = Object.keys(rows[0])
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedTicket?.key || 'test'}-test-cases.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Failed to download CSV')
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [username])

  // Filter tickets by status
  const filteredTickets = tickets.filter(ticket => 
    statusFilter === 'all' || ticket.status === statusFilter
  )

  // Get unique statuses for filter dropdown
  const uniqueStatuses = [...new Set(tickets.map(ticket => ticket.status))].sort()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-3">
            JIRA Tickets Dashboard
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            View your assigned tickets and generate comprehensive test cases automatically with AI-powered insights
          </p>
        </div>

        {/* Username Input */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200/50">
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              JIRA Username
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 border-0 bg-slate-50 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-slate-700 placeholder-slate-400"
                placeholder="Enter your JIRA username"
              />
              <button
                onClick={fetchTickets}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Fetch Tickets
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Ticket Summary */}
        {tickets.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200/50">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Ticket Summary Dashboard
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/50">
                  <div className="text-3xl font-bold text-slate-900 mb-1">{tickets.length}</div>
                  <div className="text-sm text-slate-600 font-medium">Total Tickets</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                  <div className="text-3xl font-bold text-blue-700 mb-1">
                    {tickets.filter(t => t.status === 'In Progress').length}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">In Progress</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200/50">
                  <div className="text-3xl font-bold text-gray-700 mb-1">
                    {tickets.filter(t => t.status === 'To Do').length}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">To Do</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200/50">
                  <div className="text-3xl font-bold text-red-700 mb-1">
                    {tickets.filter(t => t.priority === 'High').length}
                  </div>
                  <div className="text-sm text-red-600 font-medium">High Priority</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter */}
        {tickets.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200/50">
              <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filter by Status
              </label>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                    statusFilter === 'all' 
                      ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
                  }`}
                >
                  All ({tickets.length})
                </button>
                {uniqueStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                      statusFilter === status 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:shadow-md'
                    }`}
                  >
                    {status} ({tickets.filter(t => t.status === status).length})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tickets List + Generated Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tickets */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200/50 mb-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Your Assigned Tickets
              </h2>
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">
                    {loading ? 'Loading tickets...' : 
                     tickets.length === 0 ? 'No tickets found' : 
                     `No tickets with status "${statusFilter}"`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.key}
                      className={`bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-2 ${
                        selectedTicket?.key === ticket.key ? 'border-blue-500 shadow-lg' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm bg-blue-600 text-white px-3 py-1 rounded-lg font-semibold">
                            {ticket.key}
                          </span>
                          <a
                            href={ticket.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View in JIRA
                          </a>
                        </div>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-3 text-lg leading-tight">{ticket.summary}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <span className="bg-slate-200 px-2 py-1 rounded-md">{ticket.type}</span>
                        <span>•</span>
                        <span>{new Date(ticket.updated).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'To Do' ? 'bg-gray-100 text-gray-800' :
                          ticket.status === 'Done' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'Closed' ? 'bg-red-100 text-red-800' :
                          ticket.status === 'Review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {ticket.status}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.priority} Priority
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          generateTestCases(ticket)
                        }}
                        disabled={generating}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {generating && selectedTicket?.key === ticket.key ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Generate Test Cases
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Test Cases and Script */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200/50">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Generated Test Cases
              </h2>
              {selectedTicket && testCases.length > 0 ? (
                <div className="space-y-6">
                  {/* Test Cases */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200/50">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Test Cases for {selectedTicket.key}
                    </h3>
                    <div className="space-y-4">
                      {testCases.map((tc, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded-md font-semibold">
                              {tc.testCaseId}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-md font-semibold ${
                              tc.priority === 'High' ? 'bg-red-100 text-red-800' :
                              tc.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {tc.priority}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 mb-3">{tc.title}</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                            {(Array.isArray(tc.bddSteps) ? tc.bddSteps : []).map((step, stepIndex) => (
                              <li key={stepIndex} className="bg-slate-50 px-3 py-2 rounded-md">{step}</li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={downloadTestCases}
                      className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Test Cases (CSV)
                    </button>
                  </div>

                  {/* Playwright Script */}
                  {playwrightScript && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200/50">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        Generated Playwright Script
                      </h3>
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96 border border-slate-700">
                        <code>{playwrightScript}</code>
                      </pre>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <button
                          onClick={materializePlaywright}
                          disabled={materializing}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          {materializing ? 'Writing files...' : 'Write Files to Repo'}
                        </button>
                        <button
                          onClick={runPlaywright}
                          disabled={running}
                          className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          {running ? 'Running...' : 'Run Playwright Tests'}
                        </button>
                      </div>

                      {runOutput && (
                        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <h4 className="font-semibold text-slate-800 mb-2">Run Output</h4>
                          <pre className="text-xs text-slate-700 whitespace-pre-wrap">{runOutput}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">
                    {selectedTicket ? 'Click "Generate Test Cases" to create test cases from the selected ticket' : 'Select a ticket to generate test cases'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
