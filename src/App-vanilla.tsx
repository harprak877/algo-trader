import React from 'react'

const AppVanilla: React.FC = () => {
  // This will be called after the component mounts
  React.useEffect(() => {
    // Initialize the dashboard with vanilla JavaScript
    const initDashboard = () => {
      console.log('Initializing vanilla dashboard...')
      
      // Create the dashboard HTML
      const dashboardHTML = `
        <div class="min-h-screen bg-gray-50 p-8">
          <div class="max-w-7xl mx-auto">
            <h1 class="text-4xl font-bold text-gray-900 mb-8">🚀 Live Trading Dashboard</h1>
            
            <!-- Status Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Cash</h3>
                <p id="cash-amount" class="text-3xl font-bold text-blue-600">$0</p>
              </div>
              
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Equity</h3>
                <p id="equity-amount" class="text-3xl font-bold text-green-600">$0</p>
              </div>
              
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Daily P&L</h3>
                <p id="daily-pnl" class="text-3xl font-bold text-gray-600">$0</p>
              </div>
              
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Bot Status</h3>
                <div class="flex items-center space-x-2">
                  <div id="status-dot" class="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span id="bot-status" class="text-lg font-medium capitalize">stopped</span>
                </div>
              </div>
            </div>

            <!-- Trading Controls -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Trading Controls</h2>
              <div class="flex flex-wrap gap-4 items-center">
                <input
                  type="text"
                  id="symbols-input"
                  value="AAPL,TSLA,SPY"
                  placeholder="AAPL,TSLA,SPY"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  id="start-trading-btn"
                  class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Trading
                </button>
                <button
                  id="stop-trading-btn"
                  class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Stop Trading
                </button>
                <button
                  id="refresh-btn"
                  class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>

            <!-- Recent Trades -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Recent Trades</h2>
              <div id="trades-container">
                <p class="text-gray-600">No recent trades</p>
              </div>
            </div>

            <!-- Live Data -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 class="text-2xl font-semibold text-gray-900 mb-4">Live Data</h2>
              <div id="live-data" class="text-sm text-gray-600">
                <p>Click "Refresh Data" to fetch live trading data</p>
              </div>
            </div>
          </div>
        </div>
      `
      
      // Replace the root content
      const root = document.getElementById('root')
      if (root) {
        root.innerHTML = dashboardHTML
        
        // Add event listeners
        setupEventListeners()
        
        // Initial data fetch
        fetchDashboardData()
      }
    }
    
    // Setup event listeners for the dashboard
    const setupEventListeners = () => {
      const startBtn = document.getElementById('start-trading-btn')
      const stopBtn = document.getElementById('stop-trading-btn')
      const refreshBtn = document.getElementById('refresh-btn')
      
      if (startBtn) {
        startBtn.addEventListener('click', startLiveTrading)
      }
      
      if (stopBtn) {
        stopBtn.addEventListener('click', stopLiveTrading)
      }
      
      if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchDashboardData)
      }
    }
    
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data...')
        const response = await fetch('/api/dashboard')
        const data = await response.json()
        console.log('Dashboard data:', data)
        
        updateDashboard(data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        updateLiveData('Error fetching data: ' + error.message)
      }
    }
    
    // Start live trading
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
        
        updateLiveData('Live trading started successfully!')
        fetchDashboardData()
        
      } catch (error) {
        console.error('Error starting live trading:', error)
        updateLiveData('Error starting live trading: ' + error.message)
      }
    }
    
    // Stop live trading
    const stopLiveTrading = async () => {
      try {
        console.log('Stopping live trading...')
        
        const response = await fetch('/api/live/stop', {
          method: 'POST'
        })
        
        const result = await response.json()
        console.log('Live trading stopped:', result)
        
        updateLiveData('Live trading stopped successfully!')
        fetchDashboardData()
        
      } catch (error) {
        console.error('Error stopping live trading:', error)
        updateLiveData('Error stopping live trading: ' + error.message)
      }
    }
    
    // Update dashboard display
    const updateDashboard = (data: any) => {
      const cashElement = document.getElementById('cash-amount')
      const equityElement = document.getElementById('equity-amount')
      const dailyPnlElement = document.getElementById('daily-pnl')
      const statusElement = document.getElementById('bot-status')
      const statusDotElement = document.getElementById('status-dot')
      
      if (cashElement) {
        cashElement.textContent = `$${data?.account?.cash?.toLocaleString() || '0'}`
      }
      
      if (equityElement) {
        equityElement.textContent = `$${data?.account?.equity?.toLocaleString() || '0'}`
      }
      
      if (dailyPnlElement) {
        const pnl = data?.daily_pnl || 0
        dailyPnlElement.textContent = `$${pnl.toLocaleString()}`
        dailyPnlElement.className = `text-3xl font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`
      }
      
      if (statusElement) {
        statusElement.textContent = data?.bot_status?.status || 'stopped'
      }
      
      if (statusDotElement) {
        const status = data?.bot_status?.status || 'stopped'
        statusDotElement.className = `w-3 h-3 rounded-full ${status === 'running' ? 'bg-green-500' : 'bg-red-500'}`
      }
      
      // Update trades
      updateTrades(data?.recent_trades || [])
      
      // Update live data
      updateLiveData('Data refreshed at ' + new Date().toLocaleTimeString())
    }
    
    // Update trades display
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
    
    // Update live data display
    const updateLiveData = (message: string) => {
      const liveDataElement = document.getElementById('live-data')
      if (liveDataElement) {
        liveDataElement.innerHTML = `
          <p class="text-green-600">${message}</p>
          <p class="text-gray-500 mt-2">Last updated: ${new Date().toLocaleTimeString()}</p>
        `
      }
    }
    
    // Initialize the dashboard
    initDashboard()
    
    // Set up auto-refresh every 10 seconds
    const autoRefreshInterval = setInterval(fetchDashboardData, 10000)
    
    // Cleanup function
    return () => {
      clearInterval(autoRefreshInterval)
    }
  }, [])
  
  // Return a simple loading message while the vanilla JS initializes
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">🚀 Initializing Dashboard...</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600">Loading vanilla JavaScript dashboard...</p>
        </div>
      </div>
    </div>
  )
}

export default AppVanilla
