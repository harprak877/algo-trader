import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { format } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'

interface BacktestForm {
  start_date: string
  end_date: string
  symbols: string
  short_sma: number
  long_sma: number
  stop_loss_pct: number
  take_profit_pct: number
  position_size_pct: number
}

const Backtest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm<BacktestForm>({
    defaultValues: {
      start_date: format(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      symbols: 'AAPL,TSLA,SPY',
      short_sma: 20,
      long_sma: 50,
      stop_loss_pct: 3,
      take_profit_pct: 6,
      position_size_pct: 25
    }
  })

  const onSubmit = async (data: BacktestForm) => {
    setIsRunning(true)
    try {
      const symbols = data.symbols.split(',').map(s => s.trim()).filter(s => s)
      
      await axios.post('/api/backtest', {
        start_date: data.start_date,
        end_date: data.end_date,
        symbols,
        short_sma: data.short_sma,
        long_sma: data.long_sma,
        stop_loss_pct: data.stop_loss_pct,
        take_profit_pct: data.take_profit_pct,
        position_size_pct: data.position_size_pct
      })
      
      toast.success('Backtest started successfully')
      
      // Poll for results
      const pollResults = async () => {
        try {
          const perfResponse = await axios.get('/api/performance')
          setResults(perfResponse.data)
        } catch (error) {
          console.error('Error fetching backtest results:', error)
        }
      }
      
      // Wait a bit then fetch results
      setTimeout(pollResults, 3000)
      
    } catch (error) {
      console.error('Error running backtest:', error)
      toast.error('Failed to run backtest')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Backtesting</h1>
        <p className="mt-1 text-sm text-gray-500">
          Test your strategy on historical data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backtest Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Backtest Parameters</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  {...register('start_date', { required: 'Start date is required' })}
                  className="input"
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  {...register('end_date', { required: 'End date is required' })}
                  className="input"
                />
                {errors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            {/* Symbols */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbols
              </label>
              <input
                type="text"
                {...register('symbols', { required: 'Symbols are required' })}
                placeholder="AAPL,TSLA,SPY"
                className="input"
              />
              {errors.symbols && (
                <p className="mt-1 text-sm text-red-600">{errors.symbols.message}</p>
              )}
            </div>

            {/* Strategy Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short SMA
                </label>
                <input
                  type="number"
                  {...register('short_sma', { 
                    required: 'Short SMA is required',
                    min: 5,
                    max: 50
                  })}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Long SMA
                </label>
                <input
                  type="number"
                  {...register('long_sma', { 
                    required: 'Long SMA is required',
                    min: 20,
                    max: 200
                  })}
                  className="input"
                />
              </div>
            </div>

            {/* Risk Parameters */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stop Loss (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('stop_loss_pct', { required: true, min: 0.5, max: 10 })}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Take Profit (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('take_profit_pct', { required: true, min: 1, max: 20 })}
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Size (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('position_size_pct', { required: true, min: 5, max: 50 })}
                  className="input"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isRunning}
              className="w-full btn-primary"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  Running Backtest...
                </>
              ) : (
                'Run Backtest'
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Backtest Results</h2>
          
          {results ? (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Total Trades</div>
                  <div className="text-lg font-medium">{results.metrics.total_trades || 0}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Win Rate</div>
                  <div className="text-lg font-medium text-green-600">
                    {((results.metrics.win_rate || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Total P&L</div>
                  <div className={`text-lg font-medium ${
                    (results.metrics.total_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${(results.metrics.total_pnl || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Sharpe Ratio</div>
                  <div className="text-lg font-medium">
                    {(results.metrics.sharpe_ratio || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Max Drawdown</div>
                  <div className="text-lg font-medium text-red-600">
                    {((results.metrics.max_drawdown || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Total Return</div>
                  <div className={`text-lg font-medium ${
                    (results.metrics.total_return || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {((results.metrics.total_return || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Run a backtest to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Backtest
