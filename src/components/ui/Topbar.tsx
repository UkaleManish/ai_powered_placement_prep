'use client'
import { useState } from 'react'
import { Bell, Search, Settings, ChevronDown } from 'lucide-react'
import { useAuthProfile } from '@/lib/useAuthProfile'

interface TopbarProps {
  title: string
  subtitle?: string
}

const notifications = [
  { id: 1, text: 'New aptitude test available', time: '2m ago', unread: true },
  { id: 2, text: 'Your resume score improved!', time: '1h ago', unread: true },
  { id: 3, text: 'Interview prep session ready', time: '3h ago', unread: false },
]

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { profile } = useAuthProfile()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [searchVal, setSearchVal] = useState('')

  const initials = profile?.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase() || 'U'
  const unread = notifications.filter(n => n.unread).length

  return (
    <header style={{ height: '72px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 50 }}>
      
      {/* Left */}
      <div>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text-primary)', lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="hidden md:flex" style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input" style={{ width: '260px', paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px', fontSize: '13px' }}
          placeholder="Search topics, questions..." value={searchVal} onChange={e => setSearchVal(e.target.value)} />
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setShowNotifs(!showNotifs); setShowUser(false) }}
            style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', color: 'var(--text-secondary)' }}>
            <Bell size={17} />
            {unread > 0 && <div style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--bg-primary)' }} />}
          </button>
          {showNotifs && (
            <div style={{ position: 'absolute', top: '48px', right: 0, width: '280px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', zIndex: 200 }}>
              <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s', background: n.unread ? 'rgba(59,130,246,0.05)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148,163,184,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.unread ? 'rgba(59,130,246,0.05)' : 'transparent')}>
                  <div style={{ fontSize: '13px', color: n.unread ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{n.text}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <button style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <Settings size={17} />
        </button>

        {/* User */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setShowUser(!showUser); setShowNotifs(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px 4px 4px', borderRadius: '12px', background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white' }}>
              {initials}
            </div>
            <div className="hidden md:block" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{profile?.name?.split(' ')[0] || 'User'}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{profile?.role || 'student'}</div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>
    </header>
  )
}
