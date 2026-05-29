'use client'

import { useState } from 'react'
import InvoiceTracker from './InvoiceTracker'

export default function LoginPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === 'LABL') {
      setAuthed(true)
      setError('')
    } else {
      setError('Incorrect password. Please try again.')
    }
  }

  if (authed) return <InvoiceTracker />

  return (
    <div
      style={{ backgroundColor: '#f5f7fa' }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div
          style={{ backgroundColor: '#0f2044' }}
          className="rounded-t-xl px-8 py-8 text-center"
        >
          <h1 className="text-white text-2xl font-semibold tracking-tight leading-tight">
            LaBL Finance Tracker
          </h1>
          <p style={{ color: '#a8c4e0' }} className="text-sm mt-1">
            Language Biomarker Lab · Emory University
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-b-xl px-8 py-8 border border-t-0" style={{ borderColor: '#d0dce8' }}>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: '#1a2640' }}
              >
                Lab Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  borderColor: '#d0dce8',
                  color: '#1a2640',
                  backgroundColor: '#f5f7fa',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: '#c0392b' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1a3a6b' }}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
