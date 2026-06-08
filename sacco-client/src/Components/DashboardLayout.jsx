import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoutIcon from '../assets/icons8-logout-50.png';

export default function DashboardLayout({ tabs, activeTab, onTabChange, 
  activeCycle, children }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isExecutive = ['Chairperson', 'Treasurer', 'Secretary']
    .includes(user?.role)

  const roleColor = {
    Chairperson: 'bg-purple-500',
    Treasurer: 'bg-blue-500',
    Secretary: 'bg-cyan-500',
    Member: 'bg-green-500',
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Sidebar */}
      <aside className={`
       flex flex-col bg-gray-900 text-white transition-all duration-300
       flex-shrink-0
       ${sidebarOpen ? 'w-64' : 'w-16'}
       hidden md:flex
   `}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 
          border-b border-gray-700">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <img 
                src="/Logo.png" 
                alt="Circle of Support" 
                className="w-10 h-10 rounded-full object-cover 
                  ring-2 ring-primary-400" />
              <div>
                <p className="font-bold text-white text-sm leading-tight">
                  Circle of
                </p>
                <p className="font-bold text-green-400 text-sm leading-tight">
                  Support
                </p>
              </div>
            </div>
          ) : (
            <img
              src="/Logo.png"
              alt="CoS"
              className="w-8 h-8 rounded-full object-cover mx-auto"
            />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors 
              cursor-pointer bg-transparent border-none p-1 ml-auto"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* User info */}
        <div className={`px-4 py-4 border-b border-gray-700 
          ${sidebarOpen ? '' : 'flex justify-center'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-9 h-9 rounded-full flex 
              items-center justify-center text-white font-bold text-sm
              ${roleColor[user?.role] || 'bg-gray-500'}`}>
              {user?.fullName?.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-400">{user?.role}</p>
              </div>
            )}
          </div>
        </div>



        {/* Cycle status */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-gray-700">
            {activeCycle ? (
              <div className="bg-green-500/10 border border-green-500/30 
                rounded-lg p-2.5">
                <p className="text-xs text-green-400 font-medium">
                  Active Cycle
                </p>
                <p className="text-xs text-green-300 mt-0.5 truncate">
                  {activeCycle.name}
                </p>
              </div>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 
                rounded-lg p-2.5">
                <p className="text-xs text-amber-400 font-medium">
                  No Active Cycle
                </p>
              </div>
            )}
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={!sidebarOpen ? tab.label : undefined}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-sm 
                font-medium transition-all duration-150 cursor-pointer 
                border-none text-left
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }
                ${!sidebarOpen ? 'justify-center' : ''}
              `}
            >
              <span className="text-base flex-shrink-0">{tab.icon}</span>
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 
              text-sm font-medium text-gray-400 hover:text-red-400 
              hover:bg-red-500/10 rounded-lg transition-all cursor-pointer 
              border-none bg-transparent
              ${!sidebarOpen ? 'justify-center' : ''}`}
          >
          <img 
            src="/icons8-logout-50.png" 
            alt="Logout" 
            className="w-5 h-5 object-contain brightness-0 invert opacity-60" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 
          flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.role} Dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeCycle && (
              <div className="hidden md:flex items-center gap-2 
                bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full 
                  animate-pulse"></span>
                <span className="text-xs font-medium text-green-700">
                  {activeCycle.name}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}