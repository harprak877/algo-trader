import React from 'react'
import { format } from 'date-fns'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

interface Trade {
  timestamp: string
  symbol: string
  action: string
  price: number
  quantity: number
  reason: string
  pnl?: number
}

interface TradeFeedProps {
  trades: Trade[]
}

const TradeFeed: React.FC<TradeFeedProps> = ({ trades }) => {
  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent trades</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {trades.slice(0, 10).map((trade, index) => {
        const isBuy = trade.action === 'BUY'
        const hasPnl = trade.pnl !== undefined && trade.pnl !== null && String(trade.pnl).trim() !== '' && !isNaN(Number(trade.pnl))
        const pnlPositive = hasPnl && Number(trade.pnl) >= 0

        return (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isBuy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isBuy ? (
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-3 w-3 mr-1" />
                  )}
                  {trade.action}
                </div>
                <span className="ml-3 font-medium text-gray-900">
                  {trade.symbol}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  {format(new Date(trade.timestamp), 'HH:mm:ss')}
                </div>
                {hasPnl && (
                  <div className={`text-sm font-medium ${
                    pnlPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${Number(trade.pnl).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <span className="text-xs text-gray-500">Price:</span>
                <span className="ml-2 text-sm font-medium">
                  ${Number(trade.price).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Quantity:</span>
                <span className="ml-2 text-sm font-medium">
                  {Number(trade.quantity).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
              {trade.reason}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TradeFeed
