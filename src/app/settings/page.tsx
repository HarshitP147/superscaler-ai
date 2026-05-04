'use client'

import { useState } from 'react'
import { AppSettingsPanel } from '@/sections/AppSettingsPanel'
import { CreditsSettingsPanel } from '@/sections/CreditsSettingsPanel'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'app' | 'credits'>('app')

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold mb-8">Settings</h1>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-48 border-r border-base-300 pr-6">
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('app')}
                className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'app'
                    ? 'bg-primary text-primary-content'
                    : 'hover:bg-base-200'
                }`}
              >
                App
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'credits'
                    ? 'bg-primary text-primary-content'
                    : 'hover:bg-base-200'
                }`}
              >
                Credits
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'app' && <AppSettingsPanel />}
            {activeTab === 'credits' && <CreditsSettingsPanel />}
          </div>
        </div>
      </div>
    </main>
  )
}
