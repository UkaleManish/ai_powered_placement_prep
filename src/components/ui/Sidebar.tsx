'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, BookOpen, Code2, FileText, 
  Mic, BarChart3, Settings, LogOut, Zap, 
  ChevronLeft, ChevronRight, Shield, Brain, Star
} from 'lucide-react'
import toast from 'react-hot-toast'
import { signOut } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'
import { useAuthProfile } from '@/lib/useAuthProfile'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'Aptitude', href: '/aptitude' },
  { icon: Code2, label: 'Coding', href: '/coding' },
  { icon: FileText, label: 'Resume Analyzer', href: '/resume' },
  { icon: Brain, label: 'AI Recommend', href: '/recommend' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const { profile } = useAuthProfile()

  const logout = async () => {
    toast.success('Logged out')
    await signOut(firebaseAuth)
    router.push('/')
  }

  const initials = profile?.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase() || 'U'

  return (
    <aside style={{
      width: collapsed ? '72px' : '240px',
      minHeight: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', minHeight: '72px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={18} color="white" fill="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>PlacePrep</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>AI Assistant</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} className={`sidebar-link ${active ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '10px 16px' }}
              title={collapsed ? item.label : ''}>
              <item.icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        {!collapsed && profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(148,163,184,0.05)', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{profile.role || 'student'}</div>
            </div>
            <Star size={12} style={{ color: '#fbbf24', flexShrink: 0 }} />
          </div>
        )}
        <button onClick={logout} className="sidebar-link" style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', color: '#f87171' }}>
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        style={{ position: 'absolute', top: '24px', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 101 }}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
