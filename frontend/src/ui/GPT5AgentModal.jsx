import React, { useState } from 'react'

function GPT5AgentModal({ onClose, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    url: '',
    testType: 'smoke',
    projectId: 'lavinia'
  })

  const testTypes = [
    { value: 'smoke', label: 'Smoke Test', description: 'Basic functionality verification' },
    { value: 'regression', label: 'Regression Test', description: 'Comprehensive feature testing' },
    { value: 'accessibility', label: 'Accessibility Test', description: 'WCAG compliance testing' },
    { value: 'performance', label: 'Performance Test', description: 'Speed and responsiveness testing' },
    { value: 'security', label: 'Security Test', description: 'Vulnerability assessment' }
  ]

  const projects = [
    { id: 'lavinia', name: 'Lavinia', emoji: '🧪' },
    { id: 'passagePrep', name: 'Passage Prep', emoji: '📘' },
    { id: 'teachingChannel', name: 'Teaching Channel', emoji: '🎓' },
    { id: 'custom', name: 'Custom Project', emoji: '🔧' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.url.trim()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🚀</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Create GPT-5 Agent</h2>
                <p className="text-gray-600">Configure an intelligent testing agent</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🌐 Website URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the full URL of the website you want to test
            </p>
          </div>

          {/* Test Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🎯 Test Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testTypes.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.testType === type.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="testType"
                    value={type.value}
                    checked={formData.testType === type.value}
                    onChange={(e) => handleInputChange('testType', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                  {formData.testType === type.value && (
                    <div className="text-purple-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🏢 Project
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    formData.projectId === project.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="projectId"
                    value={project.id}
                    checked={formData.projectId === project.id}
                    onChange={(e) => handleInputChange('projectId', e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-2xl mb-2">{project.emoji}</div>
                  <div className="text-sm font-medium text-gray-800 text-center">{project.name}</div>
                  {formData.projectId === project.id && (
                    <div className="absolute top-2 right-2 text-purple-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Agent Capabilities Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="font-medium text-purple-800 mb-2">🤖 What this GPT-5 Agent will do:</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Navigate to the specified website</li>
              <li>• Analyze page structure and content</li>
              <li>• Perform intelligent testing based on test type</li>
              <li>• Take screenshots at key moments</li>
              <li>• Generate comprehensive test reports</li>
              <li>• Adapt testing strategy based on page content</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.url.trim()}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Agent...
                </>
              ) : (
                '🚀 Create GPT-5 Agent'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GPT5AgentModal
