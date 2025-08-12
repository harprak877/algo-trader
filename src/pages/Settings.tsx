import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import toast from 'react-hot-toast'

interface StrategySettings {
  short_sma: number
  long_sma: number
  stop_loss_pct: number
  take_profit_pct: number
  position_size_pct: number
  symbols: string[]
}

interface SettingsData {
  strategy: StrategySettings
  notifications: {
    email_enabled: boolean
    email_address?: string
    telegram_enabled: boolean
    telegram_token?: string
    telegram_chat_id?: string
  }
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [symbolsInput, setSymbolsInput] = useState('')
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StrategySettings>()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/settings')
        const data: SettingsData = response.data
        
        setValue('short_sma', data.strategy.short_sma)
        setValue('long_sma', data.strategy.long_sma)
        setValue('stop_loss_pct', data.strategy.stop_loss_pct)
        setValue('take_profit_pct', data.strategy.take_profit_pct)
        setValue('position_size_pct', data.strategy.position_size_pct)
        setSymbolsInput(data.strategy.symbols.join(', '))
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [setValue])

  const onSubmit = async (data: StrategySettings) => {
    setSaving(true)
    try {
      const symbols = symbolsInput.split(',').map(s => s.trim()).filter(s => s)
      
      await axios.put('/api/settings', {
        ...data,
        symbols
      })
      
      toast.success('Settings updated successfully')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const shortSma = watch('short_sma')
  const longSma = watch('long_sma')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Strategy Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure your trading strategy parameters
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Moving Average Settings */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Moving Average Strategy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short SMA Period
              </label>
              <input
                type="number"
                {...register('short_sma', { 
                  required: 'Short SMA is required',
                  min: { value: 5, message: 'Minimum value is 5' },
                  max: { value: 50, message: 'Maximum value is 50' }
                })}
                className="input"
                min="5"
                max="50"
              />
              {errors.short_sma && (
                <p className="mt-1 text-sm text-red-600">{errors.short_sma.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Long SMA Period
              </label>
              <input
                type="number"
                {...register('long_sma', { 
                  required: 'Long SMA is required',
                  min: { value: 20, message: 'Minimum value is 20' },
                  max: { value: 200, message: 'Maximum value is 200' },
                  validate: value => value > shortSma || 'Long SMA must be greater than Short SMA'
                })}
                className="input"
                min="20"
                max="200"
              />
              {errors.long_sma && (
                <p className="mt-1 text-sm text-red-600">{errors.long_sma.message}</p>
              )}
            </div>
          </div>
          
          {shortSma && longSma && shortSma >= longSma && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Warning: Long SMA should be greater than Short SMA for proper crossover signals.
              </p>
            </div>
          )}
        </div>

        {/* Risk Management */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Risk Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stop Loss (%)
              </label>
              <input
                type="number"
                step="0.1"
                {...register('stop_loss_pct', { 
                  required: 'Stop loss is required',
                  min: { value: 0.5, message: 'Minimum value is 0.5%' },
                  max: { value: 10, message: 'Maximum value is 10%' }
                })}
                className="input"
                min="0.5"
                max="10"
              />
              {errors.stop_loss_pct && (
                <p className="mt-1 text-sm text-red-600">{errors.stop_loss_pct.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Take Profit (%)
              </label>
              <input
                type="number"
                step="0.1"
                {...register('take_profit_pct', { 
                  required: 'Take profit is required',
                  min: { value: 1, message: 'Minimum value is 1%' },
                  max: { value: 20, message: 'Maximum value is 20%' }
                })}
                className="input"
                min="1"
                max="20"
              />
              {errors.take_profit_pct && (
                <p className="mt-1 text-sm text-red-600">{errors.take_profit_pct.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position Size (%)
              </label>
              <input
                type="number"
                step="0.1"
                {...register('position_size_pct', { 
                  required: 'Position size is required',
                  min: { value: 5, message: 'Minimum value is 5%' },
                  max: { value: 50, message: 'Maximum value is 50%' }
                })}
                className="input"
                min="5"
                max="50"
              />
              {errors.position_size_pct && (
                <p className="mt-1 text-sm text-red-600">{errors.position_size_pct.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Trading Symbols */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Trading Symbols</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symbols (comma-separated)
            </label>
            <input
              type="text"
              value={symbolsInput}
              onChange={(e) => setSymbolsInput(e.target.value)}
              placeholder="AAPL, TSLA, SPY, QQQ"
              className="input"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter stock symbols separated by commas (e.g., AAPL, TSLA, SPY)
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings
