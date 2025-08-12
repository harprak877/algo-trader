import React, { useState, useEffect } from 'react'
import {
  PlayIcon,
  StopIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import { useWebSocket } from '../hooks/useWebSocket'
import StatusIndicator from '../components/StatusIndicator'
import PositionsTable from '../components/PositionsTable'
import TradeFeed from '../components/TradeFeed'
import axios from 'axios'
import toast from 'react-hot-toast'

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

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [symbols, setSymbols] = useState('AAPL,TSLA,SPY')
  const { connected, lastMessage } = useWebSocket()

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...')
      const response = await axios.get('/api/dashboard')
      console.log('Dashboard response:', response.data)
      setDashboardData(response.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status)
        console.error('Response data:', error.response?.data)
      }
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 5000) // Refresh every 5 seconds
    
    // Debug logging
    console.log('Dashboard mounted, WebSocket connected:', connected)
    console.log('Dashboard data:', dashboardData)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (lastMessage?.type === 'status_update') {
      fetchDashboardData()
    }
  }, [lastMessage])

  const startLiveTrading = async () => {
    try {
      const symbolsArray = symbols.split(',').map(s => s.trim())
      const response = await axios.post('/api/live/start', { symbols: symbolsArray })
      console.log('Live trading started:', response.data)
      toast.success('Live trading started successfully!')
      
      // Update bot status to show it's running
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          bot_status: {
            status: 'running',
            last_update: new Date().toISOString()
          }
        })
      }
      
      // Refresh dashboard data
      fetchDashboardData()
    } catch (error) {
      console.error('Error starting live trading:', error)
      toast.error('Failed to start live trading')
    }
  }

  const stopLiveTrading = async () => {
    try {
      const response = await axios.post('/api/live/stop')
      console.log('Live trading stopped:', response.data)
      toast.success('Live trading stopped successfully!')
      
      // Update bot status to show it's stopped
      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          bot_status: {
            status: 'stopped',
            last_update: new Date().toISOString()
          }
        })
      }
      
      // Refresh dashboard data
      fetchDashboardData()
    } catch (error) {
      console.error('Error stopping live trading:', error)
      toast.error('Failed to stop live trading')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const isLiveTrading = dashboardData?.bot_status.status === 'running'
  const dailyPnlPositive = (dashboardData?.daily_pnl || 0) >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Trading Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Real-time trading bot monitoring and control
          </p>
        </div>
        <StatusIndicator
          status={dashboardData?.bot_status.status || 'unknown'}
          connected={connected}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 bg-blue-500 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-blue-600">Portfolio Value</div>
              <div className="text-2xl font-bold text-gray-900">
                ${dashboardData?.account.equity.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 bg-green-500 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-green-600">Buying Power</div>
              <div className="text-2xl font-bold text-gray-900">
                ${dashboardData?.account.buying_power.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

                <div className={`bg-gradient-to-br ${dailyPnlPositive ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200'} border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`p-2 ${dailyPnlPositive ? 'bg-green-500' : 'bg-red-500'} rounded-lg`}>
                {dailyPnlPositive ? (
                  <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                ) : (
                  <ArrowTrendingDownIcon className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            <div className="ml-4">
              <div className={`text-sm font-medium ${dailyPnlPositive ? 'text-green-600' : 'text-red-600'}`}>Daily P&L</div>
              <div className={`text-2xl font-bold ${dailyPnlPositive ? 'text-green-600' : 'text-red-600'}`}>
                ${dashboardData?.daily_pnl.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 bg-purple-500 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-purple-600">Open Positions</div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData?.positions.length || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Trading Controls</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label htmlFor="symbols" className="block text-sm font-medium text-gray-700 mb-3">
              Trading Symbols
            </label>
            <input
              type="text"
              id="symbols"
              value={symbols}
              onChange={(e) => setSymbols(e.target.value)}
              placeholder="AAPL, TSLA, SPY"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isLiveTrading}
            />
          </div>
          <div className="flex items-end">
            {isLiveTrading ? (
              <button
                onClick={stopLiveTrading}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center shadow-sm hover:shadow-md"
              >
                <StopIcon className="h-4 w-4 mr-2" />
                Stop Trading
              </button>
            ) : (
              <button
                onClick={startLiveTrading}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!symbols.trim()}
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start Trading
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positions Table */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Open Positions</h2>
          <PositionsTable positions={dashboardData?.positions || []} />
        </div>

        {/* Trade Feed */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Trades</h2>
          <TradeFeed trades={dashboardData?.recent_trades || []} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
