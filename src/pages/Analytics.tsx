import React, { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import axios from 'axios'

interface PerformanceData {
  metrics: {
    total_trades: number
    win_rate: number
    total_pnl: number
    sharpe_ratio: number
    max_drawdown: number
    total_return: number
  }
  daily_performance: Array<{
    date: string
    balance: number
    pnl: number
  }>
  symbol_distribution: { [key: string]: number }
}

const Analytics: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/performance')
        setData(response.data)
      } catch (error) {
        console.error('Error fetching performance data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No performance data available</p>
      </div>
    )
  }

  const symbolData = Object.entries(data.symbol_distribution).map(([symbol, count]) => ({
    symbol,
    count,
  }))

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Detailed analysis of trading performance and metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-900">
            {data.metrics.total_trades || 0}
          </div>
          <div className="text-sm text-gray-500">Total Trades</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">
            {((data.metrics.win_rate || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Win Rate</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
          <div className={`text-2xl font-bold ${
            (data.metrics.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${(data.metrics.total_pnl || 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">Total P&L</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
          <div className={`text-2xl font-bold ${
            (data.metrics.sharpe_ratio || 0) > 1 ? 'text-green-600' : 
            (data.metrics.sharpe_ratio || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {(data.metrics.sharpe_ratio || 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">Sharpe Ratio</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
          <div className="text-2xl font-bold text-red-600">
            {((data.metrics.max_drawdown || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Max Drawdown</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
          <div className={`text-2xl font-bold ${
            (data.metrics.total_return || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {((data.metrics.total_return || 0) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Total Return</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Portfolio Equity Curve</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.daily_performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line type="monotone" dataKey="balance" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily P&L */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Daily P&L</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.daily_performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Bar 
                dataKey="pnl" 
                fill="#3B82F6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Symbol Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Trade Distribution by Symbol</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={symbolData}
                dataKey="count"
                nameKey="symbol"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ symbol, count }: any) => `${symbol}: ${count}`}
              >
                {symbolData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Symbol Statistics */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Symbol Statistics</h2>
          <div className="space-y-3">
            {symbolData.map((item, index) => (
              <div key={item.symbol} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{item.symbol}</span>
                </div>
                <span className="text-gray-600">{item.count} trades</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
