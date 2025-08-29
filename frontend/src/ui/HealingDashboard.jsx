import React, { useEffect, useState } from 'react'
import { api } from '../api.js'

export default function HealingDashboard() {
  const [events, setEvents] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [executingPipelines, setExecutingPipelines] = useState(new Set())
  
  // Test management state
  const [testFiles, setTestFiles] = useState([])
  const [testResults, setTestResults] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [aiHealing, setAiHealing] = useState({})

  // Configure WS via env (Vite: VITE_WS_URL)
  const WS_URL = import.meta.env?.VITE_WS_URL || 'ws://localhost:8787/ws'

  useEffect(() => {
    const ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      console.log('🔌 Connected to healing dashboard')
      setIsConnected(true)
    }

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data)
        console.log('🔌 WebSocket message received:', data)

        if (data.type === 'init') {
          setEvents(Array.isArray(data.events) ? data.events.slice(0, 100) : [])
          return
        }

        // ✅ Update existing events or create new ones
        setEvents((prev) => {
          if (data.type === 'locatorFix') {
            // Check if we already have an event for this healing session
            const existingIndex = prev.findIndex((e) => 
              e.type === 'locatorFix' && 
              e.locatorKey === data.locatorKey && 
              e.oldLocator === data.oldLocator &&
              (e.healingSessionId === data.healingSessionId || !data.healingSessionId)
            )
            
            if (existingIndex !== -1) {
              // Update existing event
              console.log('🔄 Updating existing event at index:', existingIndex)
              const updatedEvents = [...prev]
              updatedEvents[existingIndex] = {
                ...updatedEvents[existingIndex],
                ...data,
                executionStartTime: updatedEvents[existingIndex].executionStartTime || Date.now()
              }
              
              // Manage executing pipelines
              setExecutingPipelines((prevSet) => {
                const s = new Set(prevSet)
                if (data.status === 'fixed' || data.status === 'failed') {
                  // Remove from executing when completed
                  s.delete(updatedEvents[existingIndex].executionId)
                } else {
                  // Add to executing if still running
                  s.add(updatedEvents[existingIndex].executionId)
                }
                return s
              })
              
              return updatedEvents
            } else {
              // Create new event
              console.log('🆕 Creating new event for:', data.locatorKey, data.oldLocator)
              const executionId = `fix-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
              const newEvent = {
                ...data,
                executionId,
                executionStartTime: Date.now(),
              }

              // Manage executing pipelines
              setExecutingPipelines((prevSet) => {
                const s = new Set(prevSet)
                if (data.status === 'fixed' || data.status === 'failed') {
                  // Don't add to executing if already completed
                  return s
                } else {
                  // Add to executing if still running
                  s.add(executionId)
                  return s
                }
              })

              return [newEvent, ...prev].slice(0, 100)
            }
          }

          return [{ ...data }, ...prev].slice(0, 100)
        })
      } catch (error) {
        console.error('WebSocket message parse error:', error)
      }
    }

    ws.onclose = () => {
      console.log('🔌 Disconnected from healing dashboard')
      setIsConnected(false)
    }
    
    ws.onerror = (e) => {
      console.error('WebSocket error', e)
      setIsConnected(false)
    }

    return () => ws.close()
  }, [WS_URL])

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load test files on component mount
  useEffect(() => {
    loadTestFiles()
  }, [])

  const loadTestFiles = async () => {
    try {
      const data = await api.frameworkTestFiles()
      setTestFiles(data.files || [])
    } catch (error) {
      console.error('Failed to load test files:', error)
      // Fallback to sample files if API fails
      setTestFiles([
        { name: 'sample-failing-test.spec.js', path: 'tests/sample-failing-test.spec.js', content: `import { test, expect } from '@playwright/test';

test('Test with failing locators', async ({ page }) => {
  await page.goto('https://example.com');
  
  // This will fail and trigger AI healing
  const button = page.locator('[data-test="non-existent-button"]');
  await button.click();
  
  // Another failing locator
  const input = page.locator('#wrong-input-id');
  await input.fill('test value');
  
  // Basic assertions
  await expect(page.locator('body')).toBeVisible();
});` },
        { name: 'working-test.spec.js', path: 'tests/working-test.spec.js', content: `import { test, expect } from '@playwright/test';

test('Working test', async ({ page }) => {
  await page.goto('https://example.com');
  
  // This should work
  const body = page.locator('body');
  await expect(body).toBeVisible();
  
  console.log('Test passed successfully');
});` }
      ])
    }
  }

  const getStatusIcon = (status) => {
    if (status === 'fixed') return '✅'
    if (status === 'failed' || status === 'error') return '❌'
    if (status === 'healing') return '🔧'
    if (status === 'analyzing') return '📊'
    if (status === 'detected') return '🔍'
    return '⏳'
  }

  const getStatusColor = (status) => {
    if (status === 'fixed') return '#10b981'
    if (status === 'failed' || status === 'error') return '#ef4444'
    if (status === 'healing') return '#f59e0b'
    if (status === 'analyzing') return '#3b82f6'
    if (status === 'detected') return '#8b5cf6'
    return '#6b7280'
  }

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now'
    const diff = Math.floor((Date.now() - timestamp) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const isCurrentlyExecuting = (event) => executingPipelines.has(event.executionId)

  const getStepStatus = (event, stepIndex) => {
    if (!isCurrentlyExecuting(event)) {
      return event.status === 'fixed' ? 'completed' : event.status === 'failed' || event.status === 'error' ? 'pending' : 'pending'
    }
    if (stepIndex < event.currentStep) return 'completed'
    if (stepIndex === event.currentStep) return 'running'
    return 'pending'
  }

  const getStepContent = (event, stepIndex) => {
    const locatorSteps = [
      { icon: '🔍', label: 'Detected', description: 'Element failure detected' },
      { icon: '📊', label: 'Analyzed', description: 'Root cause analysis complete' },
      { icon: '🔧', label: 'Healing', description: 'Generating new locator' },
      { icon: '✅', label: 'Validated', description: 'New locator verified' },
    ]
    return locatorSteps[stepIndex] || {}
  }

  const getDynamicContent = (event) => {
    return (
      <div className="locator-content">
        <div className="pipeline-progress mb-4">
          {[0, 1, 2, 3].map((stepIndex) => {
            const stepStatus = getStepStatus(event, stepIndex)
            const stepContent = getStepContent(event, stepIndex)
            return (
              <div key={stepIndex} className={`flex items-center mb-2 ${stepStatus === 'completed' ? 'text-green-400' : stepStatus === 'running' ? 'text-blue-400' : 'text-gray-400'}`}>
                <span className="mr-2">{stepContent.icon}</span>
                <span className="mr-2">{stepContent.label}</span>
                {stepStatus === 'running' && <div className="animate-pulse">⚡</div>}
              </div>
            )
          })}
        </div>

        <div className="locator-key mb-3">
          <span className="text-cyan-300 font-medium">Target Element:</span>
          <code className="ml-2 bg-slate-700 px-2 py-1 rounded text-sm">{event.locatorKey}</code>
        </div>

        <div className="locator-details space-y-2">
          <div className="locator-row">
            <span className="text-red-300 font-medium">❌ Broken Locator:</span>
            <code className="ml-2 bg-slate-700 px-2 py-1 rounded text-sm text-red-200">{event.oldLocator}</code>
          </div>
          <div className="locator-row">
            <span className="text-green-300 font-medium">✅ Healed Locator:</span>
            <code className="ml-2 bg-slate-700 px-2 py-1 rounded text-sm text-green-200">
              {event.status === 'fixed' && event.newLocator ? event.newLocator : 
               event.status === 'healing' ? 'Generating...' : 
               event.status === 'analyzing' ? 'Analyzing...' :
               event.status === 'detected' ? 'Detected...' : 'Processing...'}
            </code>
          </div>
        </div>

        <div className="status-section mt-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: getStatusColor(event.status) + '20', color: getStatusColor(event.status) }}>
            <span className="mr-2">{getStatusIcon(event.status)}</span>
            <span>
              {event.status === 'fixed' ? 'Pipeline Completed' : 
               event.status === 'failed' || event.status === 'error' ? 'Pipeline Failed' : 
               `Pipeline ${event.status}`}
            </span>
          </div>
        </div>

        {event.error && (
          <div className="error-section mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded">
            <span className="text-red-300 font-medium">Pipeline Error:</span>
            <div className="text-red-200 text-sm mt-1">{String(event.error)}</div>
          </div>
        )}
      </div>
    )
  }

  const runTest = async (fileName) => {
    setIsRunning(true)
    setTestResults(prev => ({ ...prev, [fileName]: { status: 'running', message: 'Starting test execution...' } }))
    
    try {
      const data = await api.frameworkRunTest({ fileName })
      
      setTestResults(prev => ({
        ...prev,
        [fileName]: {
          status: data.success ? 'passed' : 'failed',
          message: data.message,
          details: data.details,
          healingAttempts: data.healingAttempts || []
        }
      }))
      
      // Show AI healing popup if there were healing attempts
      if (data.healingAttempts && data.healingAttempts.length > 0) {
        setAiHealing(prev => ({ 
          ...prev, 
          [fileName]: {
            visible: true,
            attempts: data.healingAttempts
          }
        }))
      }
      
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [fileName]: { 
          status: 'error', 
          message: error.message 
        } 
      }))
    } finally {
      setIsRunning(false)
    }
  }

  const runAllTests = async () => {
    if (testFiles.length === 0) return
    
    setIsRunning(true)
    
    // Set all tests to running status
    const runningResults = {}
    testFiles.forEach(file => {
      runningResults[file.name] = { status: 'running', message: 'Starting test execution...' }
    })
    setTestResults(runningResults)
    
    // Run all tests sequentially
    for (const file of testFiles) {
      try {
        const data = await api.frameworkRunTest({ fileName: file.name })
        
        setTestResults(prev => ({
          ...prev,
          [file.name]: {
            status: data.success ? 'passed' : 'failed',
            message: data.message,
            details: data.details,
            healingAttempts: data.healingAttempts || []
          }
        }))
        
        // Show AI healing popup if there were healing attempts
        if (data.healingAttempts && data.healingAttempts.length > 0) {
          setAiHealing(prev => ({ 
            ...prev, 
            [file.name]: {
              visible: true,
              attempts: data.healingAttempts
            }
          }))
        }
        
        // Small delay between tests to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Test execution failed for ${file.name}:`, error)
        setTestResults(prev => ({ 
          ...prev, 
          [file.name]: { 
            status: 'error', 
            message: error.message 
          } 
        }))
      }
    }
    
    setIsRunning(false)
  }

  const closeHealingPopup = (fileName) => {
    setAiHealing(prev => ({ 
      ...prev, 
      [fileName]: { ...prev[fileName], visible: false }
    }))
  }

  const getAccurateCounts = () => {
    const successfulFixes = events.filter((e) => e.type === 'locatorFix' && e.status === 'fixed').length
    const totalRuns = events.filter((e) => e.type === 'locatorFix').length
    const currentlyExecuting = executingPipelines.size
    return { totalRuns, successfulFixes, currentlyExecuting }
  }

  const counts = getAccurateCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card-dark p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <span className="mr-3">🚀</span>
              AI Healing Dashboard
            </h1>
            <p className="text-slate-300 mt-1">Real-time Locator Healing & Self-Healing Automation</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-white">
              <span className="mr-2">🕐</span>
              {currentTime.toLocaleTimeString()}
            </div>
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              {isConnected ? 'Pipeline Active' : 'Pipeline Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="glass-card-dark p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Pipeline Statistics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">{counts.totalRuns}</div>
            <div className="text-slate-300 text-sm">Total Healing Runs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{counts.successfulFixes}</div>
            <div className="text-slate-300 text-sm">Successful Fixes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">{counts.currentlyExecuting}</div>
            <div className="text-slate-300 text-sm">Currently Executing</div>
          </div>
        </div>
      </div>

      {/* Test Files Section */}
      <div className="glass-card-dark p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">🧪 Test Files</h2>
          {testFiles.length > 0 && (
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="btn-rtctek btn-rtctek-sm disabled:opacity-50"
            >
              {isRunning ? 'Running All...' : '🚀 Run All'}
            </button>
          )}
        </div>
        <div className="text-sm text-slate-300 mb-6">
          Run tests to trigger AI healing and see real-time locator fixes
        </div>

        {/* Test Files List */}
        <div className="space-y-4">
          {testFiles.length === 0 ? (
            <div className="text-slate-300 text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <div>No test files found</div>
              <div className="text-sm text-slate-400 mt-1">Create some test files to get started</div>
            </div>
          ) : (
            <div className="space-y-3">
              {testFiles.map((file, index) => {
                const result = testResults[file.name]
                const healing = aiHealing[file.name]
                
                return (
                  <div key={index} className="border border-slate-600 rounded-lg p-4 bg-slate-800/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🧪</span>
                        <div>
                          <div className="text-white font-medium">{file.name}</div>
                          <div className="text-sm text-slate-400">{file.path}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {result && (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            result.status === 'passed' ? 'bg-green-900/30 text-green-300' :
                            result.status === 'failed' ? 'bg-red-900/30 text-red-300' :
                            result.status === 'running' ? 'bg-blue-900/30 text-blue-300' :
                            'bg-gray-900/30 text-gray-300'
                          }`}>
                            {result.status === 'passed' ? '✅ Passed' :
                             result.status === 'failed' ? '❌ Failed' :
                             result.status === 'running' ? '⏳ Running' :
                             '❓ Error'}
                          </div>
                        )}
                        
                        <button
                          onClick={() => runTest(file.name)}
                          disabled={isRunning}
                          className="btn-rtctek btn-rtctek-sm disabled:opacity-50"
                        >
                          {isRunning ? 'Running...' : 'Run Test'}
                        </button>
                      </div>
                    </div>

                    {result && (
                      <div className="mt-3 p-3 bg-slate-700/50 rounded">
                        <div className="text-sm text-slate-300 mb-2">{result.message}</div>
                        {result.healingAttempts && result.healingAttempts.length > 0 && (
                          <div className="text-sm text-cyan-300">
                            🔧 {result.healingAttempts.length} AI healing attempt(s) made
                          </div>
                        )}
                      </div>
                    )}

                    {/* Code Preview */}
                    <details className="mt-3">
                      <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                        View Code
                      </summary>
                      <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-slate-300 overflow-x-auto">
                        {file.content}
                      </pre>
                    </details>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Events */}
      <div className="glass-card-dark p-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-2">Pipeline Ready</h3>
            <p className="text-slate-300">
              Start running tests to see real-time AI healing processes in action
            </p>
            <div className="mt-6 flex justify-center">
              <div className="animate-pulse">
                <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Pipeline Execution Log</h3>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                LIVE - {counts.currentlyExecuting} Active
              </div>
            </div>

            <div className="space-y-4">
              {events.map((event, i) => (
                <div
                  key={i}
                  className={`border rounded-lg p-4 ${
                    isCurrentlyExecuting(event) 
                      ? 'border-blue-500 bg-blue-900/10' 
                      : event.status === 'fixed' 
                        ? 'border-green-500 bg-green-900/10' 
                        : 'border-slate-600 bg-slate-800/50'
                  }`}
                >
                  {/* Event Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🔧</span>
                      <div>
                        <div className="text-lg font-medium text-white">Locator Healing Pipeline</div>
                        {isCurrentlyExecuting(event) && (
                          <div className="flex items-center text-blue-400 text-sm">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                            EXECUTING
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      <div>{formatRelativeTime(event.time || event.executionStartTime)}</div>
                      {event.executionStartTime && (
                        <div className="text-xs">
                          Duration: {Math.floor((Date.now() - event.executionStartTime) / 1000)}s
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Event Content */}
                  {getDynamicContent(event)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Healing Popup */}
      {Object.entries(aiHealing).map(([fileName, healing]) => (
        healing.visible && (
          <div key={fileName} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg border border-slate-600 p-6 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-medium text-white">🤖 AI Locator Healing</div>
                <button
                  onClick={() => closeHealingPopup(fileName)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="text-sm text-slate-200 mb-4">
                AI detected failing locators in <code className="bg-slate-700 px-1 rounded">{fileName}</code> and attempted to fix them:
              </div>
              
              <div className="space-y-3">
                {healing.attempts.map((attempt, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded p-3">
                    <div className="text-sm font-medium text-cyan-300 mb-2">
                      Locator: {attempt.locatorKey}
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div><span className="text-red-300">❌ Failed:</span> <code>{attempt.originalLocator}</code></div>
                      <div><span className="text-green-300">✅ Fixed:</span> <code>{attempt.newLocator}</code></div>
                      {attempt.reason && (
                        <div><span className="text-yellow-300">💡 Reason:</span> {attempt.reason}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => closeHealingPopup(fileName)}
                  className="btn-rtctek btn-rtctek-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  )
}
