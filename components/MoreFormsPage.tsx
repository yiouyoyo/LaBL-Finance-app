'use client'

import { useState } from 'react'
import Image from 'next/image'

type FormType = 'travel' | null

export default function MoreFormsPage({ onBack }: { onBack: () => void }) {
  const [selectedForm, setSelectedForm] = useState<FormType>(null)

  if (selectedForm === 'travel') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f7fa' }}>
        <header style={{ backgroundColor: '#32317a' }} className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Image src="/labl-icon.png" alt="LaBL" width={36} height={36} className="w-9 h-9 rounded-full" />
                <h1 className="text-white text-xl font-semibold tracking-tight">Travel Expense Report</h1>
              </div>
              <p style={{ color: '#a8c4e0' }} className="text-xs mt-0.5">Emory University · Department of Psychology</p>
            </div>
            <button
              onClick={() => setSelectedForm(null)}
              className="ml-4 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#1a3a6b', color: '#fff' }}
            >
              ← Back
            </button>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 sm:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: '#d0dce8' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a2640' }}>
                Travel Expense Report Form
              </h2>

              <p className="text-sm mb-4" style={{ color: '#4a5568' }}>
                The Travel Expense Report form is used to document and request reimbursement for business travel expenses including:
              </p>

              <ul className="list-disc list-inside space-y-2 text-sm mb-6" style={{ color: '#4a5568' }}>
                <li>Registration fees</li>
                <li>Airfare and transportation</li>
                <li>Lodging accommodations</li>
                <li>Meals (food and alcohol, if applicable)</li>
                <li>Taxi/Parking expenses</li>
                <li>Mileage and rental car expenses</li>
                <li>Other business-related travel costs</li>
              </ul>

              <div
                className="p-4 rounded-lg mb-6"
                style={{ backgroundColor: '#e8f4f8', borderLeft: '4px solid #0288d1', color: '#01579b' }}
              >
                <p className="text-sm">
                  <strong>Note:</strong> Expenses should be marked as Prepaid, VISA (Emory Corporate card), or Traveler (Personal Funds). Include supporting documentation (receipts, invoices, MapQuest printouts for mileage) with your submission.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium" style={{ color: '#1a2640' }}>
                  How to submit a travel expense report:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: '#4a5568' }}>
                  <li>Complete the Travel Expense Report form with all required information</li>
                  <li>Attach all receipts and supporting documentation</li>
                  <li>Obtain your supervisor&apos;s or PI&apos;s signature</li>
                  <li>Submit the completed form to the department finance office</li>
                  <li>Allow 2-3 weeks for processing and reimbursement</li>
                </ol>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <a
                href="https://drive.google.com/drive/folders/your-travel-form-link"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-lg border-2 text-center transition-all"
                style={{ borderColor: '#d0dce8', backgroundColor: '#fff' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4a90d9')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d0dce8')}
              >
                <div className="text-2xl mb-2">📥</div>
                <p className="text-sm font-medium" style={{ color: '#1a3a6b' }}>
                  Download Form
                </p>
                <p className="text-xs mt-1" style={{ color: '#4a5568' }}>
                  Get the Travel Expense Report template
                </p>
              </a>

              <button
                onClick={() => alert('Digital travel form submission coming soon')}
                className="block p-4 rounded-lg border-2 text-center transition-all"
                style={{ borderColor: '#d0dce8', backgroundColor: '#fff' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4a90d9')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d0dce8')}
              >
                <div className="text-2xl mb-2">✍️</div>
                <p className="text-sm font-medium" style={{ color: '#1a3a6b' }}>
                  Submit Online
                </p>
                <p className="text-xs mt-1" style={{ color: '#4a5568' }}>
                  Coming soon
                </p>
              </button>
            </div>

            <button
              onClick={() => setSelectedForm(null)}
              className="w-full px-6 py-3 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#1a3a6b' }}
            >
              ← Back to Forms
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f7fa' }}>
      <header style={{ backgroundColor: '#32317a' }} className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Image src="/labl-icon.png" alt="LaBL" width={36} height={36} className="w-9 h-9 rounded-full" />
              <h1 className="text-white text-xl font-semibold tracking-tight">Additional Expense Forms</h1>
            </div>
            <p style={{ color: '#a8c4e0' }} className="text-xs mt-0.5">Language Biomarker Lab · Emory University</p>
          </div>
          <button
            onClick={onBack}
            className="ml-4 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#1a3a6b', color: '#fff' }}
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1a2640' }}>
            Less Frequently Used Expense Forms
          </h2>
          <p className="text-sm mb-8" style={{ color: '#4a5568' }}>
            Access additional forms for specialized expense types
          </p>

          {/* Travel Expense Report */}
          <button
            onClick={() => setSelectedForm('travel')}
            className="w-full text-left p-6 rounded-xl border-2 transition-all hover:shadow-md mb-4"
            style={{ borderColor: '#d0dce8', backgroundColor: '#fff' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#4a90d9')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d0dce8')}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: '#e8f1f8' }}
            >
              <span className="text-xl">✈️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a2640' }}>
              Travel Expense Report
            </h3>
            <p className="text-sm" style={{ color: '#4a5568' }}>
              For business travel including flights, lodging, meals, ground transportation, and registration fees. Used less frequently than regular expense submissions.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#e8f1f8', color: '#1a3a6b' }}>
                Emory Travel Form
              </span>
            </div>
          </button>

          {/* Future forms placeholder */}
          <div
            className="w-full text-left p-6 rounded-xl border-2 opacity-50"
            style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ backgroundColor: '#e0e0e0' }}
            >
              <span className="text-xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#999' }}>
              Other Specialized Forms
            </h3>
            <p className="text-sm" style={{ color: '#999' }}>
              Additional expense forms will be added as needed. Contact the department finance office for assistance.
            </p>
          </div>

          <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: '#e8f4f8', borderLeft: '4px solid #0288d1', color: '#01579b' }}>
            <p className="text-sm">
              <strong>Questions?</strong> Contact the LaBL Finance team for assistance with any expense submission or form.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
