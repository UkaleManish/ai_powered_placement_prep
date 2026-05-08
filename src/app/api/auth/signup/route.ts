import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, college, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Name, email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 })
    }

    await connectDB()

    const existing = await (User as any).findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await (User as any).create({
      name, email: email.toLowerCase(), password: hashed, college: college || '', role: role || 'student'
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
