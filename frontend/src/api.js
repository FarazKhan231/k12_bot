const API_BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8787'

async function request(path, options={}){
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers||{}) },
      ...options
    })
    if(!res.ok){
      const text = await res.text().catch(()=> '')
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    const ct = res.headers.get('content-type') || ''
    if(ct.includes('application/json')) return res.json()
    return res.text()
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to backend server. Please ensure the backend is running on ${API_BASE}. Check the console for more details.`)
    }
    throw error
  }
}

export const api = {
  // Health
  health(){ return request('/api/health') },

  // Jira
  jiraTest(){ return request('/api/jira/test-connection') },
  jiraTickets(username){ return request(`/api/jira/tickets/${encodeURIComponent(username)}`) },
  jiraTicket(key){ return request(`/api/jira/ticket/${encodeURIComponent(key)}`) },
  jiraGenerateTestCases(payload){ return request('/api/jira/generate-test-cases', { method: 'POST', body: JSON.stringify(payload) }) },
  jiraGeneratePlaywright(payload){ return request('/api/jira/generate-playwright', { method: 'POST', body: JSON.stringify(payload) }) },
  jiraRunPlaywright(payload){ return request('/api/jira/run-playwright', { method: 'POST', body: JSON.stringify(payload) }) },
  
  // Playwright individual test execution
  runIndividualTest(payload){ return request('/api/playwright/run-test', { method: 'POST', body: JSON.stringify(payload) }) },

  // Agent
  agentCreate(payload){ return request('/api/agent/create', { method: 'POST', body: JSON.stringify(payload) }) },
  agentStatus(id){ return request(`/api/agent/${encodeURIComponent(id)}/status`) },
  agents(){ return request('/api/agents') },

  // Framework
  frameworkTestFiles(){ return request('/api/framework/test-files') },
  frameworkRunTest(payload){ return request('/api/framework/run-test', { method: 'POST', body: JSON.stringify(payload) }) },

  // Test runs (multipart expected by backend)
  async startTestRun(formData){
    const res = await fetch(`${API_BASE}/api/test-runs`, { method: 'POST', body: formData })
    if(!res.ok){
      const text = await res.text().catch(()=> '')
      throw new Error(`HTTP ${res.status}: ${text}`)
    }
    return res.json()
  }
}


