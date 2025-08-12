import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Backtest from './pages/Backtest'
import TradeVisualization from './pages/TradeVisualization'
import { WebSocketProvider } from './hooks/useWebSocket'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <WebSocketProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-6 py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/backtest" element={<Backtest />} />
                <Route path="/visualization" element={<TradeVisualization />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </WebSocketProvider>
  )
}

export default App
