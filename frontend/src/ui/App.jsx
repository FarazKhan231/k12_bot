import React, {useState} from 'react'
import TestModal from './TestModal.jsx'
import JiraTickets from './JiraTickets.jsx'

const projects = [
  { id: 'lavinia', name: 'Lavinia', desc: 'Run tests for Lavinia', emoji: '🧪' },
  { id: 'passagePrep', name: 'passagePrep', desc: 'Run tests for passagePrep', emoji: '📘' },
  { id: 'teachingChannel', name: 'teaching channel', desc: 'Run tests for Teaching Channel', emoji: '🎓' },
]

function Card({project, onClick}){
  return (
    <button onClick={() => onClick(project)} className="card p-6 text-left hover:scale-[1.01] transition w-full">
      <div className="text-3xl mb-3">{project.emoji}</div>
      <div className="font-semibold text-slate-900 text-xl">{project.name}</div>
      <div className="text-slate-500">{project.desc}</div>
    </button>
  )
}

export default function App(){
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('projects') // 'projects' or 'jira'

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">QA Agent</h1>
        <p className="text-slate-600">Pick a project, choose a test type, then provide a URL or screenshot.</p>
      </header>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map(p => (
              <Card key={p.id} project={p} onClick={(prj)=>{setSelected(prj); setOpen(true)}} />
            ))}
          </div>
          <TestModal open={open} selected={selected} onClose={()=>setOpen(false)} />
        </>
      ) : (
        <JiraTickets />
      )}
    </div>
  )
}
