import { NextRequest, NextResponse } from 'next/server'
import { firebaseAdminAuth, firebaseAdminDb } from '@/lib/firebaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = body.email

    if (!email) {
      return NextResponse.json({ exists: false })
    }

    const userRecord = await firebaseAdminAuth.getUserByEmail(email)
    const profileSnap = await firebaseAdminDb.collection('users').doc(userRecord.uid).get()
    const profile = profileSnap.exists ? profileSnap.data() : null

    return NextResponse.json({ exists: true, name: profile?.name || userRecord.displayName || '' })
  } catch {
    return NextResponse.json({ exists: false })
  }
}