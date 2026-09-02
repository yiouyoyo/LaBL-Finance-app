'use client'

import { useEffect, useState } from 'react'
import { supabase, type Invoice } from '@/lib/supabase'

type MonthGroup = { month: string; records: Invoice[] }

function publicUrl(path: string) {
  return supabase.storage.from('invoices').getPublicUrl(path).data.publicUrl
}

function groupedByYear(records: Invoice[]) {
  const years = new Map<string, Map<string, Invoice[]>>()
  records.forEach((record) => {
    const sourceDate = record.date_purchased || record.submission_date || record.created_at
    const date = new Date(sourceDate)
    const year = Number.isNaN(date.getTime()) ? 'Undated' : String(date.getFullYear())
    const month = Number.isNaN(date.getTime()) ? 'Undated' : date.toLocaleString('en-US', { month: 'long' })
    if (!years.has(year)) years.set(year, new Map())
    const months = years.get(year)!
    if (!months.has(month)) months.set(month, [])
    months.get(month)!.push(record)
  })

  return [...years.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([year, months]) => ({
      year,
      months: [...months.entries()].sort(([left], [right]) => right.localeCompare(left)).map(([month, records]) => ({ month, records })),
    }))
}

export default function CorporateCardRecords() {
  const [records, setRecords] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRecords = async () => {
      const { data, error: loadError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
      if (loadError) setError(loadError.message)
      else setRecords((data || []) as Invoice[])
      setLoading(false)
    }

    loadRecords()
    const channel = supabase
      .channel('corporate-card-records')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, loadRecords)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const grouped = groupedByYear(records)

  return (
    <section className="editorial-surface bg-white rounded-xl border p-5 sm:p-6" style={{ borderColor: '#cbd7df' }}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4a90d9' }}>Browse only</p>
          <h2 className="text-xl font-semibold mt-1" style={{ color: '#1a2640' }}>Corporate Card Expense Record</h2>
          <p className="text-sm mt-1" style={{ color: '#4a5568' }}>Past submissions are organized by year and month. Open a file to download the original upload.</p>
        </div>
        <span className="text-sm whitespace-nowrap" style={{ color: '#4a5568' }}>{records.length} record{records.length === 1 ? '' : 's'}</span>
      </div>

      {loading && <p className="text-sm py-4" style={{ color: '#4a5568' }}>Loading records...</p>}
      {error && <p className="text-sm py-4" style={{ color: '#991b1b' }}>Unable to load records: {error}</p>}
      {!loading && !error && grouped.length === 0 && <p className="text-sm py-4" style={{ color: '#4a5568' }}>No corporate card records yet.</p>}

      <div className="space-y-2">
        {grouped.map(({ year, months }) => (
          <details key={year} className="border rounded-lg" style={{ borderColor: '#d0dce8' }}>
            <summary className="cursor-pointer px-4 py-3 font-semibold" style={{ color: '#1a2640' }}>{year}</summary>
            <div className="px-3 pb-3 space-y-2">
              {months.map(({ month, records: monthRecords }: MonthGroup) => (
                <details key={month} className="rounded-lg" style={{ backgroundColor: '#f5f7fa' }}>
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium" style={{ color: '#1a2640' }}>{month} ({monthRecords.length})</summary>
                  <div className="px-3 pb-3 space-y-2">
                    {monthRecords.map((record) => (
                      <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg border px-3 py-3" style={{ borderColor: '#d0dce8' }}>
                        <div className="text-sm" style={{ color: '#1a2640' }}>
                          <p className="font-medium">{record.item_purchased || 'Untitled expense'}</p>
                          <p className="text-xs mt-1" style={{ color: '#4a5568' }}>{record.who_purchased || 'Submitter not listed'} · {record.date_purchased || 'Date not listed'}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span style={{ color: '#1a2640' }}>{record.amount == null ? 'Amount not listed' : `$${record.amount.toFixed(2)}`}</span>
                          {record.proof_file_path && (
                            <a href={publicUrl(record.proof_file_path)} download={record.proof_file_name || true} target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: '#1a3a6b' }}>
                              Download {record.proof_file_name || 'file'}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}