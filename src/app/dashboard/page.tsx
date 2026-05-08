'use client'
import { useEffect, useMemo, useState } from 'react'
import Topbar from '@/components/ui/Topbar'
import { 
  BookOpen, Code2, FileText, Mic, Target, TrendingUp, 
  Clock, Award, Flame, ChevronRight, ArrowUpRight, 
  CheckCircle2, Circle, AlertCircle, Play, Star
} from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'
import { collection, getDocs, query, where } from 'firebase/firestore/lite'
import { firebaseDb } from '@/lib/firebaseClient'
import { useAuthProfile } from '@/lib/useAuthProfile'

type PerformancePoint = { day: string; aptitude: number; coding: number; verbal: number }
type RecentItem = { title: string; type: string; score: number; time: string; status: string }
type TopicItem = { title: string; difficulty: string; priority: string; est: string }

const emptyPerformance: PerformancePoint[] = [
  { day: 'Mon', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Tue', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Wed', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Thu', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Fri', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Sat', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Sun', aptitude: 0, coding: 0, verbal: 0 },
]

const quickActions = [
  { label: 'Start Aptitude', icon: BookOpen, href: '/aptitude', color: '#3b82f6' },
  { label: 'Code Practice', icon: Code2, href: '/coding', color: '#10b981' },
  { label: 'Analyze Resume', icon: FileText, href: '/resume', color: '#8b5cf6' },
]

export default function DashboardPage() {
  const { authUser, profile } = useAuthProfile()
  const [greeting, setGreeting] = useState('Good morning')
  const [performanceData, setPerformanceData] = useState<PerformancePoint[]>(emptyPerformance)
  const [recentActivity, setRecentActivity] = useState<RecentItem[]>([])
  const [upcomingTopics, setUpcomingTopics] = useState<TopicItem[]>([])
  const [stats, setStats] = useState({ testsAttempted: 0, avgScore: 0, streak: 0, rank: 0, totalUsers: 0 })
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      if (!authUser) return
      setLoadingStats(true)
      try {
        const attemptsSnap = await getDocs(query(collection(firebaseDb, 'aptitudeAttempts'), where('userId', '==', authUser.uid)))
        const attempts = attemptsSnap.docs.map(docSnap => docSnap.data() as any)
        const testsAttempted = attempts.length
        const avgScore = testsAttempted ? Math.round(attempts.reduce((acc, a) => acc + (Number(a.score || 0)), 0) / testsAttempted) : 0

        const daySet = new Set<string>()
        attempts.forEach(a => {
          const date = a.createdAt?.toDate?.() || new Date()
          daySet.add(date.toISOString().slice(0, 10))
        })

        let streak = 0
        const cursor = new Date()
        while (true) {
          const key = cursor.toISOString().slice(0, 10)
          if (!daySet.has(key)) break
          streak += 1
          cursor.setDate(cursor.getDate() - 1)
        }

        const allSnap = await getDocs(collection(firebaseDb, 'aptitudeAttempts'))
        const userAgg: Record<string, { total: number; count: number }> = {}
        allSnap.forEach(docSnap => {
          const data = docSnap.data() as any
          const uid = data.userId
          if (!uid) return
          if (!userAgg[uid]) userAgg[uid] = { total: 0, count: 0 }
          userAgg[uid].total += Number(data.score || 0)
          userAgg[uid].count += 1
        })

        const avgByUser = Object.entries(userAgg).map(([uid, v]) => ({ uid, avg: v.count ? v.total / v.count : 0 }))
        avgByUser.sort((a, b) => b.avg - a.avg)
        const rankIndex = avgByUser.findIndex(u => u.uid === authUser.uid)
        const rank = rankIndex >= 0 ? rankIndex + 1 : 0

        setStats({ testsAttempted, avgScore, streak, rank, totalUsers: avgByUser.length })

        const days: Date[] = []
        for (let i = 6; i >= 0; i -= 1) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          days.push(d)
        }

        const dayMap: Record<string, { aptTotal: number; aptCorrect: number; verTotal: number; verCorrect: number; logTotal: number; logCorrect: number }> = {}
        days.forEach(d => {
          dayMap[d.toISOString().slice(0, 10)] = { aptTotal: 0, aptCorrect: 0, verTotal: 0, verCorrect: 0, logTotal: 0, logCorrect: 0 }
        })

        attempts.forEach(a => {
          const date = a.createdAt?.toDate?.() || new Date()
          const key = date.toISOString().slice(0, 10)
          if (!dayMap[key]) return
          const breakdown = a.breakdown || {}
          const quant = breakdown.Quant || {}
          const verbal = breakdown.Verbal || {}
          const logical = breakdown.Logical || {}
          dayMap[key].aptTotal += Number(quant.total || 0)
          dayMap[key].aptCorrect += Number(quant.correct || 0)
          dayMap[key].verTotal += Number(verbal.total || 0)
          dayMap[key].verCorrect += Number(verbal.correct || 0)
          dayMap[key].logTotal += Number(logical.total || 0)
          dayMap[key].logCorrect += Number(logical.correct || 0)
        })

        const nextPerformance = days.map(d => {
          const key = d.toISOString().slice(0, 10)
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
          const data = dayMap[key]
          const aptitude = data.aptTotal ? Math.round((data.aptCorrect / data.aptTotal) * 100) : 0
          const verbal = data.verTotal ? Math.round((data.verCorrect / data.verTotal) * 100) : 0
          const coding = data.logTotal ? Math.round((data.logCorrect / data.logTotal) * 100) : 0
          return { day: dayName, aptitude, coding, verbal }
        })

        setPerformanceData(nextPerformance)

        const activity = attempts
          .filter(a => a.createdAt)
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 4)
          .map(a => {
            const date = a.createdAt?.toDate?.() || new Date()
            const timeDiff = Date.now() - date.getTime()
            const minutes = Math.floor(timeDiff / 60000)
            const hours = Math.floor(minutes / 60)
            const daysAgo = Math.floor(hours / 24)
            let time = 'Just now'
            if (daysAgo > 0) time = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`
            else if (hours > 0) time = `${hours}h ago`
            else if (minutes > 0) time = `${minutes}m ago`

            return {
              title: `${a.section || 'Aptitude'} Test`,
              type: 'aptitude',
              score: Number(a.score || 0),
              time,
              status: 'completed',
            }
          })

        setRecentActivity(activity)
      } catch (err: any) {
        setStats({ testsAttempted: 0, avgScore: 0, streak: 0, rank: 0, totalUsers: 0 })
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [authUser])

  useEffect(() => {
    const loadTopics = async () => {
      if (!authUser) return
      try {
        const token = await authUser.getIdToken()
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok || !Array.isArray(data.recommendations)) return
        const topics = data.recommendations.slice(0, 4).map((rec: any) => ({
          title: rec.title,
          difficulty: rec.difficulty,
          priority: rec.priority,
          est: rec.est,
        }))
        setUpcomingTopics(topics)
      } catch {
        setUpcomingTopics([])
      }
    }

    loadTopics()
  }, [authUser])

  const statCards = useMemo(() => {
    return [
      { label: 'Tests Attempted', value: String(stats.testsAttempted), change: stats.testsAttempted ? 'Across all attempts' : 'No attempts yet', icon: Target, color: '#3b82f6', bg: 'stat-blue' },
      { label: 'Avg Score', value: `${stats.avgScore}%`, change: stats.avgScore ? 'Based on your tests' : 'Take a test to start', icon: TrendingUp, color: '#10b981', bg: 'stat-green' },
      { label: 'Study Streak', value: `${stats.streak} days`, change: stats.streak ? 'Keep it up!' : 'Start your streak today', icon: Flame, color: '#f59e0b', bg: 'stat-orange' },
      { label: 'Rank', value: stats.rank ? `#${stats.rank}` : '--', change: stats.totalUsers ? `Among ${stats.totalUsers} students` : 'Not ranked yet', icon: Award, color: '#8b5cf6', bg: 'stat-purple' },
    ]
  }, [stats])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ fontSize: '13px', color: p.color, fontWeight: 600 }}>{p.name}: {p.value}%</p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <Topbar title="Dashboard" subtitle={`${greeting}, ${profile?.name?.split(' ')[0] || 'Student'}! 👋`} />
      
      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {statCards.map((s, i) => (
            <div key={i} className={`card ${s.bg} animate-fade-in-up`} style={{ padding: '20px', animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
                <ArrowUpRight size={16} style={{ color: s.color, opacity: 0.7 }} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'var(--text-primary)', marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '12px', color: s.color, fontWeight: 500 }}>{s.change}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card animate-fade-in-up delay-200" style={{ opacity: 0, padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {quickActions.map((a, i) => (
              <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${a.color}30`, background: `${a.color}08`, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.background = `${a.color}15` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.background = `${a.color}08` }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <a.icon size={22} style={{ color: a.color }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          
          {/* Performance Chart */}
          <div className="card animate-fade-in-up delay-300" style={{ opacity: 0, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Weekly Performance</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Score trends across categories</p>
              </div>
              <select style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none' }}>
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="apt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="cod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="ver" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={[50, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="aptitude" name="Aptitude" stroke="#3b82f6" strokeWidth={2} fill="url(#apt)" />
                <Area type="monotone" dataKey="coding" name="Coding" stroke="#10b981" strokeWidth={2} fill="url(#cod)" />
                <Area type="monotone" dataKey="verbal" name="Verbal" stroke="#8b5cf6" strokeWidth={2} fill="url(#ver)" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
              {[{ c: '#3b82f6', l: 'Aptitude' }, { c: '#10b981', l: 'Coding' }, { c: '#8b5cf6', l: 'Verbal' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.c }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Status */}
          <div className="card animate-fade-in-up delay-400" style={{ opacity: 0, padding: '24px' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>Today&apos;s Goals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="url(#progress)" strokeWidth="10"
                    strokeDasharray={`${0.75 * 314} ${314}`} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="progress" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Plus Jakarta Sans' }}>75%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Complete</div>
                </div>
              </div>
            </div>
            {[
              { label: '3 Aptitude tests', done: true },
              { label: '2 Coding problems', done: true },
              { label: 'Resume review', done: true },
              { label: '1 Mock interview', done: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                {item.done ? <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} /> : <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                <span style={{ fontSize: '13px', color: item.done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Recent Activity */}
          <div className="card animate-fade-in-up delay-400" style={{ opacity: 0, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Recent Activity</h3>
              <Link href="/analytics" style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                See all <ChevronRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivity.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(148,163,184,0.04)', border: '1px solid var(--border)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: item.type === 'aptitude' ? 'rgba(59,130,246,0.15)' : item.type === 'coding' ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.type === 'aptitude' ? <BookOpen size={16} style={{ color: '#60a5fa' }} /> : item.type === 'coding' ? <Code2 size={16} style={{ color: '#34d399' }} /> : <FileText size={16} style={{ color: '#a78bfa' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.time}</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: item.score >= 80 ? '#34d399' : item.score >= 60 ? '#fbbf24' : '#f87171' }}>{item.score}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="card animate-fade-in-up delay-500" style={{ opacity: 0, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={12} color="white" fill="white" />
                </div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>AI Recommendations</h3>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '11px' }}>Personalized</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingTopics.map((topic, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(148,163,184,0.03)', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: topic.priority === 'high' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AlertCircle size={14} style={{ color: topic.priority === 'high' ? '#f87171' : '#fbbf24' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{topic.title}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{topic.difficulty}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={10} />{topic.est}</span>
                    </div>
                  </div>
                  <Play size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
