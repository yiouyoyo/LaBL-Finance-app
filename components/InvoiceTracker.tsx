'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, type Invoice, ACCOUNT_OPTIONS } from '@/lib/supabase'

type EditableInvoice = Invoice & { _uploading?: boolean; _pending?: boolean }

function makeLocalId() {
  return 'local-' + Math.random().toString(36).slice(2)
}

function makeEmptyRow(): EditableInvoice {
  return {
    id: makeLocalId(),
    date_purchased: null,
    who_purchased: null,
    account: null,
    item_purchased: null,
    amount: null,
    purpose: null,
    proof_file_path: null,
    proof_file_name: null,
    created_at: new Date().toISOString(),
    _pending: true,
  }
}

export default function InvoiceTracker() {
  const [invoices, setInvoices] = useState<EditableInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  useEffect(() => {
    fetchInvoices()

    const channel = supabase
      .channel('invoices-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        fetchInvoices()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      setDbError(error.message)
    } else {
      setDbError(null)
      setInvoices(data as EditableInvoice[])
    }
    setLoading(false)
  }

  async function addRow() {
    // Add optimistic row immediately so UI responds right away
    const optimistic = makeEmptyRow()
    setInvoices((prev) => [...prev, optimistic])

    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        date_purchased: null,
        who_purchased: null,
        account: null,
        item_purchased: null,
        amount: null,
        purpose: null,
        proof_file_path: null,
        proof_file_name: null,
      }])
      .select()
      .single()

    if (error) {
      setDbError(error.message)
      // Remove optimistic row on failure
      setInvoices((prev) => prev.filter((i) => i.id !== optimistic.id))
    } else if (data) {
      setDbError(null)
      // Replace optimistic row with real DB row
      setInvoices((prev) =>
        prev.map((i) => (i.id === optimistic.id ? (data as EditableInvoice) : i))
      )
    }
  }

  async function updateField(id: string, field: keyof Invoice, value: string | number | null) {
    // Skip updates for rows not yet saved to DB
    if (id.startsWith('local-')) return
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, [field]: value } : inv)))
    const { error } = await supabase.from('invoices').update({ [field]: value }).eq('id', id)
    if (error) setDbError(error.message)
  }

  async function deleteRow(id: string) {
    setInvoices((prev) => prev.filter((i) => i.id !== id))
    if (id.startsWith('local-')) return
    const inv = invoices.find((i) => i.id === id)
    if (inv?.proof_file_path) {
      await supabase.storage.from('invoices').remove([inv.proof_file_path])
    }
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) setDbError(error.message)
  }

  async function handleFileUpload(id: string, file: File) {
    if (id.startsWith('local-')) return
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, _uploading: true } : inv)))

    const ext = file.name.split('.').pop()
    const filePath = `${id}/${Date.now()}.${ext}`
    const inv = invoices.find((i) => i.id === id)
    if (inv?.proof_file_path) {
      await supabase.storage.from('invoices').remove([inv.proof_file_path])
    }

    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, file, { upsert: true })

    if (!uploadError) {
      await supabase.from('invoices')
        .update({ proof_file_path: filePath, proof_file_name: file.name })
        .eq('id', id)
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id
            ? { ...inv, proof_file_path: filePath, proof_file_name: file.name, _uploading: false }
            : inv
        )
      )
    } else {
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, _uploading: false } : inv)))
    }
  }

  async function removeFile(id: string) {
    const inv = invoices.find((i) => i.id === id)
    if (inv?.proof_file_path) {
      await supabase.storage.from('invoices').remove([inv.proof_file_path])
    }
    await supabase.from('invoices').update({ proof_file_path: null, proof_file_name: null }).eq('id', id)
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, proof_file_path: null, proof_file_name: null } : inv))
    )
  }

  function getPublicUrl(filePath: string) {
    const { data } = supabase.storage.from('invoices').getPublicUrl(filePath)
    return data.publicUrl
  }

  function isImage(fileName: string | null) {
    if (!fileName) return false
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)
  }

  const total = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const cellStyle = { borderColor: '#d0dce8', color: '#1a2640', backgroundColor: 'transparent', fontSize: '0.8125rem' }
  const inputClass = 'w-full px-2 py-1 rounded border text-xs outline-none bg-transparent transition-colors'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f7fa' }}>
      <header style={{ backgroundColor: '#0f2044' }} className="px-4 py-4 sm:px-6">
        <h1 className="text-white text-xl font-semibold tracking-tight">LaBL Finance Tracker</h1>
        <p style={{ color: '#a8c4e0' }} className="text-xs mt-0.5">Language Biomarker Lab · Emory University</p>
      </header>

      <main className="px-2 py-4 sm:px-4 sm:py-6">
        {/* Database error banner */}
        {dbError && (
          <div className="mb-4 px-4 py-3 rounded-lg border text-sm" style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
            <strong>Database error:</strong> {dbError}
            <br />
            <span className="text-xs mt-1 block">Make sure the <code>invoices</code> table exists in Supabase and RLS policies allow access.</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#1a3a6b', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#d0dce8' }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a3a6b' }}>
                    {['Date', 'Purchased By', 'Account', 'Item', 'Amount ($)', 'Purpose', 'Proof', ''].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr key={inv.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f5f7fa', borderBottom: '1px solid #d0dce8', opacity: inv._pending ? 0.6 : 1 }}>
                      {/* Date */}
                      <td className="px-2 py-1.5" style={{ minWidth: '120px' }}>
                        <input type="date" className={inputClass} style={{ ...cellStyle, borderColor: '#d0dce8' }}
                          value={inv.date_purchased || ''}
                          onChange={(e) => updateField(inv.id, 'date_purchased', e.target.value || null)}
                          onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                          onBlur={(e) => (e.target.style.borderColor = '#d0dce8')} />
                      </td>

                      {/* Who purchased */}
                      <td className="px-2 py-1.5" style={{ minWidth: '130px' }}>
                        <input type="text" className={inputClass} style={{ ...cellStyle, borderColor: '#d0dce8' }}
                          value={inv.who_purchased || ''} placeholder="Name"
                          onChange={(e) => updateField(inv.id, 'who_purchased', e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                          onBlur={(e) => (e.target.style.borderColor = '#d0dce8')} />
                      </td>

                      {/* Account */}
                      <td className="px-2 py-1.5" style={{ minWidth: '160px' }}>
                        <select className={inputClass} style={{ ...cellStyle, borderColor: '#d0dce8' }}
                          value={inv.account || ''}
                          onChange={(e) => updateField(inv.id, 'account', e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                          onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}>
                          <option value="">Select account</option>
                          {ACCOUNT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>

                      {/* Item */}
                      <td className="px-2 py-1.5" style={{ minWidth: '150px' }}>
                        <input type="text" className={inputClass} style={{ ...cellStyle, borderColor: '#d0dce8' }}
                          value={inv.item_purchased || ''} placeholder="Item name"
                          onChange={(e) => updateField(inv.id, 'item_purchased', e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                          onBlur={(e) => (e.target.style.borderColor = '#d0dce8')} />
                      </td>

                      {/* Amount */}
                      <td className="px-2 py-1.5" style={{ minWidth: '100px' }}>
                        <input type="number" step="0.01" min="0" className={inputClass} style={{ ...cellStyle, borderColor: '#d0dce8' }}
                          value={inv.amount ?? ''} placeholder="0.00"
                          onChange={(e) => updateField(inv.id, 'amount', e.target.value ? parseFloat(e.target.value) : null)}
                          onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                          onBlur={(e) => (e.target.style.borderColor = '#d0dce8')} />
                      </td>

                      {/* Purpose */}
                      <td className="px-2 py-1.5" style={{ minWidth: '160px' }}>
                        <input type="text" className={inputClass} style={{ ...cellStyle, borderColor: '#d0dce8' }}
                          value={inv.purpose || ''} placeholder="Purpose"
                          onChange={(e) => updateField(inv.id, 'purpose', e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                          onBlur={(e) => (e.target.style.borderColor = '#d0dce8')} />
                      </td>

                      {/* Proof */}
                      <td className="px-2 py-1.5" style={{ minWidth: '120px' }}>
                        {inv._uploading ? (
                          <span className="text-xs" style={{ color: '#4a90d9' }}>Uploading...</span>
                        ) : inv._pending ? (
                          <span className="text-xs" style={{ color: '#9ca3af' }}>Saving…</span>
                        ) : inv.proof_file_path ? (
                          <div className="flex flex-col gap-1 items-start">
                            {isImage(inv.proof_file_name) ? (
                              <a href={getPublicUrl(inv.proof_file_path)} target="_blank" rel="noopener noreferrer">
                                <img src={getPublicUrl(inv.proof_file_path)} alt="Invoice"
                                  className="rounded border object-cover"
                                  style={{ width: '56px', height: '56px', borderColor: '#d0dce8' }} />
                              </a>
                            ) : (
                              <a href={getPublicUrl(inv.proof_file_path)} target="_blank" rel="noopener noreferrer"
                                className="text-xs font-medium underline" style={{ color: '#1a3a6b' }}>PDF</a>
                            )}
                            <button onClick={() => removeFile(inv.id)} className="text-xs" style={{ color: '#c0392b' }}>Remove</button>
                          </div>
                        ) : (
                          <>
                            <input type="file" accept="image/*,.pdf"
                              ref={(el) => { fileInputRefs.current[inv.id] = el }}
                              className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(inv.id, f) }} />
                            <button onClick={() => fileInputRefs.current[inv.id]?.click()}
                              className="text-xs px-2 py-1 rounded border transition-colors"
                              style={{ borderColor: '#4a90d9', color: '#1a3a6b' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f1fb' }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                              Upload
                            </button>
                          </>
                        )}
                      </td>

                      {/* Delete */}
                      <td className="px-2 py-1.5 text-center" style={{ minWidth: '48px' }}>
                        <button onClick={() => deleteRow(inv.id)} title="Delete row"
                          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                          style={{ color: '#c0392b' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdecea' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: '#4a5568' }}>
                        No invoices yet. Click &quot;Add Row&quot; to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t"
              style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}>
              <button onClick={addRow}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors"
                style={{ borderColor: '#1a3a6b', color: '#1a3a6b' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e8f1fb' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Row
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: '#4a5568' }}>Total:</span>
                <span className="text-base font-bold" style={{ color: '#0f2044' }}>
                  ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
