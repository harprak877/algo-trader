import React, { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import axios from 'axios'

interface ChartData {
  candlestick: Array<{
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  sma_short: Array<{
    date: string
    value: number | null
  }>
  sma_long: Array<{
    date: string
    value: number | null
  }>
  trades: Array<{
    date: string
    price: number
    action: string
    quantity: number
    reason: string
  }>
}

const TradeVisualization: React.FC = () => {
  const [symbol, setSymbol] = useState('AAPL')
  const [days, setDays] = useState(30)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchChartData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/chart-data/${symbol}?days=${days}`)
      setChartData(response.data)
    } catch (error) {
      console.error('Error fetching chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChartData()
  }, [symbol, days])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const plotData = chartData ? [
    // Candlestick chart
    {
      x: chartData.candlestick.map(d => d.date),
      open: chartData.candlestick.map(d => d.open),
      high: chartData.candlestick.map(d => d.high),
      low: chartData.candlestick.map(d => d.low),
      close: chartData.candlestick.map(d => d.close),
      type: 'candlestick' as const,
      name: symbol,
      increasing: { line: { color: '#10B981' } },
      decreasing: { line: { color: '#EF4444' } },
    },
    // Short SMA
    {
      x: chartData.sma_short.map(d => d.date),
      y: chartData.sma_short.map(d => d.value),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Short SMA',
      line: { color: '#3B82F6', width: 2 },
    },
    // Long SMA
    {
      x: chartData.sma_long.map(d => d.date),
      y: chartData.sma_long.map(d => d.value),
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: 'Long SMA',
      line: { color: '#F59E0B', width: 2 },
    },
    // Buy trades
    {
      x: chartData.trades.filter(t => t.action === 'BUY').map(t => t.date),
      y: chartData.trades.filter(t => t.action === 'BUY').map(t => t.price),
      type: 'scatter' as const,
      mode: 'markers' as const,
      name: 'Buy Orders',
      marker: {
        symbol: 'triangle-up',
        size: 12,
        color: '#10B981',
      },
      text: chartData.trades.filter(t => t.action === 'BUY').map(t => 
        `${t.action}: ${t.quantity} shares at $${t.price.toFixed(2)}<br>${t.reason}`
      ),
      hovertemplate: '%{text}<extra></extra>',
    },
    // Sell trades
    {
      x: chartData.trades.filter(t => t.action === 'SELL').map(t => t.date),
      y: chartData.trades.filter(t => t.action === 'SELL').map(t => t.price),
      type: 'scatter' as const,
      mode: 'markers' as const,
      name: 'Sell Orders',
      marker: {
        symbol: 'triangle-down',
        size: 12,
        color: '#EF4444',
      },
      text: chartData.trades.filter(t => t.action === 'SELL').map(t => 
        `${t.action}: ${t.quantity} shares at $${t.price.toFixed(2)}<br>${t.reason}`
      ),
      hovertemplate: '%{text}<extra></extra>',
    },
  ] : []

  const layout = {
    title: `${symbol} - Trading Visualization`,
    xaxis: {
      title: 'Date',
      rangeslider: { visible: false },
    },
    yaxis: {
      title: 'Price ($)',
    },
    height: 600,
    showlegend: true,
    legend: {
      x: 0,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.8)',
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trade Visualization</h1>
        <p className="mt-1 text-sm text-gray-500">
          Interactive charts showing strategy signals and trade execution
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symbol
            </label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="input"
            >
              <option value="AAPL">AAPL</option>
              <option value="TSLA">TSLA</option>
              <option value="SPY">SPY</option>
              <option value="QQQ">QQQ</option>
              <option value="MSFT">MSFT</option>
              <option value="GOOGL">GOOGL</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="input"
            >
              <option value={7}>1 Week</option>
              <option value={30}>1 Month</option>
              <option value={90}>3 Months</option>
              <option value={180}>6 Months</option>
              <option value={365}>1 Year</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchChartData}
              className="btn-primary"
            >
              Update Chart
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {chartData ? (
          <Plot
            data={plotData}
            layout={layout}
            style={{ width: '100%' }}
            config={{
              responsive: true,
              displayModeBar: true,
              modeBarButtonsToRemove: ['pan2d', 'lasso2d'],
            }}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No chart data available</p>
          </div>
        )}
      </div>

      {/* Trade Summary */}
      {chartData && chartData.trades.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Trade Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-500">Total Trades</div>
              <div className="text-2xl font-bold">{chartData.trades.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-sm text-gray-500">Buy Orders</div>
              <div className="text-2xl font-bold text-green-600">
                {chartData.trades.filter(t => t.action === 'BUY').length}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-sm text-gray-500">Sell Orders</div>
              <div className="text-2xl font-bold text-red-600">
                {chartData.trades.filter(t => t.action === 'SELL').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TradeVisualization
