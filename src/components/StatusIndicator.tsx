import React from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface StatusIndicatorProps {
  status: string
  connected: boolean
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, connected }) => {
  const getStatusInfo = () => {
    if (!connected) {
      return {
        icon: XCircleIcon,
        text: 'Disconnected',
        className: 'status-error',
      }
    }

    switch (status) {
      case 'live_trading':
        return {
          icon: CheckCircleIcon,
          text: 'Live Trading',
          className: 'status-running',
        }
      case 'backtesting':
        return {
          icon: ClockIcon,
          text: 'Backtesting',
          className: 'status-backtesting',
        }
      case 'error':
        return {
          icon: ExclamationCircleIcon,
          text: 'Error',
          className: 'status-error',
        }
      case 'stopped':
      default:
        return {
          icon: ClockIcon,
          text: 'Stopped',
          className: 'status-stopped',
        }
    }
  }

  const { icon: Icon, text, className } = getStatusInfo()

  return (
    <div className="flex items-center">
      <div className={`status-indicator ${className}`}>
        <Icon className="h-4 w-4 mr-1" />
        {text}
      </div>
    </div>
  )
}

export default StatusIndicator
