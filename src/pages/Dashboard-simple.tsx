import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface DashboardData {
  account: {
    cash: number
    equity: number
    buying_power: number
    positions_count: number
  }
  positions: any[]
  recent_trades: any[]
  daily_pnl: number
  bot_status: {
    status: string
    last_update: string
  }
}

const DashboardSimple: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [symbols, setSymbols] = useState('AAPL,TSLA,SPY')

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...')
      const response = await axios.get('/api/dashboard')
      console.log('Dashboard response:', response.data)
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const startLiveTrading = async () => {
    try {
      const symbolsArray = symbols.split(',').map(s => s.trim())
      const response = await axios.post('/api/live/start', { symbols: symbolsArray })
      console.log('Live trading started:', response.data)
      fetchDashboardData()
    } catch (error) {
      console.error('Error starting live trading:', error)
    }
  }

  const stopLiveTrading = async () => {
    try {
      const response = await axios.post('/api/live/stop')
      console.log('Live trading stopped:', response.data)
      fetchDashboardData()
    } catch (error) {
      console.error('Error stopping live trading:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">🚀 Dashboard</h1>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">🚀 Dashboard</h1>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cash</h3>
            <p className="text-3xl font-bold text-blue-600">
              ${dashboardData?.account.cash.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Equity</h3>
            <p className="text-3xl font-bold text-green-600">
              ${dashboardData?.account.equity.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily P&L</h3>
            <p className={`text-3xl font-bold ${dashboardData?.daily_pnl && dashboardData.daily_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${dashboardData?.daily_pnl?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Bot Status</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${dashboardData?.bot_status.status === 'running' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-lg font-medium capitalize">
                {dashboardData?.bot_status.status || 'stopped'}
              </span>
            </div>
          </div>
        </div>

        {/* Trading Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Trading Controls</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              value={symbols}
              onChange={(e) => setSymbols(e.target.value)}
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
          </div>
        </div>

        {/* Recent Trades */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Trades</h2>
          {dashboardData?.recent_trades && dashboardData.recent_trades.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recent_trades.slice(0, 5).map((trade, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="font-medium">{trade.symbol}</span>
                  <span className={`font-medium ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toLocaleString() || '0'}
                  </span>
                  <span className="text-gray-500">{trade.action}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No recent trades</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardSimple
