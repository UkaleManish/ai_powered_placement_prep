'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/ui/Sidebar'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, user => {
      if (!user) router.push('/auth/login')
      else setReady(true)
    })
    return () => unsub()
  }, [router])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div style={{ textAlign: 'center' }}>
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh', transition: 'margin-left 0.3s ease', overflow: 'hidden' }} id="main-content">
        {children}
      </main>
    </div>
  )
}
