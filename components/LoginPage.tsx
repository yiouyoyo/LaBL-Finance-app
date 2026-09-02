'use client'

import { useState } from 'react'
import Image from 'next/image'
import HomePage from './HomePage'

export default function LoginPage() {
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (email.toLowerCase().endsWith('@emory.edu') && password === 'LABL') {
      setAuthed(true)
      setError('')
    } else {
      setError('Use your @emory.edu email and the lab password.')
    }
  }

  if (authed) return <HomePage />

  return (
    <div
      style={{ backgroundColor: '#f5f7fa' }}
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div
          style={{ backgroundColor: '#32317a' }}
          className="rounded-t-xl px-8 py-8 text-center"
        >
          <Image src="/labl-icon.png" alt="LaBL" width={48} height={48} className="w-12 h-12 rounded-full mx-auto mb-4" />
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
                htmlFor="email"
                className="text-sm font-medium"
                style={{ color: '#1a2640' }}
              >
                Emory Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@emory.edu"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{
                  borderColor: '#d0dce8',
                  color: '#1a2640',
                  backgroundColor: '#f5f7fa',
                }}
                autoFocus
              />
            </div>
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
