'use client'
import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore/lite'
import { firebaseAuth, firebaseDb } from '@/lib/firebaseClient'

type UserProfile = {
  name: string
  email: string
  role: string
  college?: string
  avatar?: string
}

export function useAuthProfile() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async user => {
      setAuthUser(user)
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        const snap = await getDoc(doc(firebaseDb, 'users', user.uid))
        if (snap.exists()) {
          const data = snap.data() as UserProfile
          setProfile(data)
        } else {
          setProfile({
            name: user.displayName || 'User',
            email: user.email || '',
            role: 'student',
            college: '',
          })
        }
      } catch {
        setProfile({
          name: user.displayName || 'User',
          email: user.email || '',
          role: 'student',
          college: '',
        })
      } finally {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [])

  return { authUser, profile, loading }
}
