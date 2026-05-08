'use client'
import { useEffect, useRef, useState } from 'react'
import Topbar from '@/components/ui/Topbar'
import { Upload, FileText, CheckCircle, AlertCircle, Zap, Star, Target, TrendingUp, Download, RefreshCw, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { onAuthStateChanged } from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebaseClient'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

type Analysis = {
  atsScore: number
  overallScore: number
  sections: Record<string, { score: number; status: string; feedback: string }>
  skills: { found: string[]; missing: string[] }
  improvements: { priority: 'high' | 'medium' | 'low'; text: string }[]
  keywords: { matched: string[]; recommended: string[] }
  summary?: { wordCount?: number }
  source?: 'pdf' | 'ocr'
}

const priorityColor: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorDiagnostics, setErrorDiagnostics] = useState<any | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [userToken, setUserToken] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async user => {
      if (!user) {
        setUserToken(null)
        return
      }
      const token = await user.getIdToken()
      setUserToken(token)
    })
    return () => unsub()
  }, [])

  const handleFile = (f: File) => {
    const isPdfByType = (f.type || '').toLowerCase() === 'application/pdf'
    const isPdfByName = (f.name || '').toLowerCase().endsWith('.pdf')
    if (!isPdfByType && !isPdfByName) { toast.error('Please upload a PDF file'); return }
    if (f.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB'); return }
    setFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const analyzeResume = async () => {
    if (!file) { toast.error('Please upload a resume first'); return }
    if (!userToken) { toast.error('Please sign in to analyze'); return }
    setErrorMessage(null)
    setErrorDiagnostics(null)
    setAnalyzing(true)
    toast('Analyzing your resume with AI...', { icon: '🤖' })
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Failed to analyze resume')
        setErrorMessage(data?.error || 'Failed to analyze resume')
        setErrorDiagnostics(data?.diagnostics || null)
        setAnalyzing(false)
        return
      }

      setAnalysis(data)
      setErrorMessage(null)
      setErrorDiagnostics(null)
      toast.success('Analysis complete!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to analyze resume')
      setErrorMessage(err?.message || 'Failed to analyze resume')
    } finally {
      setAnalyzing(false)
    }
  }

  const scoreColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'

  const downloadReport = async () => {
    if (!analysis) {
      toast.error('No analysis available to download')
      return
    }
    const baseName = (file?.name || 'resume').replace(/\.pdf$/i, '')
    const payload = {
      fileName: file?.name || 'resume.pdf',
      analyzedAt: new Date().toISOString(),
      source: analysis.source || 'pdf',
      atsScore: analysis.atsScore,
      overallScore: analysis.overallScore,
      sections: analysis.sections,
      skills: analysis.skills,
      improvements: analysis.improvements,
      keywords: analysis.keywords,
      summary: analysis.summary || null,
    }

    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595, 842])
      const { width, height } = page.getSize()
      const margin = 48
      const lineHeight = 16
      const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      let y = height - margin

      const drawLine = (text: string, font = bodyFont, size = 11, color = rgb(0.1, 0.12, 0.18)) => {
        page.drawText(text, { x: margin, y, size, font, color })
        y -= lineHeight
      }

      const wrapText = (text: string, font = bodyFont, size = 11, maxWidth = width - margin * 2) => {
        const words = text.split(' ')
        let line = ''
        const lines = [] as string[]
        for (const word of words) {
          const test = line ? `${line} ${word}` : word
          const testWidth = font.widthOfTextAtSize(test, size)
          if (testWidth > maxWidth && line) {
            lines.push(line)
            line = word
          } else {
            line = test
          }
        }
        if (line) lines.push(line)
        return lines
      }

      page.drawText('Placement Prep - Resume Report', {
        x: margin,
        y,
        size: 18,
        font: titleFont,
        color: rgb(0.16, 0.33, 0.8),
      })
      y -= 22
      drawLine(`File: ${payload.fileName}`)
      drawLine(`Analyzed: ${new Date(payload.analyzedAt).toLocaleString()}`)
      drawLine(`Source: ${payload.source.toUpperCase()}`)
      y -= 10

      page.drawText('Scores', { x: margin, y, size: 14, font: titleFont, color: rgb(0.1, 0.12, 0.18) })
      y -= 18
      drawLine(`ATS Score: ${payload.atsScore}%`)
      drawLine(`Overall Score: ${payload.overallScore}%`)
      y -= 8

      page.drawText('Section Analysis', { x: margin, y, size: 14, font: titleFont, color: rgb(0.1, 0.12, 0.18) })
      y -= 18
      Object.entries(payload.sections || {}).forEach(([key, val]) => {
        drawLine(`${key}: ${val.score}% - ${val.feedback}`)
      })
      y -= 8

      page.drawText('Skills', { x: margin, y, size: 14, font: titleFont, color: rgb(0.1, 0.12, 0.18) })
      y -= 18
      drawLine(`Found: ${(payload.skills?.found || []).join(', ') || 'None'}`)
      drawLine(`Missing: ${(payload.skills?.missing || []).join(', ') || 'None'}`)
      y -= 8

      page.drawText('Improvements', { x: margin, y, size: 14, font: titleFont, color: rgb(0.1, 0.12, 0.18) })
      y -= 18
      ;(payload.improvements || []).forEach((imp) => {
        const lines = wrapText(`- (${imp.priority}) ${imp.text}`)
        lines.forEach(line => drawLine(line))
      })
      y -= 8

      page.drawText('Keywords', { x: margin, y, size: 14, font: titleFont, color: rgb(0.1, 0.12, 0.18) })
      y -= 18
      drawLine(`Matched: ${(payload.keywords?.matched || []).join(', ') || 'None'}`)
      drawLine(`Recommended: ${(payload.keywords?.recommended || []).join(', ') || 'None'}`)
      y -= 8

      if (payload.summary?.wordCount) {
        drawLine(`Word count: ${payload.summary.wordCount}`)
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${baseName}-analysis.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate PDF')
    }
  }

  return (
    <div>
      <Topbar title="AI Resume Analyzer" subtitle="Get ATS score and personalized feedback" />
      <div style={{ padding: '28px' }}>

        {!analysis ? (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Tip: this works best with text-based PDFs (you can select/copy the text). Scanned PDFs will use PaddleOCR if configured.
                  </p>
            {/* Upload Area */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#6366f1' : file ? '#10b981' : 'var(--border-hover)'}`,
                borderRadius: '20px', padding: '60px 40px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'rgba(99,102,241,0.05)' : file ? 'rgba(16,185,129,0.05)' : 'rgba(148,163,184,0.03)',
                transition: 'all 0.2s ease', marginBottom: '24px',
              }}>
              <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {file ? (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <FileText size={32} style={{ color: '#10b981' }} />
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{file.name}</p>
                  <p style={{ fontSize: '14px', color: '#34d399' }}>✓ Ready to analyze — {(file.size / 1024).toFixed(0)} KB</p>
                </>
              ) : (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Upload size={32} style={{ color: '#a78bfa' }} />
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Drop your resume here</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>or click to browse files</p>
                  <span className="badge badge-purple">PDF only · Max 5MB</span>
                </>
              )}
            </div>

            <button onClick={analyzeResume} disabled={!file || analyzing}
              className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '16px', borderRadius: '14px', opacity: !file ? 0.5 : 1 }}>
              {analyzing ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing with AI...</>
              ) : (
                <><Zap size={20} fill="white" />Analyze Resume</>
              )}
            </button>

            {errorMessage && (
              <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>OCR Error</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: errorDiagnostics ? '8px' : 0 }}>{errorMessage}</div>
                {errorDiagnostics && (
                  <pre style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'rgba(15,23,42,0.35)', padding: '10px', borderRadius: '8px', overflowX: 'auto' }}>
{JSON.stringify(errorDiagnostics, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {analyzing && (
              <div style={{ marginTop: '24px', padding: '20px', borderRadius: '14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                {['Parsing PDF content...', 'Extracting skills & keywords...', 'Calculating ATS compatibility...', 'Generating personalized feedback...'].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 3 ? '10px' : 0 }}>
                    <div className="w-4 h-4 border border-indigo-400 border-t-transparent rounded-full animate-spin" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Score Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { label: 'ATS Score', value: analysis.atsScore, icon: Target, desc: 'Applicant Tracking System' },
                { label: 'Overall Score', value: analysis.overallScore, icon: Star, desc: 'Human reviewer rating' },
                { label: 'Improvement', value: '+18pts', icon: TrendingUp, desc: 'Potential after fixes', isText: true },
              ].map((s, i) => (
                <div key={i} className="card animate-fade-in-up" style={{ opacity: 0, animationDelay: `${i*0.1}s`, padding: '24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <s.icon size={28} style={{ color: s.isText ? '#10b981' : scoreColor(s.value as number) }} />
                  </div>
                  <div style={{ fontSize: '40px', fontWeight: 900, fontFamily: 'Plus Jakarta Sans', color: s.isText ? '#34d399' : scoreColor(s.value as number), marginBottom: '4px' }}>
                    {s.isText ? s.value : `${s.value}%`}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Section Scores */}
              <div className="card animate-fade-in-up delay-200" style={{ opacity: 0, padding: '24px' }}>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>Section Analysis</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(analysis.sections).map(([key, val]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{key}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: scoreColor(val.score) }}>{val.score}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${val.score}%`, background: scoreColor(val.score) }} />
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{val.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="card animate-fade-in-up delay-300" style={{ opacity: 0, padding: '24px' }}>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px' }}>Skills Analysis</h3>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#34d399', marginBottom: '8px' }}>✓ Found in Resume</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {analysis.skills.found.map(s => (
                      <span key={s} style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 500, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#f87171', marginBottom: '8px' }}>✗ Missing Key Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {analysis.skills.missing.map(s => (
                      <span key={s} style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 500, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Improvements */}
            <div className="card animate-fade-in-up delay-400" style={{ opacity: 0, padding: '24px' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
                🤖 AI Improvement Suggestions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {analysis.improvements.map((imp, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderRadius: '10px', border: `1px solid ${priorityColor[imp.priority]}30`, background: `${priorityColor[imp.priority]}08`, display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <AlertCircle size={16} style={{ color: priorityColor[imp.priority], flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: priorityColor[imp.priority], textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>{imp.priority} priority</span>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{imp.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setAnalysis(null); setFile(null) }} className="btn btn-secondary">
                <RefreshCw size={16} /> Analyze Another
              </button>
              <button onClick={downloadReport} className="btn btn-primary">
                <Download size={16} /> Download Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
