import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import SimpleTest from './components/SimpleTest'

// Simple placeholder components

const SimpleAnalytics = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">📊 Analytics</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Analytics content will go here</p>
      </div>
    </div>
  </div>
)

const SimpleSettings = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">⚙️ Settings</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Settings content will go here</p>
      </div>
    </div>
  </div>
)

const SimpleBacktest = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">🧪 Backtest</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Backtest content will go here</p>
      </div>
    </div>
  </div>
)

const SimpleVisualization = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">📈 Visualization</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600">Visualization content will go here</p>
      </div>
    </div>
  </div>
)

function AppRouting() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Simple Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">Trading Bot</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                <Link to="/" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-900 bg-gray-100">
                  Dashboard
                </Link>
                <Link to="/analytics" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  Analytics
                </Link>
                <Link to="/settings" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  Settings
                </Link>
                <Link to="/backtest" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  Backtest
                </Link>
                <Link to="/visualization" className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                  Visualization
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Routes>
            <Route path="/" element={<SimpleTest />} />
            <Route path="/analytics" element={<SimpleAnalytics />} />
            <Route path="/settings" element={<SimpleSettings />} />
            <Route path="/backtest" element={<SimpleBacktest />} />
            <Route path="/visualization" element={<SimpleVisualization />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AppRouting
