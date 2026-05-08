'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Topbar from '@/components/ui/Topbar'
import { Brain, Zap, Play, Clock, Star, TrendingUp, AlertCircle, BookOpen, Code2, Mic, ChevronRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'

type Recommendation = {
  id: number
  type: 'aptitude' | 'coding' | 'core'
  title: string
  reason: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  est: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  tags: string[]
}

type CompanyReadiness = {
  name: string
  logo: string
  type: string
  topics: string[]
  difficulty: string
  match: number
}

const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', label: '🔴 Critical' },
  high: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: '🟠 High' },
  medium: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: '🔵 Medium' },
  low: { bg: 'rgba(16,185,129,0.15)', text: '#34d399', label: '🟢 Low' },
}

const typeIcons: Record<string, any> = { aptitude: BookOpen, coding: Code2, core: BookOpen }
const typeColors: Record<string, string> = { aptitude: '#3b82f6', coding: '#10b981', core: '#f97316' }
const typeHrefs: Record<string, string> = { aptitude: '/aptitude', coding: '/coding', core: '/aptitude' }

export default function RecommendPage() {
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [companyReadiness, setCompanyReadiness] = useState<CompanyReadiness[]>([])
  const [meta, setMeta] = useState<{ source?: string; reason?: string } | null>(null)
  const [userToken, setUserToken] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return filter === 'all' ? recommendations : recommendations.filter(r => r.priority === filter)
  }, [filter, recommendations])

  const stats = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 }
    let minutes = 0
    recommendations.forEach(rec => {
      counts[rec.priority] += 1
      const match = rec.est.match(/\d+/)
      if (match) minutes += Number(match[0])
    })
    const other = counts.medium + counts.low
    return { counts, other, minutes }
  }, [recommendations])

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async user => {
      if (!user) {
        setUserToken(null)
        setRecommendations([])
        return
      }
      const token = await user.getIdToken()
      setUserToken(token)
    })
    return () => unsub()
  }, [])

  const refresh = useCallback(async () => {
    if (!userToken) {
      toast.error('Please sign in to get recommendations')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userToken}` },
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Failed to load recommendations')
        return
      }
      setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : [])
      setCompanyReadiness(Array.isArray(data.companyReadiness) ? data.companyReadiness : [])
      setMeta(data?.meta || null)
      if (data?.meta?.source === 'fallback') {
        toast.error(`Using fallback plan (${data?.meta?.reason || 'unknown'})`)
      } else {
        toast.success('Recommendations refreshed!')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }, [userToken])

  useEffect(() => {
    if (userToken) refresh()
  }, [userToken, refresh])

  return (
    <div>
      <Topbar title="AI Recommendations" subtitle="Personalized study plan based on your performance" />
      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Header card */}
        <div className="card animate-fade-in-up" style={{ opacity: 0, padding: '24px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(59,130,246,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={28} color="white" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '20px', color: 'var(--text-primary)', marginBottom: '4px' }}>AI Study Planner</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Based on your last 7 days of activity · Updated just now</p>
                {meta?.source === 'fallback' && (
                  <p style={{ fontSize: '12px', color: '#f59e0b', marginTop: '6px' }}>Fallback in use: {meta?.reason || 'unknown'}.</p>
                )}
              </div>
            </div>
            <button onClick={refresh} disabled={loading} className="btn btn-secondary" style={{ fontSize: '13px' }}>
              {loading ? <div className="w-4 h-4 border border-blue-400 border-t-transparent rounded-full animate-spin" /> : <RefreshCw size={15} />}
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '20px', flexWrap: 'wrap' }}>
            {[
              { v: String(stats.counts.critical), l: 'Critical items', c: '#f87171' },
              { v: String(stats.counts.high), l: 'High priority', c: '#fbbf24' },
              { v: String(stats.other), l: 'Other topics', c: '#60a5fa' },
              { v: `${Math.ceil(stats.minutes / 60)} hrs`, l: 'Study time needed', c: '#34d399' },
            ].map((s, i) => (
              <div key={i}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: s.c, fontFamily: 'Plus Jakarta Sans' }}>{s.v}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter + Recommendations */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>Recommended Topics</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'critical', 'high', 'medium', 'low'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: filter === f ? 'none' : '1px solid var(--border)', background: filter === f ? 'rgba(99,102,241,0.3)' : 'transparent', color: filter === f ? '#a78bfa' : 'var(--text-muted)', fontFamily: 'Sora', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {filtered.map((rec, i) => {
              const Icon = typeIcons[rec.type]
              const color = typeColors[rec.type]
              const href = typeHrefs[rec.type]
              const p = priorityColors[rec.priority]
              return (
                <div key={rec.id} className="card animate-fade-in-up" style={{ opacity: 0, animationDelay: `${i*0.08}s`, padding: '20px', transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = `${color}40` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} style={{ color }} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{rec.title}</h4>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: p.bg, color: p.text, fontWeight: 600 }}>{p.label}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                    <AlertCircle size={12} style={{ display: 'inline', marginRight: '4px', color: '#f59e0b' }} />
                    {rec.reason}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {rec.tags.map(t => <span key={t} className="tag" style={{ fontSize: '11px' }}>{t}</span>)}
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: 'rgba(148,163,184,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{rec.difficulty}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />{rec.est}
                    </span>
                    <Link href={href} style={{ textDecoration: 'none' }}>
                      <button style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: `${color}20`, color, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Sora', transition: 'all 0.15s' }}>
                        <Play size={12} fill="currentColor" /> Start
                      </button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
          {filtered.length === 0 && (
            <div className="card" style={{ padding: '20px', marginTop: '12px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No recommendations yet. Tap refresh to generate a plan.</p>
            </div>
          )}
        </div>

        {/* Company Readiness */}
        <div>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>Company Readiness</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {companyReadiness.map((c, i) => (
              <div key={i} className="card animate-fade-in-up" style={{ opacity: 0, animationDelay: `${i*0.1}s`, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '28px' }}>{c.logo}</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.type}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: c.match >= 75 ? '#10b981' : c.match >= 55 ? '#f59e0b' : '#ef4444', fontFamily: 'Plus Jakarta Sans' }}>{c.match}%</div>
                </div>

                <div className="progress-bar" style={{ marginBottom: '12px' }}>
                  <div className="progress-fill" style={{ width: `${c.match}%`, background: c.match >= 75 ? 'linear-gradient(90deg, #10b981, #14b8a6)' : c.match >= 55 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)' }} />
                </div>

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {c.topics.slice(0, 3).map(t => (
                    <span key={t} className="tag" style={{ fontSize: '10px', padding: '2px 6px' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {companyReadiness.length === 0 && (
            <div className="card" style={{ padding: '20px', marginTop: '12px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No company readiness yet. Refresh recommendations to generate scores.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
