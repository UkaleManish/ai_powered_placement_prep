import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const hasKey = Boolean(process.env.GROQ_API_KEY)
  const model = process.env.GROQ_MODEL || 'llama3-8b-8192'

  return NextResponse.json({
    ok: true,
    groq: {
      hasKey,
      model,
    },
  })
}
