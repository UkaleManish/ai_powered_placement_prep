'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight } from 'lucide-react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore/lite'
import { firebaseAuth, firebaseDb } from '@/lib/firebaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return }
    setLoading(true)

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, form.email.trim(), form.password)
      const userRef = doc(firebaseDb, 'users', credential.user.uid)
      const snap = await getDoc(userRef)

      let profile = snap.exists() ? snap.data() : null
      if (!profile) {
        const fallbackName = credential.user.displayName || form.email.split('@')[0]
        profile = {
          name: fallbackName,
          email: form.email.trim().toLowerCase(),
          role: 'student',
          college: '',
          avatar: '',
          stats: { testsAttempted: 0, avgScore: 0, streak: 0, rank: 0 },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
        await setDoc(userRef, profile, { merge: true })
      }

      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(80px)', animation: 'float 10s ease-in-out infinite reverse' }} />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-[420px] mx-4 animate-fade-in-up">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(99,102,241,0.1)' }}>

          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative"
              style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
              <Zap size={26} className="text-white" fill="white" />
              <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 30px rgba(99,102,241,0.6)' }} />
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Welcome back</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Sign in to your PlacePrep account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="email" className="input pl-10" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer" onClick={() => setRemember(!remember)}>
                <div className={`custom-checkbox ${remember ? 'checked' : ''}`}>
                  {remember && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Remember me</span>
              </label>
              <Link href="/auth/signup" style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', fontSize: '15px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Sora, sans-serif', opacity: loading ? 0.8 : 1, boxShadow: '0 8px 24px rgba(99,102,241,0.35)', marginTop: '8px' }}>
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center mt-6" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
          </p>
        </div>
        <p className="text-center mt-4" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🔒 Secured with Firebase Authentication</p>
      </div>
    </div>
  )
}
