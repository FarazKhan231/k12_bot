import React, { useState, useEffect } from 'react'
import TestModal from './TestModal'
import GPT5AgentModal from './GPT5AgentModal'
import JiraTickets from './JiraTickets'
import './App.css'

function App() {
  const [showTestModal, setShowTestModal] = useState(false)
  const [showGPT5Modal, setShowGPT5Modal] = useState(false)
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('projects') // 'projects' or 'jira'

  useEffect(() => {
    fetchAgents()
    // Poll for agent updates every 5 seconds
    const interval = setInterval(fetchAgents, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:8787/api/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const handleCreateAgent = async (agentData) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8787/api/agent/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Agent created:', result)
        setShowGPT5Modal(false)
        fetchAgents() // Refresh agents list
      } else {
        console.error('Failed to create agent')
      }
    } catch (error) {
      console.error('Error creating agent:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🤖 AI Testing Agent Platform
          </h1>
          <p className="text-xl text-gray-600">
            Choose your testing approach: Traditional Test Runner, GPT-5 Agent, or JIRA Integration
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden">
            <button 
              onClick={() => setActiveTab('projects')} 
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'projects' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              🧪 Test Projects
            </button>
            <button 
              onClick={() => setActiveTab('jira')} 
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'jira' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              🎫 JIRA Tickets
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'projects' ? (
          <>
            {/* Main Action Buttons */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Traditional Test Runner */}
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300">
                <div className="text-center">
                  <div className="text-6xl mb-4">🧪</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Traditional Test Runner
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Run predefined test cases with AI assistance. Good for structured testing scenarios.
                  </p>
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200"
                  >
                    Start Traditional Testing
                  </button>
                </div>
              </div>

              {/* GPT-5 Agent */}
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-purple-200">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    GPT-5 Agent Mode
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Create intelligent agents that autonomously test websites using advanced AI reasoning.
                  </p>
                  <button
                    onClick={() => setShowGPT5Modal(true)}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200"
                  >
                    {loading ? 'Creating Agent...' : 'Create GPT-5 Agent'}
                  </button>
                </div>
              </div>
            </div>

            {/* Active Agents Section */}
            {agents.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  🤖 Active Agents ({agents.length})
                </h2>
                <div className="grid gap-4">
                  {agents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        agent.status === 'running' ? 'border-blue-500 bg-blue-50' :
                        agent.status === 'completed' ? 'border-green-500 bg-green-50' :
                        agent.status === 'failed' ? 'border-red-500 bg-red-50' :
                        'border-gray-500 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {agent.testType} Test - {agent.url}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Status: <span className="capitalize">{agent.status}</span>
                            {agent.createdAt && ` • Created: ${new Date(agent.createdAt).toLocaleString()}`}
                          </p>
                                                {agent.actions.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Actions: {agent.actions.length} • Results: {agent.results.length}
                          {agent.reportUrl && (
                            <span className="ml-2">
                              • <a 
                                href={`http://localhost:8787${agent.reportUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                📄 View Report
                              </a>
                            </span>
                          )}
                        </p>
                      )}
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            agent.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            agent.status === 'completed' ? 'bg-green-100 text-green-800' :
                            agent.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>
                      {agent.error && (
                        <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-700">
                          Error: {agent.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <JiraTickets />
        )}
      </div>

      {/* Modals */}
      {showTestModal && (
        <TestModal
          onClose={() => setShowTestModal(false)}
        />
      )}
      
      {showGPT5Modal && (
        <GPT5AgentModal
          onClose={() => setShowGPT5Modal(false)}
          onSubmit={handleCreateAgent}
          loading={loading}
        />
      )}
    </div>
  )
}

export default App
