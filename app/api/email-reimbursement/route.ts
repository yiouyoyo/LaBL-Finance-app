import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Email is not configured. Add RESEND_API_KEY to .env.local.' }, { status: 503 })
  }

  const { pdfBase64, requesterName, receipts = [] } = await request.json()
  if (!pdfBase64) {
    return NextResponse.json({ error: 'Missing completed reimbursement PDF.' }, { status: 400 })
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: process.env.REIMBURSEMENT_FROM_EMAIL || 'LaBL Finance <onboarding@resend.dev>',
    to: ['pwolff@emory.edu'],
    subject: `Reimbursement request from ${requesterName || 'Lab member'}`,
    text: 'A completed Psychology Reimbursement Form is attached for review.',
    attachments: [
      { filename: 'psychology-reimbursement-form.pdf', content: pdfBase64 },
      ...receipts,
    ],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 502 })
  return NextResponse.json({ ok: true })
}