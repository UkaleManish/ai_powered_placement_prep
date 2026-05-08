import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 })
    }

    await connectDB()

    const user = await (User as any).findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 })
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, college: user.college, stats: user.stats }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
