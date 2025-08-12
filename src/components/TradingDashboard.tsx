import React, { useEffect, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useSessionStore } from '../stores/session_store'

const TradingDashboard: React.FC = () => {
  const {
    sessionId,
    status,
    symbols,
    ticks,
    logs,
    isLogAutoScroll,
    errorMessage,
    startTrading,
    stopTrading,
    clearLogs,
    toggleAutoScroll,
    setSymbols,
    resetSession
  } = useSessionStore()

  const [symbolInput, setSymbolInput] = useState('AAPL,TSLA,SPY')
  const logContainerRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs
  useEffect(() => {
    if (isLogAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, isLogAutoScroll])

  // Focus management for accessibility
  useEffect(() => {
    if (status === 'starting' && statusRef.current) {
      statusRef.current.focus()
    }
  }, [status])

  const handleStartTrading = async () => {
    const symbolList = symbolInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    if (symbolList.length === 0) {
      return
    }
    
    setSymbols(symbolList)
    await startTrading(symbolList)
  }

  const handleStopTrading = async () => {
    await stopTrading()
  }

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbolInput(e.target.value)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-500'
      case 'starting': return 'bg-yellow-500'
      case 'running': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'stopped': return 'bg-gray-400'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle': return 'Idle'
      case 'starting': return 'Starting...'
      case 'running': return 'Running'
      case 'error': return 'Error'
      case 'stopped': return 'Stopped'
      default: return 'Unknown'
    }
  }

  const isStartDisabled = status === 'starting' || status === 'running'
  const isStopDisabled = status === 'idle' || status === 'stopped'

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🚀 Live Trading Dashboard</h1>
          
          {/* Status and Session Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                <span className="text-lg font-medium">{getStatusText(status)}</span>
              </div>
              {sessionId && (
                <div className="text-sm text-gray-600">
                  Session: <code className="bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
                </div>
              )}
            </div>
            
            <button
              onClick={resetSession}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Reset Session
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div 
              ref={statusRef}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
              role="alert"
              aria-live="polite"
              tabIndex={0}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600 font-medium">Error:</span>
                  <span className="text-red-700">{errorMessage}</span>
                </div>
                <button
                  onClick={() => handleStartTrading()}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Trading Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                value={symbolInput}
                onChange={handleSymbolChange}
                placeholder="AAPL,TSLA,SPY"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isStartDisabled}
              />
            </div>
            
            <button
              onClick={handleStartTrading}
              disabled={isStartDisabled}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isStartDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {status === 'starting' ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Starting...</span>
                </div>
              ) : (
                'Start Trading'
              )}
            </button>
            
            <button
              onClick={handleStopTrading}
              disabled={isStopDisabled}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isStopDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Stop Trading
            </button>
          </div>
        </div>

        {/* Market Chart Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Market Chart</h2>
          
          {symbols.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Select symbols and start trading to see market data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {symbols.map(symbol => {
                const symbolTicks = ticks[symbol] || []
                const hasData = symbolTicks.length > 0
                
                return (
                  <div key={symbol} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{symbol}</h3>
                      {hasData && (
                        <div className="text-sm text-gray-600">
                          Latest: ${symbolTicks[symbolTicks.length - 1]?.p?.toFixed(2) || 'N/A'}
                        </div>
                      )}
                    </div>
                    
                    {hasData ? (
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={symbolTicks}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="t" 
                              tickFormatter={(value) => formatTime(value)}
                              type="number"
                              domain={['dataMin', 'dataMax']}
                            />
                            <YAxis 
                              domain={['dataMin - 1', 'dataMax + 1']}
                              tickFormatter={(value) => `$${value.toFixed(2)}`}
                            />
                            <Tooltip 
                              labelFormatter={(value) => formatTime(value)}
                              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="p" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-gray-400">
                        <p>Waiting for market data...</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Log Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Live Logs</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleAutoScroll}
                className={`px-3 py-1 rounded text-sm ${
                  isLogAutoScroll 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {isLogAutoScroll ? 'Auto-scroll On' : 'Auto-scroll Off'}
              </button>
              <button
                onClick={clearLogs}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div 
            ref={logContainerRef}
            className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm"
          >
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Start trading to see live updates.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-400">[{formatTime(log.t)}]</span>
                  <span className={`ml-2 ${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warn' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="ml-2">{log.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dev Info (Non-production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-800 text-green-400 rounded-xl p-6 font-mono text-sm">
            <h3 className="text-lg font-semibold mb-4 text-white">🔧 Dev Info</h3>
            <div className="space-y-2">
              <div>Session ID: {sessionId || 'None'}</div>
              <div>Status: {status}</div>
              <div>Symbols: {symbols.join(', ') || 'None'}</div>
              <div>WebSocket: {status === 'running' ? 'Connected' : 'Disconnected'}</div>
              <div>Total Ticks: {Object.values(ticks).reduce((sum, symbolTicks) => sum + symbolTicks.length, 0)}</div>
              <div>Total Logs: {logs.length}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TradingDashboard
