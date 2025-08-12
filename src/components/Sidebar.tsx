import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  BeakerIcon,
  ChartPieIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useWebSocket } from '../hooks/useWebSocket'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Backtest', href: '/backtest', icon: BeakerIcon },
  { name: 'Visualization', href: '/visualization', icon: ChartPieIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
]

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation()
  const { connected } = useWebSocket()

  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div
          className="fixed inset-0 flex z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent currentPath={location.pathname} connected={connected} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent currentPath={location.pathname} connected={connected} />
      </div>
    </>
  )
}

interface SidebarContentProps {
  currentPath: string
  connected: boolean
}

const SidebarContent: React.FC<SidebarContentProps> = ({ currentPath, connected }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 shadow-xl">
      <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">TB</span>
            </div>
            <h1 className="ml-4 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Trading Bot
            </h1>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="px-6 mt-6">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div
              className={`h-3 w-3 rounded-full mr-3 ${
                connected ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span className={`text-sm font-medium ${
              connected ? 'text-green-700' : 'text-red-700'
            }`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <nav className="mt-8 flex-1 px-3 space-y-2">
          {navigation.map((item) => {
            const isActive = currentPath === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500 text-blue-700 shadow-sm'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                } group flex items-center px-4 py-3 text-sm font-medium border-l-4 transition-all duration-200 rounded-r-lg`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-6 w-6 transition-colors duration-200`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        {/* Social Links */}
        <div className="px-6 mt-auto pb-6">
          <div className="border-t border-gray-200/50 pt-4">
            <div className="text-center mb-3">
              <span className="text-xs text-gray-500 font-medium">Connect with me</span>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <a
                href="https://www.linkedin.com/in/harish-prak"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                title="LinkedIn"
              >
                <svg className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.047-1.852-3.047-1.853 0-2.136 1.445-2.136 2.939v5.677H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="mailto:hp877@bath.ac.uk"
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                title="Email"
              >
                <svg className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
