'use client'
import { useEffect, useMemo, useState } from 'react'
import Topbar from '@/components/ui/Topbar'
import dynamic from 'next/dynamic'
import { Play, RotateCcw, CheckCircle, XCircle, Code2, ChevronRight, Clock, Star, Filter, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { collection, getDocs } from 'firebase/firestore/lite'
import { firebaseDb } from '@/lib/firebaseClient'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

type CodingQuestion = {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  tags: string[]
  acceptance?: string
  description: string
  examples: { input: string; output: string; explanation: string }[]
  inputFormat?: string
  outputFormat?: string
  starterCode: { python: string; javascript: string; cpp: string }
  testCases: { input: string; output: string }[]
}

const difficultyColor: Record<string, string> = {
  Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444'
}

export default function CodingPage() {
  const [questions, setQuestions] = useState<CodingQuestion[]>([])
  const [selected, setSelected] = useState<CodingQuestion | null>(null)
  const [lang, setLang] = useState<'python'>('python')
  const [code, setCode] = useState<Record<string, Record<string, string>>>({})
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [tab, setTab] = useState<'description' | 'solution' | 'submissions'>('description')
  const [filterDiff, setFilterDiff] = useState('All')
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true)
      try {
        const snap = await getDocs(collection(firebaseDb, 'codingQuestions'))
        const next = snap.docs.map(docSnap => {
          const data = docSnap.data() as any
          return {
            id: docSnap.id,
            title: data.title || 'Untitled',
            difficulty: data.difficulty || 'Easy',
            tags: Array.isArray(data.tags) ? data.tags : [],
            acceptance: data.acceptance || '',
            description: data.description || '',
            examples: Array.isArray(data.examples) ? data.examples : [],
            inputFormat: data.inputFormat || '',
            outputFormat: data.outputFormat || '',
            starterCode: data.starterCode || { python: '', javascript: '', cpp: '' },
            testCases: Array.isArray(data.testCases) ? data.testCases : [],
          } as CodingQuestion
        })
        setQuestions(next)
        setSelected(next[0] || null)
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load questions')
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [])

  const getCode = () => {
    if (!selected) return ''
    return code[selected.id]?.[lang] || selected.starterCode[lang] || ''
  }
  const setCurrentCode = (val: string) => {
    if (!selected) return
    setCode(prev => ({ ...prev, [selected.id]: { ...(prev[selected.id] || {}), [lang]: val } }))
  }

  const runCode = async () => {
    if (!selected) return
    if (!getCode().trim()) { toast.error('Write some code first!'); return }
    setRunning(true)
    try {
      const res = await fetch('/api/coding/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: lang,
          source: getCode(),
          tests: selected.testCases,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Failed to execute code')
        setResults([])
        return
      }
      const nextResults = Array.isArray(data.results) ? data.results : []
      setResults(nextResults)
      const passed = nextResults.filter((r: any) => r.passed).length
      if (passed === nextResults.length && nextResults.length > 0) {
        toast.success(`All ${passed} test cases passed! 🎉`)
        setSolvedIds(prev => new Set(prev).add(selected.id))
      } else {
        toast.error(`${nextResults.length - passed} test case(s) failed`)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to execute code')
    }
    setRunning(false)
  }

  const filtered = useMemo(() => {
    return filterDiff === 'All' ? questions : questions.filter(p => p.difficulty === filterDiff)
  }, [filterDiff, questions])

  if (loading) {
    return (
      <div>
        <Topbar title="Coding Practice" subtitle="Solve DSA problems with AI hints" />
        <div style={{ padding: '28px' }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading coding questions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div>
        <Topbar title="Coding Practice" subtitle="Solve DSA problems with AI hints" />
        <div style={{ padding: '28px' }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No coding questions found. Seed the data first.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Topbar title="Coding Practice" subtitle="Solve DSA problems with AI hints" />
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Problem List */}
        <div style={{ width: '280px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                <button key={d} onClick={() => setFilterDiff(d)}
                  style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', background: filterDiff === d ? (d === 'All' ? '#3b82f6' : difficultyColor[d]) : 'rgba(148,163,184,0.08)', color: filterDiff === d ? 'white' : 'var(--text-secondary)', fontFamily: 'Sora', transition: 'all 0.15s' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filtered.map((p, idx) => (
              <div key={p.id} onClick={() => setSelected(p)}
                style={{ padding: '12px', borderRadius: '10px', cursor: 'pointer', marginBottom: '4px', border: `1px solid ${selected.id === p.id ? 'rgba(59,130,246,0.3)' : 'transparent'}`, background: selected.id === p.id ? 'rgba(59,130,246,0.08)' : 'transparent', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (selected.id !== p.id) (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.05)' }}
                onMouseLeave={e => { if (selected.id !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: selected.id === p.id ? '#60a5fa' : 'var(--text-primary)' }}>{idx + 1}. {p.title}</span>
                  {solvedIds.has(p.id) && <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: difficultyColor[p.difficulty], fontWeight: 600 }}>{p.difficulty}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>· {p.acceptance || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {p.tags.slice(0, 2).map(t => (
                    <span key={t} className="tag" style={{ fontSize: '10px', padding: '2px 6px' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Problem + Editor */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Problem Panel */}
          <div style={{ width: '380px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
              {(['description', 'solution', 'submissions'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: '14px 12px', fontSize: '13px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: tab === t ? '#60a5fa' : 'var(--text-muted)', borderBottom: `2px solid ${tab === t ? '#3b82f6' : 'transparent'}`, fontFamily: 'Sora', textTransform: 'capitalize', transition: 'color 0.15s' }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {tab === 'description' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>{selected.title}</h2>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: difficultyColor[selected.difficulty], background: `${difficultyColor[selected.difficulty]}15`, padding: '3px 10px', borderRadius: '99px' }}>{selected.difficulty}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
                    {selected.tags.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '16px' }}>{selected.description}</p>
                  {(selected.inputFormat || selected.outputFormat) && (
                    <div style={{ background: 'rgba(148,163,184,0.05)', borderRadius: '10px', padding: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                      {selected.inputFormat && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <span style={{ color: '#60a5fa', fontWeight: 600 }}>Input:</span> {selected.inputFormat}
                        </p>
                      )}
                      {selected.outputFormat && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          <span style={{ color: '#34d399', fontWeight: 600 }}>Output:</span> {selected.outputFormat}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Examples:</p>
                    {selected.examples.map((ex, i) => (
                      <div key={i} style={{ background: 'rgba(148,163,184,0.05)', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}><span style={{ color: '#60a5fa', fontWeight: 600 }}>Input:</span> {ex.input}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}><span style={{ color: '#34d399', fontWeight: 600 }}>Output:</span> {ex.output}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}><span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Explanation:</span> {ex.explanation}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {tab === 'solution' && (
                <div>
                  <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
                    <Zap size={32} style={{ color: '#a78bfa', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Solve the problem first, then unlock the AI solution.</p>
                    <button onClick={() => toast('AI solution feature available with OpenAI key')} className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 20px' }}>
                      <Zap size={14} /> Get AI Solution
                    </button>
                  </div>
                </div>
              )}
              {tab === 'submissions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {results.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>No submissions yet. Run your code!</p>
                  ) : results.map((r, i) => (
                    <div key={i} style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${r.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, background: r.passed ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {r.passed ? <CheckCircle size={14} style={{ color: '#10b981' }} /> : <XCircle size={14} style={{ color: '#ef4444' }} />}
                        <span style={{ fontSize: '13px', fontWeight: 600, color: r.passed ? '#34d399' : '#f87171' }}>Test Case {i + 1}: {r.passed ? 'Passed' : 'Failed'}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>Input: {r.input}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>Expected: {r.expected} | Got: {r.got}</p>
                      {r.stderr && (
                        <p style={{ fontSize: '12px', color: '#f87171', fontFamily: 'JetBrains Mono' }}>Error ({r.phase || 'run'}): {r.stderr}</p>
                      )}
                      {r.exitCode !== undefined && r.exitCode !== 0 && (
                        <p style={{ fontSize: '12px', color: '#f87171', fontFamily: 'JetBrains Mono' }}>Exit code: {r.exitCode}</p>
                      )}
                      {r.debug && (
                        <pre style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(15,23,42,0.35)', padding: '10px', borderRadius: '8px', overflowX: 'auto' }}>
{JSON.stringify(r.debug, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Code Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Editor Toolbar */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15,23,42,0.5)' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['python', 'javascript', 'cpp'] as const).map(l => {
                  const disabled = l !== 'python'
                  return (
                    <button key={l} onClick={() => !disabled && setLang('python')}
                      disabled={disabled}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        border: lang === l ? 'none' : '1px solid var(--border)',
                        background: lang === l ? 'rgba(59,130,246,0.2)' : 'transparent',
                        color: disabled ? 'rgba(148,163,184,0.4)' : (lang === l ? '#60a5fa' : 'var(--text-muted)'),
                        fontFamily: 'JetBrains Mono',
                        transition: 'all 0.15s',
                        opacity: disabled ? 0.6 : 1,
                      }}>
                      {l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setCurrentCode(selected.starterCode[lang])}
                  style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Sora', transition: 'all 0.15s' }}>
                  <RotateCcw size={13} /> Reset
                </button>
                <button onClick={runCode} disabled={running}
                  style={{ padding: '6px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', border: 'none', background: 'linear-gradient(135deg, #10b981, #14b8a6)', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Sora', opacity: running ? 0.7 : 1, transition: 'all 0.15s' }}>
                  {running ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Play size={13} fill="white" />}
                  {running ? 'Running...' : 'Run Code'}
                </button>
              </div>
            </div>

            {/* Monaco */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <MonacoEditor
                height="100%"
                language={lang === 'cpp' ? 'cpp' : lang}
                theme="vs-dark"
                value={getCode()}
                onChange={(val) => setCurrentCode(val || '')}
                options={{
                  fontSize: 14, fontFamily: 'JetBrains Mono', minimap: { enabled: false },
                  lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on',
                  padding: { top: 16, bottom: 16 }, smoothScrolling: true,
                  cursorBlinking: 'smooth', bracketPairColorization: { enabled: true },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
