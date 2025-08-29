import React, { useState } from 'react'

const TEST_OPTIONS = ['exploratory', 'smoke', 'regression', 'feature']

export default function TestModal({open, onClose, selected}){
  const [testType, setTestType] = useState('exploratory')
  const [tab, setTab] = useState('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState(null)
  const [testCasesFile, setTestCasesFile] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  if(!open) return null

  const onSubmit = async () => {
    setSubmitting(true)
    setMessage('')
    try{
      const form = new FormData()
      form.append('projectId', selected?.id || 'unknown')
      form.append('projectName', selected?.name || 'Unknown')
      form.append('testType', testType)
      form.append('targetKind', tab)
      if(tab === 'url'){
        form.append('url', url)
      } else {
        if(!file){ throw new Error('Please choose a screenshot file') }
        form.append('screenshot', file)
      }

      if(testCasesFile){
        form.append('testCases', testCasesFile)
      }

      const res = await fetch(import.meta.env.VITE_API_BASE + '/api/test-runs', {
        method: 'POST',
        body: form
      })
      const data = await res.json()
      if(!res.ok){ throw new Error(data?.error || 'Request failed')}
      setMessage('✅ Test started. Run ID: ' + data.runId)
    }catch(err){
      setMessage('❌ ' + err.message)
    }finally{
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="card w-full max-w-xl p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">New Test · <span className="text-slate-500">{selected?.name}</span></h2>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <label className="block mb-2 text-sm font-medium text-slate-700">Test type</label>
        <div className="flex gap-2 mb-4 flex-wrap">
          {TEST_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={()=>setTestType(opt)}
              className={"btn " + (testType===opt ? "btn-primary" : "")}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <div className="inline-flex mb-3 rounded-xl border border-slate-200 overflow-hidden">
            <button onClick={()=>setTab('url')} className={"px-4 py-2 " + (tab==='url' ? 'bg-slate-900 text-white' : '')}>URL</button>
            <button onClick={()=>setTab('screenshot')} className={"px-4 py-2 " + (tab==='screenshot' ? 'bg-slate-900 text-white' : '')}>Screenshot</button>
          </div>

          {tab==='url' ? (
            <input
              type="url"
              placeholder="https://example.com"
              className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={url}
              onChange={e=>setUrl(e.target.value)}
            />
          ) : (
            <input
              type="file"
              accept="image/*"
              className="w-full"
              onChange={e=>setFile(e.target.files?.[0])}
            />
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-slate-700">Optional: Upload Excel test cases (.xlsx)</label>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="w-full"
            onChange={e=>setTestCasesFile(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-slate-500 mt-1">Include a column "suite" with values like all, exploratory, smoke, regression, feature. Columns: action, selector|id|name|placeholder|text, value, notes.</p>
        </div>

        <div className="flex items-center gap-3">
          <button disabled={submitting} className={"btn btn-primary " + (submitting?'opacity-60 cursor-not-allowed':'')} onClick={onSubmit}>
            {submitting ? 'Starting…' : 'Start Test'}
          </button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>
      </div>
    </div>
  )
}
