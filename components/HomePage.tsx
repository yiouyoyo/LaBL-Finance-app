'use client'

import { useState } from 'react'
import ReimbursementFlow from './ReimbursementFlow'
import InvoiceTracker from './InvoiceTracker'
import MoreFormsPage from './MoreFormsPage'
import CorporateCardRecords from './CorporateCardRecords'

type SubmissionType = 'corporate' | 'reimbursement' | null

export default function HomePage() {
  const [submissionType, setSubmissionType] = useState<SubmissionType>(null)
  const [showMoreForms, setShowMoreForms] = useState(false)
  const [reimbursementCount, setReimbursementCount] = useState(0)

  if (submissionType === 'corporate') return <InvoiceTracker onBack={() => setSubmissionType(null)} />
  if (submissionType === 'reimbursement') return <ReimbursementFlow onBack={() => setSubmissionType(null)} onSubmitted={() => setReimbursementCount((count) => count + 1)} />
  if (showMoreForms) return <MoreFormsPage onBack={() => setShowMoreForms(false)} />

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ebeef2' }}>
      <header className="editorial-header px-4 py-7 sm:px-8 sm:py-9">
        <h1 className="text-white text-2xl font-semibold tracking-tight">LaBL Finance Tracker</h1>
        <p style={{ color: '#a8c4e0' }} className="text-sm mt-1">Language Biomarker Lab · Emory University</p>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <CorporateCardRecords />

          <section className="editorial-surface bg-white rounded-xl border p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4a90d9' }}>Step 1 comes first</p>
            <h2 className="text-xl font-semibold mt-1" style={{ color: '#1a2640' }}>Submit Expense</h2>
            <p className="text-sm mt-1 mb-5" style={{ color: '#4a5568' }}>Choose the payment type before continuing.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setSubmissionType('corporate')} className="editorial-choice text-left p-5 rounded-lg border-2 transition-all hover:shadow-md" style={{ borderColor: '#cbd7df', backgroundColor: '#fff' }}>
                <span className="text-2xl">💳</span>
                <h3 className="text-lg font-semibold mt-3" style={{ color: '#1a2640' }}>Corporate Card</h3>
                <p className="text-sm mt-1" style={{ color: '#4a5568' }}>Submit an invoice and upload the original proof file.</p>
              </button>
              <button onClick={() => setSubmissionType('reimbursement')} className="editorial-choice text-left p-5 rounded-lg border-2 transition-all hover:shadow-md" style={{ borderColor: '#cbd7df', backgroundColor: '#fff' }}>
                <span className="text-2xl">💰</span>
                <h3 className="text-lg font-semibold mt-3" style={{ color: '#1a2640' }}>Reimbursement</h3>
                <p className="text-sm mt-1" style={{ color: '#4a5568' }}>Complete the reimbursement form using your own funds.</p>
              </button>
            </div>
          </section>

          <section className="editorial-surface bg-white rounded-xl border p-6 sm:p-8" style={{ borderLeft: '4px solid #efa4a4' }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4a90d9' }}>Separate records</p>
                <h2 className="text-xl font-semibold mt-1" style={{ color: '#1a2640' }}>Reimbursement Submissions</h2>
                <p className="text-sm mt-1" style={{ color: '#4a5568' }}>{reimbursementCount ? `${reimbursementCount} submission completed in this session.` : 'Reimbursement requests are kept separate from corporate card records.'}</p>
              </div>
              <span className="text-sm whitespace-nowrap" style={{ color: '#4a5568' }}>{reimbursementCount} saved</span>
            </div>
          </section>

          <section className="editorial-surface bg-white rounded-xl border p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4a90d9' }}>Reference</p>
            <h2 className="text-xl font-semibold mt-1" style={{ color: '#1a2640' }}>Form Resources</h2>
            <p className="text-sm mt-1 mb-5" style={{ color: '#4a5568' }}>Standard forms and plain-language finance guidance.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setShowMoreForms(true)} className="editorial-choice text-left p-4 rounded-lg border transition-all hover:shadow-sm" style={{ borderColor: '#cbd7df' }}>
                <h3 className="font-semibold" style={{ color: '#1a2640' }}>Travel and other forms</h3>
                <p className="text-sm mt-1" style={{ color: '#4a5568' }}>Open the standard travel expense reference.</p>
              </button>
              <div className="p-4 rounded-lg border" style={{ borderColor: '#cbd7df', backgroundColor: '#dff2f8' }}>
                <h3 className="font-semibold" style={{ color: '#1a2640' }}>Finance rules</h3>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside" style={{ color: '#4a5568' }}>
                  <li>Confirm Research, ProNET, or ProCAN with Dr. Wolff first.</li>
                  <li>Enter every purchase item as a separate line.</li>
                  <li>Upload the physical invoice or online order confirmation.</li>
                  <li>Submit corporate-card invoices within one week.</li>
                  <li>For reimbursement, get Dr. Wolff&apos;s signature and email the signed form to Courtney Farmer.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
