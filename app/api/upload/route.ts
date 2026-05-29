import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const invoiceId = formData.get('invoiceId') as string

  if (!file || !invoiceId) {
    return NextResponse.json({ error: 'Missing file or invoiceId' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const filePath = `${invoiceId}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error } = await supabaseAdmin.storage
    .from('invoices')
    .upload(filePath, buffer, { upsert: true, contentType: file.type })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ filePath, fileName: file.name })
}
