'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Zap, ArrowRight, CheckCircle } from 'lucide-react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore/lite'
import { firebaseAuth, firebaseDb } from '@/lib/firebaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '', role: 'student' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validate = () => {
    if (!form.name.trim()) { toast.error('Please enter your name'); return false }
    if (!form.email.trim() || !form.email.includes('@')) { toast.error('Please enter a valid email'); return false }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return false }
    return true
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, form.email.trim(), form.password)
      if (form.name.trim()) {
        await updateProfile(credential.user, { displayName: form.name.trim() })
      }

      const profile = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        college: form.college.trim(),
        avatar: '',
        stats: { testsAttempted: 0, avgScore: 0, streak: 0, rank: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(firebaseDb, 'users', credential.user.uid), profile, { merge: true })

      setDone(true)
      toast.success('Account created! Taking you to dashboard... 🎉')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Redirecting to login...', { duration: 3000 })
        setTimeout(() => router.push('/auth/login'), 2000)
        return
      }
      toast.error(error?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      <div className="animate-fade-in-up" style={{ textAlign: 'center', opacity: 1 }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle size={36} style={{ color: '#10b981' }} />
        </div>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'white', marginBottom: '8px' }}>Account Created!</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Redirecting to your dashboard...</p>
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mt-6" />
      </div>
    </div>
  )

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>

      {/* Blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #10b981, transparent)', filter: 'blur(80px)' }} />
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-[440px] mx-4 animate-fade-in-up">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(16,185,129,0.08)' }}>

          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative"
              style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}>
              <Zap size={26} className="text-white" fill="white" />
              <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: '0 0 30px rgba(16,185,129,0.5)' }} />
            </div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Create Account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Start your placement journey today
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Name */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Full Name *
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="text" className="input pl-10" placeholder="e.g. Yashwanth M"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Email Address *
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="email" className="input pl-10" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            {/* College */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                College
              </label>
              <div className="relative">
                <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="text" className="input pl-10" placeholder="Your college name"
                  value={form.college} onChange={e => setForm({ ...form, college: e.target.value })} />
              </div>
            </div>

            {/* Role */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                I am a
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[{ v: 'student', l: '🎓 Student' }, { v: 'admin', l: '⚙️ Admin' }].map(r => (
                  <button key={r.v} type="button" onClick={() => setForm({ ...form, role: r.v })}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Sora', transition: 'all 0.15s', border: `2px solid ${form.role === r.v ? '#10b981' : 'var(--border)'}`, background: form.role === r.v ? 'rgba(16,185,129,0.12)' : 'transparent', color: form.role === r.v ? '#34d399' : 'var(--text-muted)' }}>
                    {r.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Password * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min. 6 characters)</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="Create a strong password"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {form.password && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: '4px', borderRadius: '99px', background: form.password.length >= i * 3 ? (form.password.length >= 12 ? '#10b981' : form.password.length >= 8 ? '#f59e0b' : '#ef4444') : 'rgba(148,163,184,0.15)', transition: 'all 0.3s' }} />
                  ))}
                  <span style={{ fontSize: '11px', color: form.password.length >= 12 ? '#34d399' : form.password.length >= 8 ? '#fbbf24' : '#f87171', marginLeft: '4px', whiteSpace: 'nowrap' }}>
                    {form.password.length >= 12 ? 'Strong' : form.password.length >= 8 ? 'Good' : 'Weak'}
                  </span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #14b8a6)', color: 'white', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Sora, sans-serif', opacity: loading ? 0.8 : 1, boxShadow: '0 8px 24px rgba(16,185,129,0.3)', transition: 'all 0.2s', marginTop: '4px' }}>
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center mt-6" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#60a5fa', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
