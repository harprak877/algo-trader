import React from 'react'

const AppSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🚀 Trading Bot Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bot Status</h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-green-700 font-medium">Running</span>
            </div>
          </div>

          {/* Account Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Cash:</span>
                <span className="font-medium">$100,000.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Equity:</span>
                <span className="font-medium">$98,500.00</span>
              </div>
            </div>
          </div>

          {/* Trading Controls */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Trading Controls</h2>
            <div className="space-y-3">
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Start Trading
              </button>
              <button className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                Stop Trading
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recent Trades</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium">AAPL</span>
              <span className="text-green-600">+$150.00</span>
              <span className="text-gray-500">2 min ago</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="font-medium">TSLA</span>
              <span className="text-red-600">-$75.00</span>
              <span className="text-gray-500">5 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppSimple
