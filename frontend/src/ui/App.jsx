import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import HealingDashboard from './HealingDashboard.jsx'

export default function App(){
  const [tab, setTab] = useState('jira') // 'jira' | 'agent' | 'healing'
  return (
    <div className="min-h-screen text-slate-900 bg-rtctek bg-rtctek-photo auto-3d" style={{backgroundColor:'#0b1020'}}>
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="mb-8 glass-card p-8 flex items-center justify-between gap-4">
          <div>
            <div className="text-4xl font-semibold glow-text">QA Testing Dashboard</div>
            <div className="mt-2 space-x-2">
              <span className="badge badge-green">Playwright</span>
              <span className="badge badge-yellow">GPT</span>
              <span className="badge badge-slate">Jira</span>
            </div>
          </div>
          <div className="floaty hidden md:block">
            <img alt="robot" src="https://em-content.zobj.net/source/apple/354/robot_1f916.png" className="w-20 h-20"/>
          </div>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button className={`btn-rtctek btn-rtctek-lg ${tab==='jira'?'':'opacity-60'}`} onClick={()=>setTab('jira')}>Jira</button>
          <button className={`btn-rtctek btn-rtctek-lg ${tab==='agent'?'':'opacity-60'}`} onClick={()=>setTab('agent')}>Agent</button>
          <button className={`btn-rtctek btn-rtctek-lg ${tab==='healing'?'':'opacity-60'}`} onClick={()=>setTab('healing')}>Healing Dashboard</button>
        </div>

        {tab==='jira' ? <JiraSection/> : tab==='agent' ? <AgentSection/> : <HealingDashboard/>}
      </div>
    </div>
  )
}

function JiraSection(){
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState([])
  const [resultsByKey, setResultsByKey] = useState({}) // key -> { loading, testCases, script, error, running, runStatus }
  const [showOverlay, setShowOverlay] = useState(false)
  const [businessUnit, setBusinessUnit] = useState('')
  const [backendStatus, setBackendStatus] = useState('checking') // 'checking', 'connected', 'disconnected'

  // Check backend status on component mount
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        await api.health()
        setBackendStatus('connected')
      } catch (error) {
        console.error('Backend health check failed:', error)
        setBackendStatus('disconnected')
      }
    }
    checkBackend()
  }, [])

  async function findTickets(){
    try{
      setLoading(true)
      const res = await api.jiraTickets(username)
      setTickets(Array.isArray(res) ? res : [])
    }catch(e){ alert(e.message) }
    finally{ setLoading(false) }
  }

  async function generateForTicket(ticket){
    const key = ticket.key
    setResultsByKey(prev=>({ ...prev, [key]: { ...(prev[key]||{}), loading: true, error: null } }))
    setShowOverlay(true)
    try{
      const details = await api.jiraTicket(key)
      const cases = await api.jiraGenerateTestCases({ summary: details.summary, description: details.description })
      const scriptRes = await api.jiraGeneratePlaywright({ testCases: cases, businessUnit })
      setResultsByKey(prev=>({ ...prev, [key]: { loading:false, testCases: cases, script: scriptRes.script } }))
    }catch(e){
      setResultsByKey(prev=>({ ...prev, [key]: { loading:false, error: e.message } }))
    } finally { setShowOverlay(false) }
  }

  return (
    <div className="space-y-6">
      {/* Backend Status Indicator */}
      <div className="glass-card p-4 border border-slate-600 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            backendStatus === 'connected' ? 'bg-green-500' : 
            backendStatus === 'disconnected' ? 'bg-red-500' : 
            'bg-yellow-500 animate-pulse'
          }`}></div>
          <span className="text-sm text-white">
            Backend: {
              backendStatus === 'connected' ? 'Connected' : 
              backendStatus === 'disconnected' ? 'Disconnected - Check if backend is running' : 
              'Checking...'
            }
          </span>
          {backendStatus === 'disconnected' && (
            <button 
              onClick={() => {
                setBackendStatus('checking')
                api.health().then(() => setBackendStatus('connected')).catch(() => setBackendStatus('disconnected'))
              }}
              className="ml-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              Retry
            </button>
          )}
        </div>
      </div>
      
      <div className="glass-card p-8">
        <div className="text-2xl font-semibold mb-4 text-white">Find Jira Tickets</div>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="block">
            <div className="text-base text-cyan-100 mb-1">Jira username or email</div>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="name@example.com" className="w-80 border border-slate-300 rounded-lg px-4 py-3 text-base" />
          </label>
          <button className="btn-rtctek btn-rtctek-lg" onClick={findTickets} disabled={loading || !username.trim()}>{loading?'Loading…':'Find Tickets'}</button>
        </div>
        
        {tickets.length > 0 && (
          <div className="mt-4">
            <label className="block">
              <div className="text-base text-cyan-100 mb-1">Business Unit (for Playwright tests)</div>
              <select value={businessUnit} onChange={e=>setBusinessUnit(e.target.value)} className="w-80 border border-slate-300 rounded-lg px-4 py-3 text-base bg-white">
                <option value="">Select Business Unit</option>
                <option value="lavinia">Lavinia</option>
                <option value="passageprep">Passage Prep</option>
                <option value="teachingchannel">Teaching Channel</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {tickets.map(t => {
          const r = resultsByKey[t.key] || {}
          return (
            <div key={t.key} className="glass-card p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-lg text-white">{t.key} — {t.summary}</div>
                  <div className="text-sm text-slate-200 mt-1">{t.priority} · {t.status}</div>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button className="btn-rtctek btn-rtctek-lg" onClick={()=>generateForTicket(t)} disabled={!!r.loading}>
                    {r.loading ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                        Generating…
                      </span>
                    ) : 'Generate'}
                  </button>
                  {r.script && (
                    <button className="btn btn-rtctek-lg" onClick={async()=>{
                      // Check if business unit is selected
                      if (!businessUnit) {
                        alert('Please select a business unit before running Playwright tests.')
                        return
                      }
                      
                      try{
                        setResultsByKey(prev=>({ ...prev, [t.key]: { ...(prev[t.key]||{}), running: true, runStatus: 'Starting test execution...', runId: null } }))
                        
                        const run = await api.jiraRunPlaywright({ ticketKey: t.key, businessUnit })
                        
                        // Start SSE connection for real-time updates
                        if (run.runId) {
                          setResultsByKey(prev=>({ ...prev, [t.key]: { ...(prev[t.key]||{}), runId: run.runId } }))
                          
                          const eventSource = new EventSource(`${((import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787')}/api/playwright/status/${run.runId}`)
                          
                          // Timeout fallback - if no completion message in 2 minutes, force completion
                          const timeoutFallback = setTimeout(() => {
                            console.log('SSE timeout - forcing completion')
                            eventSource.close()
                            setResultsByKey(prev => ({
                              ...prev,
                              [t.key]: {
                                ...(prev[t.key] || {}),
                                running: false,
                                runStatus: 'Test execution completed! (timeout fallback)',
                                reportUrl: run.reportUrl,
                                script: run.script,
                                testFileName: run.testFileName,
                                frameworkPath: run.frameworkPath
                              }
                            }))
                            
                            // Auto-open the Playwright report
                            if (run.reportUrl) {
                              setTimeout(() => {
                                window.open(`${((import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787')}${run.reportUrl}`, '_blank')
                              }, 1000)
                            }
                          }, 120000) // 2 minutes timeout
                          
                          eventSource.onmessage = (event) => {
                            try {
                              const data = JSON.parse(event.data)
                              console.log('SSE Update:', data)
                              
                              setResultsByKey(prev => ({
                                ...prev,
                                [t.key]: {
                                  ...(prev[t.key] || {}),
                                  runStatus: data.message,
                                  lastUpdate: data.timestamp
                                }
                              }))
                              
                              // Close connection when complete
                              if (data.type === 'final_complete' || data.type === 'connection_closed') {
                                clearTimeout(timeoutFallback)
                                eventSource.close()
                                setResultsByKey(prev => ({
                                  ...prev,
                                  [t.key]: {
                                    ...(prev[t.key] || {}),
                                    running: false,
                                    reportUrl: data.reportUrl || run.reportUrl,
                                    script: run.script,
                                    testFileName: run.testFileName,
                                    frameworkPath: run.frameworkPath
                                  }
                                }))
                                
                                // Auto-open the Playwright report
                                if (data.reportUrl || run.reportUrl) {
                                  setTimeout(() => {
                                    window.open(`${((import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787')}${data.reportUrl || run.reportUrl}`, '_blank')
                                  }, 1000)
                                }
                              }
                            } catch (e) {
                              console.error('Error parsing SSE data:', e)
                            }
                          }
                          
                          eventSource.onerror = (error) => {
                            console.error('SSE Error:', error)
                            clearTimeout(timeoutFallback)
                            eventSource.close()
                            
                            // Fallback: if SSE fails, use the response data directly
                            setResultsByKey(prev => ({
                              ...prev,
                              [t.key]: {
                                ...(prev[t.key] || {}),
                                running: false,
                                runStatus: 'Test execution completed!',
                                reportUrl: run.reportUrl,
                                script: run.script,
                                testFileName: run.testFileName,
                                frameworkPath: run.frameworkPath
                              }
                            }))
                            
                            // Auto-open the Playwright report
                            if (run.reportUrl) {
                              setTimeout(() => {
                                window.open(`${((import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787')}${run.reportUrl}`, '_blank')
                              }, 1000)
                            }
                          }
                        }
                        
                        // Fallback if no runId
                        if (!run.runId) {
                          setResultsByKey(prev=>({ ...prev, [t.key]: { ...(prev[t.key]||{}), running: false, runStatus: 'Test completed successfully!', reportUrl: run?.reportUrl } }))
                          
                          if (run?.reportUrl) {
                            setTimeout(() => {
                              window.open(`${((import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787')}${run.reportUrl}`, '_blank')
                            }, 1000)
                          }
                        }
                      }catch(e){ 
                        setResultsByKey(prev=>({ ...prev, [t.key]: { ...(prev[t.key]||{}), running: false, runStatus: `Error: ${e.message}` } }))
                        alert(e.message) 
                      }
                    }} disabled={r.running}>
                      {r.running ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                          Running...
                        </span>
                      ) : 'Run Playwright'}
                    </button>
                  )}
                </div>
              </div>

              {r.error && (
                <div className="text-red-600 text-sm mt-3">{r.error}</div>
              )}

              {r.runStatus && (
                <div className="mt-3 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                  <div className="text-sm font-medium text-cyan-100 mb-2">Playwright Test Execution</div>
                  <div className="text-sm text-white mb-2">{r.runStatus}</div>
                  {r.lastUpdate && (
                    <div className="text-xs text-slate-300 mb-2">Last update: {new Date(r.lastUpdate).toLocaleTimeString()}</div>
                  )}
                  {r.running && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-200">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                        Running Playwright tests...
                      </div>
                      <div className="text-xs text-slate-300">
                        Check the browser console for detailed execution logs
                      </div>
                      <button 
                        onClick={() => {
                          // Force completion if stuck
                          setResultsByKey(prev => ({
                            ...prev,
                            [t.key]: {
                              ...(prev[t.key] || {}),
                              running: false,
                              runStatus: 'Test execution completed! (manual refresh)',
                              reportUrl: r.reportUrl,
                              script: r.script,
                              testFileName: r.testFileName,
                              frameworkPath: r.frameworkPath
                            }
                          }))
                          
                          // Auto-open the Playwright report if available
                          if (r.reportUrl) {
                            setTimeout(() => {
                              window.open(`${((import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787')}${r.reportUrl}`, '_blank')
                            }, 1000)
                          }
                        }}
                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Force Complete
                      </button>
                    </div>
                  )}
                  {r.reportUrl && !r.running && (
                    <div className="mt-3 pt-3 border-t border-slate-600 space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-300 font-medium">Test Report Available</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <a 
                          href={`${((import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787')}${r.reportUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-rtctek btn-rtctek-sm inline-block"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open in New Tab
                        </a>
                        <button 
                          onClick={() => {
                            const iframe = document.getElementById(`playwright-dashboard-${t.key}`);
                            if (iframe) {
                              iframe.src = iframe.src; // Refresh the iframe
                            }
                          }}
                          className="btn-rtctek btn-rtctek-sm inline-block bg-green-600 hover:bg-green-700"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                      </div>
                      
                      {/* Embedded Playwright Dashboard */}
                      <div className="mt-4">
                        <div className="text-sm font-medium text-cyan-100 mb-2">🎯 Interactive Test Dashboard</div>
                        <div className="bg-white rounded-lg overflow-hidden border border-slate-700 shadow-lg" style={{height: '600px'}}>
                          <iframe 
                            id={`playwright-dashboard-${t.key}`}
                            src={`${((import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787')}${r.reportUrl}`}
                            className="w-full h-full border-0"
                            title="Playwright Test Report"
                            onLoad={(e) => {
                              console.log('✅ Playwright report loaded for', t.key)
                              // Inject CSS to make text visible
                              try {
                                const iframe = e.target
                                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
                                if (iframeDoc) {
                                  const style = iframeDoc.createElement('style')
                                  style.textContent = `
                                    body, html { 
                                      background-color: #f8f9fa !important; 
                                      color: #212529 !important; 
                                    }
                                    .playwright-report { 
                                      background-color: #f8f9fa !important; 
                                      color: #212529 !important; 
                                    }
                                    .test-file, .test-suite, .test-case { 
                                      background-color: #ffffff !important; 
                                      color: #212529 !important; 
                                      border: 1px solid #dee2e6 !important;
                                    }
                                    .test-step, .test-result { 
                                      background-color: #ffffff !important; 
                                      color: #212529 !important; 
                                    }
                                    .status-passed { 
                                      color: #28a745 !important; 
                                    }
                                    .status-failed { 
                                      color: #dc3545 !important; 
                                    }
                                    .status-skipped { 
                                      color: #ffc107 !important; 
                                    }
                                    * { 
                                      color: #212529 !important; 
                                    }
                                  `
                                  iframeDoc.head.appendChild(style)
                                }
                              } catch (err) {
                                console.log('Could not inject CSS into iframe:', err)
                              }
                            }}
                            onError={() => console.log('❌ Failed to load Playwright report for', t.key)}
                            style={{
                              backgroundColor: '#f8f9fa'
                            }}
                          />
                        </div>
                        <div className="text-xs text-slate-300 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          💡 Click on individual tests in the dashboard to run them or view detailed results
                        </div>
                        
                        {/* Alternative: Simple Text Report Viewer */}
                        <div className="mt-4 p-4 bg-white rounded-lg border border-slate-300">
                          <div className="text-sm font-medium text-gray-800 mb-3">📊 Test Results Summary</div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>✅ Test File: {r.testFileName || 'Generated Test'}</div>
                            <div>🌐 Framework Path: {r.frameworkPath || 'Not available'}</div>
                            <div>📅 Generated: {new Date().toLocaleString()}</div>
                            <div>🎯 Status: Test execution completed successfully</div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            💡 For detailed test results, use the "Open in New Tab" button above to view the full Playwright report.
                          </div>
                        </div>
                        
                        {/* Individual Test Execution Panel */}
                        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-600">
                          <div className="text-sm font-medium text-cyan-100 mb-3">🎮 Run Individual Tests</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-slate-200 mb-1">Test File</label>
                              <input 
                                type="text" 
                                value={r.testFileName || ''} 
                                readOnly
                                className="w-full px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded border border-slate-600"
                                placeholder="e.g., DP_5531.spec.js"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-200 mb-1">Browser</label>
                              <select 
                                className="w-full px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded border border-slate-600"
                                onChange={(e) => setResultsByKey(prev => ({ ...prev, [t.key]: { ...(prev[t.key]||{}), selectedBrowser: e.target.value } }))}
                              >
                                <option value="chromium">Chromium</option>
                                <option value="firefox">Firefox</option>
                                <option value="webkit">WebKit</option>
                              </select>
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-xs text-slate-200 mb-1">Test Name (Optional)</label>
                            <input 
                              type="text" 
                              className="w-full px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded border border-slate-600"
                              placeholder="e.g., User can successfully complete the main workflow"
                              onChange={(e) => setResultsByKey(prev => ({ ...prev, [t.key]: { ...(prev[t.key]||{}), selectedTestName: e.target.value } }))}
                            />
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button 
                              onClick={async () => {
                                if (!r.testFileName || !r.frameworkPath) {
                                  alert('Test file or framework path not available')
                                  return
                                }
                                
                                try {
                                  setResultsByKey(prev => ({ ...prev, [t.key]: { ...(prev[t.key]||{}), runningIndividual: true, individualStatus: 'Running individual test...' } }))
                                  
                                  const result = await api.runIndividualTest({
                                    frameworkPath: r.frameworkPath,
                                    testFile: r.testFileName,
                                    testName: r.selectedTestName || null,
                                    browser: r.selectedBrowser || 'chromium'
                                  })
                                  
                                  setResultsByKey(prev => ({ ...prev, [t.key]: { ...(prev[t.key]||{}), runningIndividual: false, individualStatus: 'Individual test completed!', individualReportUrl: result.reportUrl } }))
                                  
                                  if (result.reportUrl) {
                                    setTimeout(() => {
                                      window.open(`${((import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787')}${result.reportUrl}`, '_blank')
                                    }, 1000)
                                  }
                                } catch (error) {
                                  setResultsByKey(prev => ({ ...prev, [t.key]: { ...(prev[t.key]||{}), runningIndividual: false, individualStatus: `Error: ${error.message}` } }))
                                }
                              }}
                              disabled={r.runningIndividual || !r.testFileName}
                              className="btn-rtctek btn-rtctek-sm inline-block bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                            >
                              {r.runningIndividual ? (
                                <span className="flex items-center gap-1">
                                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                  </svg>
                                  Running...
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Run Test
                                </span>
                              )}
                            </button>
                            <button 
                              onClick={() => {
                                setResultsByKey(prev => ({ ...prev, [t.key]: { ...(prev[t.key]||{}), selectedTestName: '', selectedBrowser: 'chromium' } }))
                              }}
                              className="btn-rtctek btn-rtctek-sm inline-block bg-slate-600 hover:bg-slate-700"
                            >
                              Clear
                            </button>
                          </div>
                          {r.individualStatus && (
                            <div className="mt-2 text-xs text-slate-200">
                              {r.individualStatus}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {r.testCases && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-white mb-2">Generated Test Cases</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {r.testCases.map((tc, i) => (
                      <div key={i} className="card p-4 bg-white/60 rounded-xl border border-white/40">
                        <div className="text-xs text-slate-400 mb-2">Case {i+1}</div>
                        <pre className="text-xs overflow-auto whitespace-pre-wrap break-words" style={{maxHeight:256}}>{JSON.stringify(tc, null, 2)}</pre>
                        <div className="mt-2">
                          <button className="copy-btn" onClick={()=>navigator.clipboard.writeText(JSON.stringify(tc, null, 2))}>Copy</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {r.script && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-1 text-white">Generated Playwright Script</div>
                  {r.testFileName && (
                    <div className="text-xs text-slate-300 mb-2">
                      File: <code className="bg-slate-800 px-1 rounded">{r.testFileName}</code>
                      {r.frameworkPath && (
                        <span className="ml-2">
                          Path: <code className="bg-slate-800 px-1 rounded">{r.frameworkPath}</code>
                        </span>
                      )}
                    </div>
                  )}
                  <pre className="p-3 bg-slate-900 text-slate-50 rounded-lg overflow-auto text-xs whitespace-pre-wrap break-words" style={{maxHeight:300}}>{r.script}</pre>
                </div>
              )}
            </div>
          )
        })}
        {tickets.length === 0 && (
          <div className="text-slate-200 text-sm">No tickets yet. Enter username and click Find Tickets.</div>
        )}
      </div>

      {showOverlay && (
        <div className="fixed inset-0 overlay-backdrop flex items-center justify-center z-50">
          <div className="glass-card p-8 max-w-lg text-center">
            <div className="text-2xl font-semibold mb-2 glow-text text-white">You are entering the AI world…</div>
            <div className="text-slate-200 mb-4">RTCTEK is crafting your test cases and Playwright script.</div>
            <div className="flex items-center justify-center gap-3">
              <img alt="spark" className="w-8 h-8 floaty" src="https://em-content.zobj.net/source/apple/354/rocket_1f680.png"/>
              <img alt="brain" className="w-8 h-8 floaty" src="https://em-content.zobj.net/source/apple/354/brain_1f9e0.png"/>
              <img alt="tools" className="w-8 h-8 floaty" src="https://em-content.zobj.net/source/apple/354/hammer-and-wrench_1f6e0-fe0f.png"/>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AgentSection(){
  const [url, setUrl] = useState('')
  const [testType, setTestType] = useState('smoke')
  const [projectId, setProjectId] = useState('passagePrep')
  const [creating, setCreating] = useState(false)
  const [agentId, setAgentId] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(()=>{
    if(!agentId) return
    const t = setInterval(async ()=>{
      try{ const s = await api.agentStatus(agentId); setStatus(s) }catch{}
    }, 1500)
    return ()=> clearInterval(t)
  }, [agentId])

  async function createAgent(){
    try{
      setCreating(true)
      const res = await api.agentCreate({ url, testType, projectId })
      setAgentId(res.agentId)
    }catch(e){ alert(e.message) }
    finally{ setCreating(false) }
  }

  const base = useMemo(()=> (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787', [])

  return (
    <div className="space-y-6">
      <div className="glass-card-dark p-8">
        <div className="text-2xl font-semibold mb-4 text-white">Start Agent</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="block">
            <div className="text-base text-slate-200 mb-1">Project</div>
            <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="w-full rounded-lg px-4 py-3 text-base bg-white/70 border border-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-300">
              <option value="passagePrep">Passage Prep</option>
              <option value="lavinia">Lavinia</option>
              <option value="teachingChannel">Teaching Channel</option>
            </select>
          </label>
          <label className="block">
            <div className="text-base text-slate-200 mb-1">Test type</div>
            <select value={testType} onChange={e=>setTestType(e.target.value)} className="w-full rounded-lg px-4 py-3 text-base bg-white/70 border border-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-300">
              <option value="smoke">smoke</option>
              <option value="exploratory">exploratory</option>
            </select>
          </label>
          <label className="block">
            <div className="text-base text-slate-200 mb-1">Target URL</div>
            <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg px-4 py-3 text-base bg-white/70 border border-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-300" />
          </label>
        </div>
        <div className="mt-5">
          <button className="btn-rtctek btn-rtctek-lg" onClick={createAgent} disabled={creating || !url.trim()}>{creating?'Creating…':'Create & Start Agent'}</button>
        </div>
      </div>

      <div className="glass-card-dark p-8">
        <div className="text-2xl font-semibold mb-3 text-white">Agent Status</div>
        {!agentId && <div className="text-slate-200 text-sm">No agent yet. Create one above.</div>}
        {agentId && (
          <div className="text-sm text-slate-200">
            <div className="mb-2">Agent ID: <code>{agentId}</code></div>
            <div className="mb-2">Status: <span className="font-medium text-white">{status?.status || 'starting…'}</span></div>
            {status?.reportUrl && (
              <a className="btn-rtctek btn-rtctek-lg mt-2 inline-block" href={`${base}${status.reportUrl}`} target="_blank" rel="noreferrer">Open Report</a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


