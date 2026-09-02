'use client'

import { useState, useRef } from 'react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface ReimbursementFormData {
  personName: string
  employeeId: string
  accountName: string
  speedtypes: string
  amount: string
  businessPurpose: string
  mealAttendees: string[]
  expenseType: 'personal' | 'corporate'
  receipts: File[]
  employeeSignature: string
  supervisorSignature: string
  supervisorName: string
}

interface Step {
  id: number
  title: string
  description: string
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1]
  const binary = window.atob(base64)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return window.btoa(binary)
}

async function createReimbursementPdf(formData: ReimbursementFormData) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([612, 792])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.08, 0.1, 0.16)
  const gray = rgb(0.35, 0.38, 0.43)
  let y = 752

  const text = (value: string, x: number, size = 10, font = regular, color = ink) => {
    page.drawText(value, { x, y, size, font, color })
  }

  const wrapped = (value: string, x: number, width: number, size = 10) => {
    const words = value.split(/\s+/)
    let line = ''
    const lines: string[] = []
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (regular.widthOfTextAtSize(candidate, size) > width && line) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    if (line) lines.push(line)
    lines.forEach((line) => {
      text(line, x, size)
      y -= size + 4
    })
  }

  text('PSYCHOLOGY REIMBURSEMENT FORM', 150, 16, bold)
  y -= 24
  text('PERSONAL FUNDS/CASH', 70, 10, formData.expenseType === 'personal' ? bold : regular)
  text('CORPORATE-CARD CHARGE', 365, 10, formData.expenseType === 'corporate' ? bold : regular)
  y -= 26

  const field = (label: string, value: string) => {
    text(`${label}:`, 55, 10, bold)
    text(value || 'Not provided', 190, 10)
    y -= 23
  }

  field('Person Requesting Reimbursement', formData.personName)
  field('Employee ID', formData.employeeId)
  field('Account Name', formData.accountName)
  field('Speedtype(s)', formData.speedtypes)
  field('Amount', `$${Number.parseFloat(formData.amount || '0').toFixed(2)}`)
  y -= 8
  text('Detailed Business Purpose:', 55, 10, bold)
  y -= 17
  wrapped(formData.businessPurpose || 'Not provided', 55, 500)
  y -= 8
  text('Meal Attendees', 55, 10, bold)
  y -= 17
  wrapped(formData.mealAttendees.filter(Boolean).join('; ') || 'None listed', 55, 500)
  y -= 16
  text('Employee Signature:', 55, 10, bold)
  if (formData.employeeSignature) {
    page.drawImage(await pdf.embedPng(dataUrlToBytes(formData.employeeSignature)), { x: 190, y: y - 12, width: 150, height: 50 })
  }
  y -= 65
  text(`Faculty Supervisor or PI: ${formData.supervisorName || 'Not provided'}`, 55, 10, bold)
  y -= 16
  text('Supervisor Signature:', 55, 10, bold)
  if (formData.supervisorSignature) {
    page.drawImage(await pdf.embedPng(dataUrlToBytes(formData.supervisorSignature)), { x: 190, y: y - 12, width: 150, height: 50 })
  }
  y -= 70
  page.drawLine({ start: { x: 55, y }, end: { x: 557, y }, thickness: 1, color: gray })
  y -= 18
  wrapped('Attach receipts to this form with tape. Meal receipts must have both itemized and payment receipts. All receipts must show purchaser name, date, payment method, and vendor name.', 55, 500, 8)

  return pdf.save()
}

const STEPS: Step[] = [
  { id: 1, title: 'Expense Details', description: 'Personal information and expense basics' },
  { id: 2, title: 'Business Purpose', description: 'What was this expense for?' },
  { id: 3, title: 'Meal Attendees', description: 'Who was present (if applicable)' },
  { id: 4, title: 'Receipts', description: 'Upload proof of purchase' },
  { id: 5, title: 'Signatures', description: 'Sign and request supervisor signature' },
  { id: 6, title: 'Review & Submit', description: 'Check everything and submit' },
]

export default function ReimbursementFlow({ onBack, onSubmitted }: { onBack: () => void; onSubmitted?: () => void }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ReimbursementFormData>({
    personName: '',
    employeeId: '',
    accountName: '',
    speedtypes: '',
    amount: '',
    businessPurpose: '',
    mealAttendees: Array(9).fill(''),
    expenseType: 'personal',
    receipts: [],
    employeeSignature: '',
    supervisorSignature: '',
    supervisorName: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [pdfBase64, setPdfBase64] = useState('')
  const [emailStatus, setEmailStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const supervisorCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDrawingSupervisor, setIsDrawingSupervisor] = useState(false)

  const handleInputChange = (field: keyof ReimbursementFormData, value: string | 'personal' | 'corporate') => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAttendeeChange = (index: number, value: string) => {
    const newAttendees = [...formData.mealAttendees]
    newAttendees[index] = value
    setFormData((prev) => ({
      ...prev,
      mealAttendees: newAttendees,
    }))
  }

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const newReceipts = Array.from(files)
      setFormData((prev) => ({
        ...prev,
        receipts: [...prev.receipts, ...newReceipts],
      }))
    }
  }

  const removeReceipt = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      receipts: prev.receipts.filter((_, i) => i !== index),
    }))
  }

  const startSignature = (isSupervisor: boolean = false) => {
    const canvas = isSupervisor ? supervisorCanvasRef.current : canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#1a2640'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    if (isSupervisor) {
      setIsDrawingSupervisor(true)
    } else {
      setIsDrawing(true)
    }
  }

  const handleSignatureMouseDown = (e: React.MouseEvent, isSupervisor: boolean = false) => {
    if (!isDrawing && !isDrawingSupervisor) return
    const canvas = isSupervisor ? supervisorCanvasRef.current : canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleSignatureMouseMove = (e: React.MouseEvent, isSupervisor: boolean = false) => {
    if ((!isDrawing && !isDrawingSupervisor) || !canvasRef.current) return
    const canvas = isSupervisor ? supervisorCanvasRef.current : canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const handleSignatureMouseUp = (isSupervisor: boolean = false) => {
    if (isSupervisor) {
      setIsDrawingSupervisor(false)
    } else {
      setIsDrawing(false)
    }
  }

  const clearSignature = (isSupervisor: boolean = false) => {
    const canvas = isSupervisor ? supervisorCanvasRef.current : canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    if (isSupervisor) {
      setFormData((prev) => ({ ...prev, supervisorSignature: '' }))
      setIsDrawingSupervisor(false)
    } else {
      setFormData((prev) => ({ ...prev, employeeSignature: '' }))
      setIsDrawing(false)
    }
  }

  const captureSignature = (isSupervisor: boolean = false) => {
    const canvas = isSupervisor ? supervisorCanvasRef.current : canvasRef.current
    if (!canvas) return
    const signature = canvas.toDataURL()
    if (isSupervisor) {
      setFormData((prev) => ({ ...prev, supervisorSignature: signature }))
      setIsDrawingSupervisor(false)
    } else {
      setFormData((prev) => ({ ...prev, employeeSignature: signature }))
      setIsDrawing(false)
    }
  }

  const handleSubmit = async () => {
    const pdfBytes = await createReimbursementPdf(formData)
    setPdfBase64(bytesToBase64(pdfBytes))
    setSubmitted(true)
    onSubmitted?.()
  }

  const downloadPdf = () => {
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${pdfBase64}`
    link.download = 'psychology-reimbursement-form.pdf'
    link.click()
  }

  const previewPdf = async () => {
    const pdfBytes = await createReimbursementPdf(formData)
    const pdfBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer
    const blobUrl = URL.createObjectURL(new Blob([pdfBuffer], { type: 'application/pdf' }))
    window.open(blobUrl, '_blank', 'noopener,noreferrer')
  }

  const emailPdf = async () => {
    setEmailStatus('Sending...')
    const receipts = await Promise.all(formData.receipts.map(async (receipt) => ({
      filename: receipt.name,
      content: bytesToBase64(new Uint8Array(await receipt.arrayBuffer())),
    })))
    const response = await fetch('/api/email-reimbursement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64, requesterName: formData.personName, receipts }),
    })
    const result = await response.json()
    setEmailStatus(response.ok ? 'Emailed to pwolff@emory.edu' : result.error)
  }

  const isStepComplete = (step: number): boolean => {
    return step >= 1 && step <= STEPS.length
  }

  const canProceed = isStepComplete(currentStep)

  if (submitted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f5f7fa' }}>
        <header style={{ backgroundColor: '#0f2044' }} className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-white text-xl font-semibold tracking-tight">Reimbursement Request</h1>
              <p style={{ color: '#a8c4e0' }} className="text-xs mt-0.5">Psychology Reimbursement Form</p>
            </div>
            <button
              onClick={onBack}
              className="ml-4 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#1a3a6b', color: '#fff' }}
            >
              ← Back Home
            </button>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 sm:py-12">
          <div className="max-w-2xl mx-auto">
            <div
              className="p-8 rounded-xl border-2 text-center"
              style={{ borderColor: '#4a90d9', backgroundColor: '#e8f1f8' }}
            >
              <div className="text-4xl mb-4">✓</div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: '#1a2640' }}>
                Reimbursement Request Submitted
              </h2>
              <p style={{ color: '#4a5568' }} className="mb-6">
                Your reimbursement request has been submitted successfully. Your supervisor has been notified and will review your request.
              </p>
              <button
                onClick={downloadPdf}
                className="px-6 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1a3a6b' }}
              >
                Download PDF
              </button>
              <button
                onClick={emailPdf}
                className="px-6 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#27ae60' }}
              >
                Email to Dr. Wolff
              </button>
              <button
                onClick={onBack}
                className="px-6 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#1a3a6b' }}
              >
                Return to Home
              </button>
              {emailStatus && <p className="mt-4 text-sm" style={{ color: emailStatus.startsWith('Emailed') ? '#27ae60' : '#c0392b' }}>{emailStatus}</p>}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f7fa' }}>
      <header style={{ backgroundColor: '#0f2044' }} className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-white text-xl font-semibold tracking-tight">Reimbursement Request</h1>
            <p style={{ color: '#a8c4e0' }} className="text-xs mt-0.5">Psychology Reimbursement Form</p>
          </div>
          <button
            onClick={onBack}
            className="ml-4 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#1a3a6b', color: '#fff' }}
          >
            ← Cancel
          </button>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 ${step.id < STEPS.length ? 'mr-2' : ''}`}
                >
                  <button
                    onClick={() => isStepComplete(currentStep) && setCurrentStep(step.id)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: step.id <= currentStep ? '#1a3a6b' : '#d0dce8',
                      color: step.id <= currentStep ? '#fff' : '#4a5568',
                      opacity: isStepComplete(step.id - 1) || step.id === 1 ? 1 : 0.5,
                      cursor: isStepComplete(step.id - 1) || step.id === 1 ? 'pointer' : 'default',
                    }}
                    disabled={!isStepComplete(step.id - 1) && step.id !== 1}
                  >
                    {step.id}. {step.title}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: '#4a5568' }}>
              {STEPS[currentStep - 1].description}
            </p>
          </div>

          {/* Form content */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#d0dce8' }}>
            {/* Step 1: Expense Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a2640' }}>
                  Personal Information & Expense Basics
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1a2640' }}>
                    Person Requesting Reimbursement
                  </label>
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) => handleInputChange('personName', e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}
                    onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                    onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1a2640' }}>
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={formData.employeeId}
                      onChange={(e) => handleInputChange('employeeId', e.target.value)}
                      placeholder="e.g., E12345"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}
                      onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                      onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#1a2640' }}>
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="$0.00"
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}
                      onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                      onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1a2640' }}>
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => handleInputChange('accountName', e.target.value)}
                    placeholder="e.g., Psychology Lab"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}
                    onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                    onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#1a2640' }}>
                    Speedtype(s)
                  </label>
                  <input
                    type="text"
                    value={formData.speedtypes}
                    onChange={(e) => handleInputChange('speedtypes', e.target.value)}
                    placeholder="e.g., 12345.6789"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}
                    onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                    onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a2640' }}>
                    Expense Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.expenseType === 'personal'}
                        onChange={() => handleInputChange('expenseType', 'personal')}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: '#1a2640' }}>Personal Funds/Cash</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.expenseType === 'corporate'}
                        onChange={() => handleInputChange('expenseType', 'corporate')}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm" style={{ color: '#1a2640' }}>Corporate Card Charge</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Purpose */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a2640' }}>
                  Detailed Business Purpose
                </h3>
                <p className="text-sm mb-3" style={{ color: '#4a5568' }}>
                  Name of meeting/class, discussion topic, etc.
                </p>
                <textarea
                  value={formData.businessPurpose}
                  onChange={(e) => handleInputChange('businessPurpose', e.target.value)}
                  placeholder="Describe the business purpose of this expense..."
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}
                  onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                  onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}
                />
              </div>
            )}

            {/* Step 3: Meal Attendees */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a2640' }}>
                  Meal Attendees
                </h3>
                <p className="text-sm mb-4" style={{ color: '#4a5568' }}>
                  List names and titles if under 10 (i.e., faculty, guest, student, etc.)
                </p>
                <div className="space-y-2">
                  {formData.mealAttendees.map((attendee, index) => (
                    <input
                      key={index}
                      type="text"
                      value={attendee}
                      onChange={(e) => handleAttendeeChange(index, e.target.value)}
                      placeholder={`Attendee ${index + 1} name and title`}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}
                      onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                      onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Receipts */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a2640' }}>
                  Upload Receipts
                </h3>
                <div
                  className="border-2 border-dashed p-6 rounded-lg text-center cursor-pointer transition-colors"
                  style={{ borderColor: '#d0dce8' }}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e8f1f8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                  />
                  <div className="text-2xl mb-2">📄</div>
                  <p className="text-sm font-medium" style={{ color: '#1a2640' }}>
                    Click to upload receipts
                  </p>
                  <p className="text-xs" style={{ color: '#4a5568' }}>
                    PDF, JPG, PNG or GIF
                  </p>
                </div>

                {formData.receipts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2" style={{ color: '#1a2640' }}>
                      Uploaded Receipts ({formData.receipts.length})
                    </h4>
                    <div className="space-y-2">
                      {formData.receipts.map((receipt, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg"
                          style={{ backgroundColor: '#f5f7fa' }}
                        >
                          <span className="text-sm" style={{ color: '#1a2640' }}>
                            {receipt.name}
                          </span>
                          <button
                            onClick={() => removeReceipt(index)}
                            className="text-xs px-2 py-1 rounded text-white transition-opacity hover:opacity-80"
                            style={{ backgroundColor: '#c0392b' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: '#fef3cd', borderLeft: '4px solid #ffc107', color: '#856404' }}
                >
                  <strong>Important:</strong> Meal receipts must have both itemized & payment receipts. If alcohol is included, please note that total separately. ALL receipts must show: purchaser name, date, payment method, vendor name.
                </div>
              </div>
            )}

            {/* Step 5: Signatures */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a2640' }}>
                  Signatures
                </h3>

                {/* Employee signature */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a2640' }}>
                    Your Signature (Employee)
                  </label>
                  <div
                    className="border-2 p-2 rounded-lg mb-2"
                    style={{ borderColor: '#d0dce8' }}
                  >
                    <canvas
                      ref={canvasRef}
                      width={300}
                      height={100}
                      className="border w-full"
                      style={{
                        borderColor: '#d0dce8',
                        backgroundColor: '#fff',
                        cursor: isDrawing ? 'crosshair' : 'default',
                      }}
                      onMouseDown={(e) => handleSignatureMouseDown(e, false)}
                      onMouseMove={(e) => handleSignatureMouseMove(e, false)}
                      onMouseUp={() => handleSignatureMouseUp(false)}
                      onMouseLeave={() => handleSignatureMouseUp(false)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startSignature(false)}
                      disabled={isDrawing}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: isDrawing ? '#d0dce8' : '#1a3a6b',
                        color: '#fff',
                        opacity: isDrawing ? 0.6 : 1,
                      }}
                    >
                      {isDrawing ? 'Drawing...' : 'Draw Signature'}
                    </button>
                    <button
                      onClick={() => captureSignature(false)}
                      disabled={!isDrawing}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: '#1a3a6b',
                        color: '#fff',
                        opacity: isDrawing ? 1 : 0.5,
                      }}
                    >
                      Done Signing
                    </button>
                    <button
                      onClick={() => clearSignature(false)}
                      className="px-3 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: '#fff',
                        color: '#c0392b',
                        border: '1px solid #c0392b',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  {formData.employeeSignature && (
                    <p className="text-xs mt-2" style={{ color: '#27ae60' }}>
                      ✓ Signature captured
                    </p>
                  )}
                </div>

                {/* Supervisor signature */}
                <div className="border-t pt-6" style={{ borderColor: '#d0dce8' }}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a2640' }}>
                    Supervisor Name
                  </label>
                  <input
                    type="text"
                    value={formData.supervisorName}
                    onChange={(e) => handleInputChange('supervisorName', e.target.value)}
                    placeholder="Faculty Supervisor or PI name"
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none mb-4"
                    style={{ borderColor: '#d0dce8', backgroundColor: '#f5f7fa' }}
                    onFocus={(e) => (e.target.style.borderColor = '#4a90d9')}
                    onBlur={(e) => (e.target.style.borderColor = '#d0dce8')}
                  />

                  <label className="block text-sm font-medium mb-2" style={{ color: '#1a2640' }}>
                    Supervisor Signature
                  </label>
                  <p className="text-xs mb-2" style={{ color: '#4a5568' }}>
                    (Required if student or staff submitting request)
                  </p>
                  <div
                    className="border-2 p-2 rounded-lg mb-2"
                    style={{ borderColor: '#d0dce8' }}
                  >
                    <canvas
                      ref={supervisorCanvasRef}
                      width={300}
                      height={100}
                      className="border w-full"
                      style={{
                        borderColor: '#d0dce8',
                        backgroundColor: '#fff',
                        cursor: isDrawingSupervisor ? 'crosshair' : 'default',
                      }}
                      onMouseDown={(e) => handleSignatureMouseDown(e, true)}
                      onMouseMove={(e) => handleSignatureMouseMove(e, true)}
                      onMouseUp={() => handleSignatureMouseUp(true)}
                      onMouseLeave={() => handleSignatureMouseUp(true)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startSignature(true)}
                      disabled={isDrawingSupervisor}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: isDrawingSupervisor ? '#d0dce8' : '#1a3a6b',
                        color: '#fff',
                        opacity: isDrawingSupervisor ? 0.6 : 1,
                      }}
                    >
                      {isDrawingSupervisor ? 'Drawing...' : 'Draw Signature'}
                    </button>
                    <button
                      onClick={() => captureSignature(true)}
                      disabled={!isDrawingSupervisor}
                      className="px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: '#1a3a6b',
                        color: '#fff',
                        opacity: isDrawingSupervisor ? 1 : 0.5,
                      }}
                    >
                      Done Signing
                    </button>
                    <button
                      onClick={() => clearSignature(true)}
                      className="px-3 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: '#fff',
                        color: '#c0392b',
                        border: '1px solid #c0392b',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  {formData.supervisorSignature && (
                    <p className="text-xs mt-2" style={{ color: '#27ae60' }}>
                      ✓ Signature captured
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Review & Submit */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1a2640' }}>
                  Review Your Submission
                </h3>

                <div className="space-y-4 bg-gray-50 p-4 rounded-lg" style={{ backgroundColor: '#f5f7fa' }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#4a5568' }}>PERSONAL INFORMATION</p>
                    <div className="text-sm mt-2" style={{ color: '#1a2640' }}>
                      <p><strong>{formData.personName}</strong> (ID: {formData.employeeId})</p>
                      <p>Account: {formData.accountName}</p>
                      <p>Speedtype: {formData.speedtypes}</p>
                      <p>Amount: ${parseFloat(formData.amount || '0').toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: '#d0dce8' }}>
                    <p className="text-xs font-medium" style={{ color: '#4a5568' }}>BUSINESS PURPOSE</p>
                    <p className="text-sm mt-2" style={{ color: '#1a2640' }}>
                      {formData.businessPurpose}
                    </p>
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: '#d0dce8' }}>
                    <p className="text-xs font-medium" style={{ color: '#4a5568' }}>ATTENDEES</p>
                    <div className="text-sm mt-2" style={{ color: '#1a2640' }}>
                      {formData.mealAttendees.filter((a) => a).length === 0 ? (
                        <p>No attendees listed</p>
                      ) : (
                        <ul>
                          {formData.mealAttendees
                            .filter((a) => a)
                            .map((attendee, idx) => (
                              <li key={idx}>• {attendee}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: '#d0dce8' }}>
                    <p className="text-xs font-medium" style={{ color: '#4a5568' }}>RECEIPTS</p>
                    <p className="text-sm mt-2" style={{ color: '#1a2640' }}>
                      {formData.receipts.length} file(s) attached
                    </p>
                  </div>

                  <div className="border-t pt-3" style={{ borderColor: '#d0dce8' }}>
                    <p className="text-xs font-medium" style={{ color: '#4a5568' }}>SIGNATURES</p>
                    <p className="text-sm mt-2" style={{ color: '#1a2640' }}>
                      Employee: {formData.employeeSignature ? '✓ Signed' : '✗ Not signed'}
                      <br />
                      Supervisor: {formData.supervisorSignature ? '✓ Signed' : '✗ Not signed'}
                    </p>
                  </div>
                </div>

                <div
                  className="p-4 rounded-lg text-sm"
                  style={{ backgroundColor: '#e8f4f8', borderLeft: '4px solid #0288d1', color: '#01579b' }}
                >
                  <strong>Next Steps:</strong> Your reimbursement request will be sent to your supervisor for review. You will be notified once it has been approved and processed.
                </div>
                <button
                  onClick={previewPdf}
                  className="px-6 py-2 rounded-lg font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#fff', color: '#1a3a6b', border: '1px solid #1a3a6b' }}
                >
                  Preview PDF
                </button>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 rounded-lg font-medium transition-opacity"
              style={{
                backgroundColor: currentStep === 1 ? '#d0dce8' : '#fff',
                color: currentStep === 1 ? '#999' : '#1a2640',
                border: `1px solid ${currentStep === 1 ? '#d0dce8' : '#1a3a6b'}`,
              }}
            >
              ← Back
            </button>

            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="px-6 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: '#fff',
                  color: '#c0392b',
                  border: '1px solid #c0392b',
                }}
              >
                Cancel
              </button>

              {currentStep < STEPS.length ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed}
                  className="px-6 py-2 rounded-lg text-white font-medium transition-opacity"
                  style={{
                    backgroundColor: canProceed ? '#1a3a6b' : '#d0dce8',
                    opacity: canProceed ? 1 : 0.6,
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#27ae60' }}
                >
                  Submit Reimbursement
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
