'use client'
import { useEffect, useMemo, useState } from 'react'
import Topbar from '@/components/ui/Topbar'
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area } from 'recharts'
import { TrendingUp, Award, Clock, Target, BookOpen, Code2, Brain } from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore/lite'
import { firebaseDb } from '@/lib/firebaseClient'
import { useAuthProfile } from '@/lib/useAuthProfile'

type WeeklyPoint = { day: string; aptitude: number; coding: number; verbal: number }
type TopicPoint = { topic: string; correct: number; wrong: number; partial: number }
type RadarPoint = { subject: string; A: number; B: number }
type TimePoint = { name: string; value: number; color: string }
type SectionRow = { section: string; correct: number; total: number }

const emptyWeek: WeeklyPoint[] = [
  { day: 'Mon', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Tue', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Wed', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Thu', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Fri', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Sat', aptitude: 0, coding: 0, verbal: 0 },
  { day: 'Sun', aptitude: 0, coding: 0, verbal: 0 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px' }}>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: '13px', color: p.color, fontWeight: 600 }}>{p.name}: {p.value}{typeof p.value === 'number' && p.value <= 100 ? '%' : ''}</p>
      ))}
    </div>
  )
  return null
}

export default function AnalyticsPage() {
  const { authUser } = useAuthProfile()
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>(emptyWeek)
  const [topicData, setTopicData] = useState<TopicPoint[]>([])
  const [radarData, setRadarData] = useState<RadarPoint[]>([])
  const [timeData, setTimeData] = useState<TimePoint[]>([])
  const [sectionRows, setSectionRows] = useState<SectionRow[]>([])
  const [kpis, setKpis] = useState({
    rank: 0,
    totalUsers: 0,
    questionsDone: 0,
    avgScore: 0,
    timeInvested: '0:00',
  })

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!authUser) return

      const attemptsSnap = await getDocs(query(collection(firebaseDb, 'aptitudeAttempts'), where('userId', '==', authUser.uid)))
      const attempts = attemptsSnap.docs.map(docSnap => docSnap.data() as any)

      const questionsDone = attempts.reduce((sum, a) => sum + Number(a.totalQuestions || 0), 0)
      const avgScore = attempts.length ? Math.round(attempts.reduce((sum, a) => sum + Number(a.score || 0), 0) / attempts.length) : 0

      const minutesTotal = Math.round(questionsDone * 1.5)
      const hours = Math.floor(minutesTotal / 60)
      const minutes = minutesTotal % 60
      const timeInvested = `${hours}:${String(minutes).padStart(2, '0')}`

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

      setKpis({
        rank,
        totalUsers: avgByUser.length,
        questionsDone,
        avgScore,
        timeInvested,
      })

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

      const sectionAgg: Record<string, { total: number; correct: number }> = {}

      attempts.forEach(a => {
        const date = a.createdAt?.toDate?.() || new Date()
        const key = date.toISOString().slice(0, 10)
        const breakdown = a.breakdown || {}
        Object.keys(breakdown).forEach(sec => {
          const stat = breakdown[sec] || {}
          if (!sectionAgg[sec]) sectionAgg[sec] = { total: 0, correct: 0 }
          sectionAgg[sec].total += Number(stat.total || 0)
          sectionAgg[sec].correct += Number(stat.correct || 0)
        })

        if (dayMap[key]) {
          const quant = breakdown.Quant || {}
          const verbal = breakdown.Verbal || {}
          const logical = breakdown.Logical || {}
          dayMap[key].aptTotal += Number(quant.total || 0)
          dayMap[key].aptCorrect += Number(quant.correct || 0)
          dayMap[key].verTotal += Number(verbal.total || 0)
          dayMap[key].verCorrect += Number(verbal.correct || 0)
          dayMap[key].logTotal += Number(logical.total || 0)
          dayMap[key].logCorrect += Number(logical.correct || 0)
        }
      })

      const nextWeekly = days.map(d => {
        const key = d.toISOString().slice(0, 10)
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
        const data = dayMap[key]
        const aptitude = data.aptTotal ? Math.round((data.aptCorrect / data.aptTotal) * 100) : 0
        const verbal = data.verTotal ? Math.round((data.verCorrect / data.verTotal) * 100) : 0
        const coding = data.logTotal ? Math.round((data.logCorrect / data.logTotal) * 100) : 0
        return { day: dayName, aptitude, coding, verbal }
      })
      setWeeklyData(nextWeekly)

      const nextTopic = Object.keys(sectionAgg).map(sec => {
        const stat = sectionAgg[sec]
        const correct = stat.correct
        const wrong = Math.max(0, stat.total - stat.correct)
        return { topic: sec, correct, wrong, partial: 0 }
      })
      setTopicData(nextTopic)

      const quantAcc = sectionAgg.Quant?.total ? Math.round((sectionAgg.Quant.correct / sectionAgg.Quant.total) * 100) : 0
      const verbalAcc = sectionAgg.Verbal?.total ? Math.round((sectionAgg.Verbal.correct / sectionAgg.Verbal.total) * 100) : 0
      const logicalAcc = sectionAgg.Logical?.total ? Math.round((sectionAgg.Logical.correct / sectionAgg.Logical.total) * 100) : 0

      setRadarData([
        { subject: 'Aptitude', A: quantAcc, B: 70 },
        { subject: 'Coding', A: 0, B: 65 },
        { subject: 'Verbal', A: verbalAcc, B: 75 },
        { subject: 'Logical', A: logicalAcc, B: 68 },
        { subject: 'System Design', A: 0, B: 72 },
        { subject: 'DB & SQL', A: 0, B: 60 },
      ])

      const total = Object.values(sectionAgg).reduce((sum, s) => sum + s.total, 0)
      const quantPct = total ? Math.round((sectionAgg.Quant?.total || 0) / total * 100) : 0
      const verbalPct = total ? Math.round((sectionAgg.Verbal?.total || 0) / total * 100) : 0
      const logicalPct = total ? Math.round((sectionAgg.Logical?.total || 0) / total * 100) : 0
      const codingPct = 0

      setTimeData([
        { name: 'Quant', value: quantPct, color: '#3b82f6' },
        { name: 'Verbal', value: verbalPct, color: '#8b5cf6' },
        { name: 'Logical', value: logicalPct, color: '#10b981' },
        { name: 'Coding', value: codingPct, color: '#f59e0b' },
      ])

      const nextRows = Object.keys(sectionAgg).map(sec => ({ section: sec, correct: sectionAgg[sec].correct, total: sectionAgg[sec].total }))
      setSectionRows(nextRows)
    }

    loadAnalytics()
  }, [authUser])

  const kpiCards = useMemo(() => {
    return [
      { label: 'Overall Rank', value: kpis.rank ? `#${kpis.rank}` : '--', sub: kpis.totalUsers ? `of ${kpis.totalUsers} students` : 'No ranking yet', icon: Award, color: '#f59e0b' },
      { label: 'Questions Done', value: String(kpis.questionsDone), sub: 'from aptitude attempts', icon: Target, color: '#3b82f6' },
      { label: 'Time Invested', value: kpis.timeInvested, sub: 'estimated study time', icon: Clock, color: '#10b981' },
      { label: 'Avg Score', value: `${kpis.avgScore}%`, sub: 'from your tests', icon: TrendingUp, color: '#8b5cf6' },
    ]
  }, [kpis])

  return (
    <div>
      <Topbar title="Performance Analytics" subtitle="Deep insights into your preparation progress" />
      <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {kpiCards.map((s, i) => (
            <div key={i} className="card animate-fade-in-up" style={{ opacity: 0, animationDelay: `${i*0.1}s`, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'Plus Jakarta Sans', color: 'var(--text-primary)', marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div className="card animate-fade-in-up delay-200" style={{ opacity: 0, padding: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>Weekly Score Trends</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Performance across all categories</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  {[['apt', '#3b82f6'], ['cod', '#10b981'], ['ver', '#8b5cf6']].map(([id, color]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
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
          </div>

          <div className="card animate-fade-in-up delay-300" style={{ opacity: 0, padding: '24px' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>Time Distribution</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart width={180} height={180}>
                <Pie data={timeData} cx={90} cy={90} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {timeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {timeData.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: item.color }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          
          {/* Topic-wise Performance */}
          <div className="card animate-fade-in-up delay-300" style={{ opacity: 0, padding: '24px' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>Topic-wise Question Completion</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topicData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />
                <XAxis dataKey="topic" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="correct" name="Correct" stackId="a" fill="#10b981" radius={[0,0,0,0]} />
                <Bar dataKey="partial" name="Partial" stackId="a" fill="#f59e0b" />
                <Bar dataKey="wrong" name="Wrong" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              {[{ c: '#10b981', l: 'Correct' }, { c: '#f59e0b', l: 'Partial' }, { c: '#ef4444', l: 'Wrong' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.c }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Radar */}
          <div className="card animate-fade-in-up delay-400" style={{ opacity: 0, padding: '24px' }}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>Skill vs Benchmark</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Your score vs average student score</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Radar name="You" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Benchmark" dataKey="B" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              {[{ c: '#6366f1', l: 'Your Score' }, { c: '#f59e0b', l: 'Benchmark' }].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.c }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Language Rankings */}
        <div className="card animate-fade-in-up delay-400" style={{ opacity: 0, padding: '24px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>Section Performance</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Section', 'Correct', 'Total', 'Accuracy', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectionRows.map((row, i) => {
                  const pct = row.total ? Math.round((row.correct / row.total) * 100) : 0
                  return (
                    <tr key={i} className="table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Code2 size={16} style={{ color: '#a78bfa' }} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{row.section}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{row.correct}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{row.total}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="progress-bar" style={{ width: '100px' }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 70 ? '#10b981' : pct > 40 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: pct > 70 ? '#34d399' : pct > 40 ? '#fbbf24' : '#f87171' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge ${pct > 70 ? 'badge-green' : pct > 40 ? 'badge-orange' : 'badge-red'}`}>
                          {pct > 70 ? 'Strong' : pct > 40 ? 'Average' : 'Needs Work'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {sectionRows.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>No attempts yet. Take a test to see analytics.</div>
          )}
        </div>
      </div>
    </div>
  )
}
