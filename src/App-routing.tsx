import React, { useState } from 'react'
import { Routes, Route, Link } from 'react-router-dom'

// Simple placeholder components
const SimpleDashboard = () => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      console.log('Dashboard data:', data)
      
      // Update the display manually
      const cashElement = document.getElementById('cash-amount')
      const equityElement = document.getElementById('equity-amount')
      const statusElement = document.getElementById('bot-status')
      const pnlElement = document.getElementById('daily-pnl')
      const statusDotElement = document.getElementById('status-dot')
      
      if (cashElement) cashElement.textContent = `$${data?.account?.cash?.toLocaleString() || '0'}`
      if (equityElement) equityElement.textContent = `$${data?.account?.equity?.toLocaleString() || '0'}`
      if (statusElement) statusElement.textContent = data?.bot_status?.status || 'stopped'
      
      if (pnlElement) {
        const pnl = data?.daily_pnl || 0
        pnlElement.textContent = `$${pnl.toLocaleString()}`
        pnlElement.className = `text-3xl font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`
      }
      
      if (statusDotElement) {
        const status = data?.bot_status?.status || 'stopped'
        statusDotElement.className = `w-3 h-3 rounded-full ${status === 'running' ? 'bg-green-500' : 'bg-red-500'}`
      }
      
      // Update trades
      updateTrades(data?.recent_trades || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const startLiveTrading = async () => {
    try {
      const symbolsInput = document.getElementById('symbols-input') as HTMLInputElement
      const symbols = symbolsInput ? symbolsInput.value : 'AAPL,TSLA,SPY'
      const symbolsArray = symbols.split(',').map(s => s.trim())
      
      console.log('Starting live trading with symbols:', symbolsArray)
      
      const response = await fetch('/api/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: symbolsArray })
      })
      
      const result = await response.json()
      console.log('Live trading started:', result)
      
      // Refresh data after starting
      fetchData()
      
    } catch (error) {
      console.error('Error starting live trading:', error)
    }
  }

  const stopLiveTrading = async () => {
    try {
      console.log('Stopping live trading...')
      
      const response = await fetch('/api/live/stop', {
        method: 'POST'
      })
      
      const result = await response.json()
      console.log('Live trading stopped:', result)
      
      // Refresh data after stopping
      fetchData()
      
    } catch (error) {
      console.error('Error stopping live trading:', error)
    }
  }

  const updateTrades = (trades: any[]) => {
    const tradesContainer = document.getElementById('trades-container')
    if (!tradesContainer) return
    
    if (trades.length === 0) {
      tradesContainer.innerHTML = '<p class="text-gray-600">No recent trades</p>'
      return
    }
    
    const tradesHTML = trades.slice(0, 5).map((trade, index) => `
      <div class="flex justify-between items-center py-2 border-b border-gray-100">
        <span class="font-medium">${trade.symbol || 'Unknown'}</span>
        <span class="font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}">
          ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl?.toLocaleString() || '0'}
        </span>
        <span class="text-gray-500">${trade.action || 'Unknown'}</span>
      </div>
    `).join('')
    
    tradesContainer.innerHTML = tradesHTML
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">🚀 Live Trading Dashboard</h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cash</h3>
            <p id="cash-amount" className="text-3xl font-bold text-blue-600">$0</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Equity</h3>
            <p id="equity-amount" className="text-3xl font-bold text-green-600">$0</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily P&L</h3>
            <p id="daily-pnl" className="text-3xl font-bold text-gray-600">$0</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bot Status</h3>
            <div className="flex items-center space-x-2">
              <div id="status-dot" className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span id="bot-status" className="text-lg font-medium capitalize">stopped</span>
            </div>
          </div>
        </div>

        {/* Trading Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Trading Controls</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              id="symbols-input"
              defaultValue="AAPL,TSLA,SPY"
              placeholder="AAPL,TSLA,SPY"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={startLiveTrading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Trading
            </button>
            <button
              onClick={stopLiveTrading}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop Trading
            </button>
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Trades</h2>
          <div id="trades-container">
            <p className="text-gray-600">No recent trades</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Instructions</h2>
          <p className="text-gray-600">Use the trading controls to start/stop live trading and refresh data.</p>
          <p className="text-gray-600 mt-2">Check the browser console for detailed logs.</p>
        </div>
      </div>
    </div>
  )
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
            <Route path="/" element={<SimpleDashboard />} />
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
