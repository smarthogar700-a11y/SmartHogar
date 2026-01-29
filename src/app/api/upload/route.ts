import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getSupabaseAdminClient } from '@/lib/supabaseClient'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${authResult.user.userId}_${Date.now()}.${fileExt}`
    const filePath = `uploads/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let supabase
    try {
      supabase = getSupabaseAdminClient()
    } catch (initError) {
      console.error('Supabase init error:', initError)
      const placeholderUrl = 'https://via.placeholder.com/400x300/2B2B2B/C9A24D?text=Comprobante+Subido'
      return NextResponse.json({
        url: placeholderUrl,
        warning: 'Storage no configurado. Se usó un placeholder.',
      })
    }

    // Try to upload to Supabase Storage (bucket: Smart)
    const { data, error } = await supabase.storage
      .from('Smart')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)

      const placeholderUrl = 'https://via.placeholder.com/400x300/2B2B2B/C9A24D?text=Comprobante+Subido'
      return NextResponse.json({
        url: placeholderUrl,
        warning: 'No se pudo subir el comprobante a Storage. Se usó un placeholder.',
      })
    }

    const { data: publicData } = supabase.storage
      .from('Smart')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicData.publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error al procesar archivo' },
      { status: 500 }
    )
  }
}
