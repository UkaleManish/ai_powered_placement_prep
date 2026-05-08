'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, ArrowRight, BookOpen, Code2, Brain, TrendingUp, ChevronRight } from 'lucide-react'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, user => {
      if (user) router.push('/dashboard')
    })
    return () => unsub()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: 'Sora, sans-serif', overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(148,163,184,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '64px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.5)',
          }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '18px', color: '#f1f5f9' }}>
            Place<span style={{ color: '#818cf8' }}>Prep</span> AI
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {['Features', 'Topics', 'About'].map(item => (
            <a key={item} href="#features" style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8', textDecoration: 'none' }}>
              {item}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/auth/login" style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', textDecoration: 'none', padding: '8px 16px' }}>
            Sign In
          </Link>
          <Link href="/auth/signup" style={{
            fontSize: '14px', fontWeight: 700, color: 'white', textDecoration: 'none',
            padding: '9px 20px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center',
        padding: '64px 10vw 0', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: '520px', height: '520px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22), transparent)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.18), transparent)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', marginBottom: '28px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#a5b4fc' }}>AI-powered • 500+ Questions • Free to Start</span>
        </div>

        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, lineHeight: 1.1, fontSize: 'clamp(40px, 5.5vw, 72px)', color: '#f1f5f9', marginBottom: '8px', maxWidth: '700px' }}>
          Crack your
        </h1>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, lineHeight: 1.1, fontSize: 'clamp(40px, 5.5vw, 72px)', background: 'linear-gradient(135deg, #818cf8, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '28px' }}>
          dream placement
        </h1>

        <p style={{ fontSize: 'clamp(15px, 1.3vw, 18px)', color: '#94a3b8', maxWidth: '500px', lineHeight: 1.7, marginBottom: '40px' }}>
          Practice aptitude, coding, and AI mock interviews. Get personalised feedback and ace your campus placements.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '64px' }}>
          <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: 'white', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}>
            Start Preparing <ArrowRight size={16} />
          </Link>
          <Link href="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '12px', background: 'transparent', border: '1.5px solid rgba(148,163,184,0.2)', color: '#94a3b8', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
          {[{ value: '500+', label: 'Practice Questions' }, { value: '10k+', label: 'Active Students' }, { value: '4.9★', label: 'Avg Rating' }].map((stat, i) => (
            <div key={i} style={{ paddingRight: i < 2 ? '40px' : '0', marginRight: i < 2 ? '40px' : '0', borderRight: i < 2 ? '1px solid rgba(148,163,184,0.15)' : 'none' }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#f1f5f9' }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" style={{ padding: '100px 10vw', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' as const, letterSpacing: '2px', marginBottom: '12px' }}>Everything you need</p>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, color: '#f1f5f9' }}>Prepare smarter, not harder</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {[
            { icon: Brain, title: 'AI Mock Interviews', desc: 'Real-time AI interview with instant feedback on your answers and communication.', color: '#6366f1' },
            { icon: Code2, title: 'Coding Practice', desc: 'DSA problems with an in-browser editor. Track your progress as you solve.', color: '#3b82f6' },
            { icon: BookOpen, title: 'Aptitude & Verbal', desc: 'Curated aptitude, logical reasoning, and verbal ability question banks.', color: '#8b5cf6' },
            { icon: TrendingUp, title: 'Performance Analytics', desc: 'Detailed charts showing your weak areas and improvement over time.', color: '#10b981' },
          ].map(({ icon: Icon, title, desc, color }, i) => (
            <div key={i} style={{ padding: '28px', borderRadius: '16px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(148,163,184,0.08)', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '18px', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>{title}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '80px 10vw 100px', background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '60px 40px', borderRadius: '24px', background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)', boxShadow: '0 0 80px rgba(99,102,241,0.12)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 24px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}>
            <Zap size={28} color="white" fill="white" />
          </div>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '28px', fontWeight: 800, color: '#f1f5f9', marginBottom: '12px' }}>Ready to get placed?</h2>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, marginBottom: '32px' }}>Join thousands of students already preparing with PlacePrep AI. Free to get started.</p>
          <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', color: 'white', fontWeight: 700, fontSize: '15px', textDecoration: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}>
            Create Free Account <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '24px 10vw', borderTop: '1px solid rgba(148,163,184,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="white" fill="white" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>PlacePrep AI</span>
        </div>
        <p style={{ fontSize: '12px', color: '#334155' }}>© 2026 PlacePrep AI. All rights reserved.</p>
      </div>
    </div>
  )
}
