import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import toast from 'react-hot-toast'

interface WebSocketMessage {
  type: string
  data: any
}

interface WebSocketContextType {
  connected: boolean
  lastMessage: WebSocketMessage | null
  sendMessage: (message: any) => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)

  useEffect(() => {
    const connectWebSocket = () => {
      // Connect to the API server WebSocket endpoint
      const wsUrl = 'ws://localhost:8000/ws'
      
      const websocket = new WebSocket(wsUrl)

      websocket.onopen = () => {
        console.log('WebSocket connected')
        setConnected(true)
        toast.success('Connected to trading bot')
      }

      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          
          // Handle different message types
          switch (message.type) {
            case 'status_update':
              if (message.data.status === 'error') {
                toast.error(`Bot error: ${message.data.error}`)
              } else {
                toast.success(`Bot status: ${message.data.status}`)
              }
              break
            case 'trade_executed':
              toast.success(`Trade executed: ${message.data.action} ${message.data.symbol}`)
              break
            case 'settings_updated':
              toast.success('Settings updated successfully')
              break
            case 'error':
              toast.error(message.data.error)
              break
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      websocket.onclose = () => {
        console.log('WebSocket disconnected')
        setConnected(false)
        toast.error('Disconnected from trading bot')
        
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('WebSocket connection error')
      }

      setWs(websocket)
    }

    connectWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [])

  const sendMessage = (message: any) => {
    if (ws && connected) {
      ws.send(JSON.stringify(message))
    }
  }

  const value: WebSocketContextType = {
    connected,
    lastMessage,
    sendMessage,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
