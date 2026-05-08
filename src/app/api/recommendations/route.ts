import { NextRequest, NextResponse } from 'next/server'
import { firebaseAdminAuth, firebaseAdminDb } from '@/lib/firebaseAdmin'

type SectionStats = { total: number; correct: number }

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

function safeJsonParse(text: string): Recommendation[] | null {
  try {
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start === -1 || end === -1) return null
    const json = text.slice(start, end + 1)
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function buildFallback(sectionStats: Record<string, SectionStats>): Recommendation[] {
  const sections = Object.keys(sectionStats)
  const sorted = sections
    .map(sec => {
      const stat = sectionStats[sec]
      const accuracy = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0
      return { sec, accuracy }
    })
    .sort((a, b) => a.accuracy - b.accuracy)

  const weakest = sorted[0]?.sec || 'Quant'
  const medium = sorted[1]?.sec || 'Verbal'

  return [
    {
      id: 1,
      type: 'aptitude',
      title: `${weakest} Fundamentals`,
      reason: `Your ${weakest} accuracy is lower than other sections. Strengthening basics will lift your overall score.`,
      difficulty: 'Easy',
      est: '30 min',
      priority: 'critical',
      tags: [weakest, 'Basics'],
    },
    {
      id: 2,
      type: 'aptitude',
      title: `${weakest} Practice Set`,
      reason: `Consistent practice in ${weakest} will improve speed and accuracy.`,
      difficulty: 'Medium',
      est: '45 min',
      priority: 'high',
      tags: [weakest, 'Practice'],
    },
    {
      id: 3,
      type: 'core',
      title: 'OS: Deadlocks + Scheduling',
      reason: 'Core CS questions are common in placements; revise deadlock conditions and scheduling basics.',
      difficulty: 'Medium',
      est: '35 min',
      priority: 'medium',
      tags: ['OS', 'Core'],
    },
    {
      id: 4,
      type: 'coding',
      title: 'Arrays: Two Sum Variants',
      reason: 'Practice array + hashing patterns with target-sum variants to build speed.',
      difficulty: 'Easy',
      est: '30 min',
      priority: 'medium',
      tags: ['DSA', 'Array'],
    },
    {
      id: 5,
      type: 'core',
      title: 'DBMS: Normalization + Keys',
      reason: 'Review 1NF-3NF, candidate keys, and functional dependencies for core subject rounds.',
      difficulty: 'Easy',
      est: '25 min',
      priority: 'low',
      tags: ['DBMS', 'Core'],
    },
    {
      id: 6,
      type: 'coding',
      title: 'Sorting + Two Pointers',
      reason: 'These patterns reduce brute force and boost acceptance rates.',
      difficulty: 'Medium',
      est: '45 min',
      priority: 'low',
      tags: ['DSA', 'Sorting'],
    },
  ]
}

function buildCompanyReadiness(accuracy: number): CompanyReadiness[] {
  const base = Math.max(20, Math.min(95, accuracy || 0))
  const companies = [
    { name: 'TCS', logo: '🏢', type: 'Service', topics: ['Aptitude', 'Verbal', 'Coding'], difficulty: 'Easy', weight: 1.1 },
    { name: 'Infosys', logo: '🌐', type: 'Service', topics: ['Aptitude', 'Reasoning', 'English'], difficulty: 'Easy', weight: 1.05 },
    { name: 'Wipro', logo: '💼', type: 'Service', topics: ['Aptitude', 'Coding', 'Essay'], difficulty: 'Medium', weight: 0.95 },
    { name: 'Flipkart', logo: '🛒', type: 'Product', topics: ['DSA', 'System Design', 'CS Fundamentals'], difficulty: 'Hard', weight: 0.75 },
    { name: 'Amazon', logo: '📦', type: 'Product', topics: ['DSA', 'Leadership Principles', 'System Design'], difficulty: 'Hard', weight: 0.7 },
    { name: 'Google', logo: '🔍', type: 'Product', topics: ['Algorithms', 'System Design', 'Behavioral'], difficulty: 'Very Hard', weight: 0.6 },
  ]

  return companies.map(c => ({
    name: c.name,
    logo: c.logo,
    type: c.type,
    topics: c.topics,
    difficulty: c.difficulty,
    match: Math.max(15, Math.min(98, Math.round(base * c.weight))),
  }))
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = await firebaseAdminAuth.verifyIdToken(token)
    const userId = decoded.uid

    const attemptsSnap = await firebaseAdminDb
      .collection('aptitudeAttempts')
      .where('userId', '==', userId)
      .get()

    const sectionStats: Record<string, SectionStats> = {}
    let totalQuestions = 0
    let totalCorrect = 0

    attemptsSnap.forEach(doc => {
      const data = doc.data() as any
      const breakdown = data.breakdown || {}
      Object.keys(breakdown).forEach(sec => {
        const stat = breakdown[sec] || {}
        const total = Number(stat.total || 0)
        const correct = Number(stat.correct || 0)
        if (!sectionStats[sec]) sectionStats[sec] = { total: 0, correct: 0 }
        sectionStats[sec].total += total
        sectionStats[sec].correct += correct
        totalQuestions += total
        totalCorrect += correct
      })
    })

    const accuracy = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    const sectionSummary = Object.keys(sectionStats).map(sec => {
      const stat = sectionStats[sec]
      const acc = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0
      return `${sec}: ${acc}% (${stat.correct}/${stat.total})`
    }).join(', ')

    const apiKey = process.env.GROQ_API_KEY
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
    const companyReadiness = buildCompanyReadiness(accuracy)
    const baseMeta = {
      accuracy,
      sectionSummary,
      model,
    }

    if (!apiKey) {
      return NextResponse.json({
        recommendations: buildFallback(sectionStats),
        companyReadiness,
        meta: { ...baseMeta, source: 'fallback', reason: 'missing_api_key' },
      })
    }

    const prompt = `You are an assistant that creates a study plan for placement prep.

User stats:
- Total accuracy: ${accuracy}%
- Section accuracy: ${sectionSummary || 'No attempts yet'}

  Return a JSON array (no markdown, no extra text) with 6 recommendations.
  Requirements:
  - Include 2 aptitude, 2 coding, and 2 core-subject recommendations.
  - Core subjects must be specific to OS, DBMS, and OOPS topics.
Each item must include:
- id (number 1-6)
  - type: aptitude | coding | core
- title (short)
- reason (1 sentence)
- difficulty: Easy | Medium | Hard
- est (e.g. "30 min")
- priority: critical | high | medium | low
- tags: 1-3 short tags

Keep them realistic for campus placement prep.`

    let llmData: any = null
    let llmStatus = 0
    try {
      const llmRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 512,
        }),
      })

      llmStatus = llmRes.status
      if (!llmRes.ok) {
        let errorBody = ''
        try {
          errorBody = await llmRes.text()
        } catch (readError) {
          errorBody = ''
        }
        return NextResponse.json({
          recommendations: buildFallback(sectionStats),
          companyReadiness,
          meta: { ...baseMeta, source: 'fallback', reason: `llm_status_${llmRes.status}`, llmError: errorBody || null },
        })
      }

      llmData = await llmRes.json()
    } catch (error: any) {
      return NextResponse.json({
        recommendations: buildFallback(sectionStats),
        companyReadiness,
        meta: { ...baseMeta, source: 'fallback', reason: 'llm_request_failed' },
      })
    }

    const text = llmData?.choices?.[0]?.message?.content || ''
    const parsed = safeJsonParse(text)

    if (!parsed) {
      return NextResponse.json({
        recommendations: buildFallback(sectionStats),
        companyReadiness,
        meta: { ...baseMeta, source: 'fallback', reason: 'invalid_json', llmStatus },
      })
    }

    return NextResponse.json({ recommendations: parsed, companyReadiness, meta: { ...baseMeta, source: 'llm' } })
  } catch (error: any) {
    return NextResponse.json({ recommendations: [], companyReadiness: [], meta: { source: 'error' } }, { status: 500 })
  }
}
