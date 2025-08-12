import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface TickData {
  t: number
  p: number
}

export interface LogEntry {
  t: number
  level: 'info' | 'warn' | 'error'
  msg: string
}

export interface TradingSessionState {
  sessionId: string | null
  status: 'idle' | 'starting' | 'running' | 'error' | 'stopped'
  symbols: string[]
  ticks: Record<string, TickData[]>
  logs: LogEntry[]
  isLogAutoScroll: boolean
  errorMessage: string | null
  socket: WebSocket | null
  
  // Actions
  startTrading: (symbols: string[]) => Promise<void>
  stopTrading: () => Promise<void>
  appendTick: (symbol: string, point: TickData) => void
  appendLog: (entry: LogEntry) => void
  setStatus: (status: TradingSessionState['status']) => void
  setError: (message: string | null) => void
  clearLogs: () => void
  toggleAutoScroll: () => void
  setSymbols: (symbols: string[]) => void
  resetSession: () => void
}

const MAX_TICKS_PER_SYMBOL = 1000
const MAX_LOGS = 500

export const useSessionStore = create<TradingSessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sessionId: null,
      status: 'idle',
      symbols: [],
      ticks: {},
      logs: [],
      isLogAutoScroll: true,
      errorMessage: null,
      socket: null,

      // Actions
      startTrading: async (symbols: string[]) => {
        const state = get()
        
        if (symbols.length === 0) {
          set({ 
            errorMessage: 'Please select at least one symbol to trade',
            status: 'error'
          })
          return
        }

        try {
          console.log('🚀 Starting trading session with symbols:', symbols)
          
          // Set starting state
          set({ 
            status: 'starting',
            errorMessage: null,
            symbols
          })

          // Call backend to start trading
          const response = await fetch('/api/trading/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols })
          })

          if (!response.ok) {
            throw new Error(`Failed to start trading: ${response.statusText}`)
          }

          const { sessionId } = await response.json()
          console.log('✅ Trading session started with ID:', sessionId)

          // Initialize ticks for each symbol
          const initialTicks: Record<string, TickData[]> = {}
          symbols.forEach(symbol => {
            initialTicks[symbol] = []
          })

          // Connect to WebSocket stream
          const wsUrl = `ws://localhost:8000/ws/trading/stream?sessionId=${sessionId}`
          const socket = new WebSocket(wsUrl)

          socket.onopen = () => {
            console.log('🔌 WebSocket connected for session:', sessionId)
            set({ 
              sessionId,
              status: 'running',
              ticks: initialTicks,
              socket
            })
            get().appendLog({
              t: Date.now(),
              level: 'info',
              msg: `Trading session ${sessionId} started successfully`
            })
          }

          socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data)
              console.log('📨 WebSocket message received:', data)
              
              switch (data.type) {
                case 'tick':
                  get().appendTick(data.symbol, { t: data.t, p: data.p })
                  break
                case 'log':
                  get().appendLog({
                    t: data.t || Date.now(),
                    level: data.level || 'info',
                    msg: data.msg
                  })
                  break
                case 'status':
                  get().setStatus(data.value)
                  break
                case 'error':
                  get().setError(data.message)
                  get().setStatus('error')
                  break
                default:
                  console.warn('Unknown message type:', data.type)
              }
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error)
              get().appendLog({
                t: Date.now(),
                level: 'error',
                msg: `Failed to parse message: ${error}`
              })
            }
          }

          socket.onerror = (error) => {
            console.error('❌ WebSocket error:', error)
            get().setError('WebSocket connection failed')
            get().setStatus('error')
          }

          socket.onclose = (event) => {
            console.log('🔌 WebSocket closed:', event.code, event.reason)
            if (get().status === 'running') {
              get().setError('WebSocket connection lost')
              get().setStatus('error')
            }
            set({ socket: null })
          }

        } catch (error) {
          console.error('❌ Failed to start trading:', error)
          set({ 
            errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
          })
        }
      },

      stopTrading: async () => {
        const state = get()
        
        if (!state.sessionId || state.status === 'idle') {
          return
        }

        try {
          console.log('🛑 Stopping trading session:', state.sessionId)
          
          // Close WebSocket connection
          if (state.socket) {
            state.socket.close()
            set({ socket: null })
          }

          // Call backend to stop trading
          const response = await fetch('/api/trading/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: state.sessionId })
          })

          if (!response.ok) {
            console.warn('Warning: Failed to stop trading on backend')
          }

          set({ 
            status: 'stopped',
            errorMessage: null
          })

          get().appendLog({
            t: Date.now(),
            level: 'info',
            msg: `Trading session ${state.sessionId} stopped`
          })

        } catch (error) {
          console.error('❌ Failed to stop trading:', error)
          set({ 
            errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
            status: 'error'
          })
        }
      },

      appendTick: (symbol: string, point: TickData) => {
        set(state => {
          const currentTicks = state.ticks[symbol] || []
          const newTicks = [...currentTicks, point]
          
          // Keep only the latest MAX_TICKS_PER_SYMBOL ticks
          const trimmedTicks = newTicks.slice(-MAX_TICKS_PER_SYMBOL)
          
          return {
            ticks: {
              ...state.ticks,
              [symbol]: trimmedTicks
            }
          }
        })
      },

      appendLog: (entry: LogEntry) => {
        set(state => {
          const newLogs = [...state.logs, entry]
          // Keep only the latest MAX_LOGS entries
          const trimmedLogs = newLogs.slice(-MAX_LOGS)
          
          return { logs: trimmedLogs }
        })
      },

      setStatus: (status: TradingSessionState['status']) => {
        set({ status })
        console.log('📊 Session status changed to:', status)
      },

      setError: (message: string | null) => {
        set({ errorMessage: message })
        if (message) {
          console.error('❌ Session error:', message)
        }
      },

      clearLogs: () => {
        set({ logs: [] })
        console.log('🧹 Logs cleared')
      },

      toggleAutoScroll: () => {
        set(state => ({ isLogAutoScroll: !state.isLogAutoScroll }))
      },

      setSymbols: (symbols: string[]) => {
        set({ symbols })
      },

      resetSession: () => {
        const state = get()
        if (state.socket) {
          state.socket.close()
        }
        set({
          sessionId: null,
          status: 'idle',
          symbols: [],
          ticks: {},
          logs: [],
          errorMessage: null,
          socket: null
        })
        console.log('🔄 Session reset')
      }
    }),
    {
      name: 'trading-session-store'
    }
  )
)
