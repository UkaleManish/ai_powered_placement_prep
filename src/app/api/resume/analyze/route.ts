import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'
import { spawn } from 'child_process'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'

export const runtime = 'nodejs'

const SKILLS = [
  'python', 'javascript', 'typescript', 'react', 'node.js', 'express', 'mongodb', 'sql', 'postgres',
  'docker', 'aws', 'gcp', 'azure', 'kubernetes', 'git', 'rest', 'api', 'system design', 'data structures',
  'algorithms', 'linux', 'html', 'css', 'tailwind', 'next.js', 'java', 'c++', 'oop', 'testing',
]

const SECTION_KEYWORDS: Record<string, string[]> = {
  contact: ['email', 'phone', 'linkedin', 'github'],
  summary: ['summary', 'objective', 'profile'],
  experience: ['experience', 'internship', 'work history', 'employment'],
  skills: ['skills', 'technologies', 'tools'],
  education: ['education', 'degree', 'university', 'college'],
  projects: ['projects', 'project'],
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function scoreSection(text: string, key: string) {
  const keywords = SECTION_KEYWORDS[key]
  const hasSection = keywords.some(k => text.includes(k))
  if (!hasSection) return { score: 45, status: 'warning', feedback: `Add a ${key} section for better clarity.` }

  const wordCount = text.split(/\s+/).length
  const score = clamp(65 + Math.min(25, Math.floor(wordCount / 120)), 55, 95)
  const status = score >= 80 ? 'good' : score >= 60 ? 'ok' : 'warning'
  const feedback = status === 'good'
    ? `${key} section is present and well structured.`
    : `Improve your ${key} section with clearer details and impact.`
  return { score, status, feedback }
}

function findSkills(text: string) {
  const found = SKILLS.filter(skill => text.includes(skill))
  const missing = SKILLS.filter(skill => !text.includes(skill))
  return { found, missing }
}

function buildImprovements(text: string, missing: string[]) {
  const improvements = [] as { priority: 'high' | 'medium' | 'low'; text: string }[]
  const hasNumbers = /\d+/.test(text)

  if (!hasNumbers) {
    improvements.push({ priority: 'high', text: 'Add quantifiable achievements (e.g., "improved latency by 30%").' })
  }

  if (missing.includes('typescript')) {
    improvements.push({ priority: 'high', text: 'Add TypeScript if you have used it in projects.' })
  }

  if (missing.includes('docker')) {
    improvements.push({ priority: 'medium', text: 'Mention Docker or deployment tooling if applicable.' })
  }

  if (missing.includes('system design')) {
    improvements.push({ priority: 'medium', text: 'Add System Design familiarity in skills or projects.' })
  }

  improvements.push({ priority: 'low', text: 'Use stronger action verbs like "designed", "optimized", "engineered".' })
  improvements.push({ priority: 'low', text: 'Ensure each project lists tech stack and measurable impact.' })

  return improvements.slice(0, 6)
}

async function extractTextWithPaddleOcr(buffer: Buffer, fileName: string) {
  const python = process.env.PADDLEOCR_PYTHON || 'python'
  const lang = process.env.PADDLEOCR_LANG || 'en'
  const scriptPath = path.join(process.cwd(), 'scripts', 'ocr_paddle.py')
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'paddle-ocr-'))
  const pdfPath = path.join(tempDir, fileName.toLowerCase().endsWith('.pdf') ? fileName : 'resume.pdf')

  try {
    await fs.writeFile(pdfPath, buffer)

    const { stdout, stderr, exitCode, error } = await new Promise<{
      stdout: string
      stderr: string
      exitCode: number | null
      error: string | null
    }>((resolve) => {
      const child = spawn(python, [scriptPath, pdfPath, lang], {
        env: { ...process.env, PADDLEOCR_LANG: lang },
      })

      let out = ''
      let err = ''

      child.stdout.on('data', chunk => { out += chunk.toString() })
      child.stderr.on('data', chunk => { err += chunk.toString() })
      child.on('error', (spawnError) => {
        resolve({ stdout: out, stderr: err, exitCode: null, error: spawnError?.message || 'spawn_failed' })
      })
      child.on('close', code => {
        resolve({ stdout: out, stderr: err, exitCode: code, error: null })
      })
    })

    let payload: any = null
    try {
      payload = stdout ? JSON.parse(stdout) : null
    } catch (parseError) {
      payload = null
    }

    if (!payload || payload?.error) {
      return {
        text: '',
        error: payload?.error || error || 'paddleocr_failed',
        diagnostics: {
          python,
          scriptPath,
          lang,
          exitCode,
          stderr: stderr || null,
        },
      }
    }

    return {
      text: (payload.text || '').replace(/\s+/g, ' ').trim(),
      error: null,
      diagnostics: {
        python,
        scriptPath,
        lang,
        exitCode,
        pages: payload?.pages ?? null,
        stderr: stderr || null,
      },
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const fileName = typeof file.name === 'string' ? file.name : 'resume.pdf'
    const isPdfByType = (file.type || '').toLowerCase() === 'application/pdf'
    const isPdfByName = fileName.toLowerCase().endsWith('.pdf')
    if (!isPdfByType && !isPdfByName) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await pdfParse(buffer)
    let rawText = (parsed.text || '').replace(/\s+/g, ' ').trim()
    let ocrUsed = false

    if (!rawText) {
      const ocr = await extractTextWithPaddleOcr(buffer, fileName)
      if (ocr.text) {
        rawText = ocr.text
        ocrUsed = true
      } else {
        const diagnostics = {
          name: fileName,
          type: file.type || null,
          size: file.size,
          textLength: rawText.length,
          numpages: (parsed as any)?.numpages ?? null,
          version: (parsed as any)?.version ?? null,
          info: (parsed as any)?.info ?? null,
          ocr,
        }
        console.warn('[resume-analyze] empty text extraction', diagnostics)
        const baseError = 'Could not extract text from this PDF. It likely has no selectable text (scanned/image-only) or is protected.'
        const ocrHint = ocr.error
          ? ` PaddleOCR failed: ${ocr.error}. Make sure Python + PaddleOCR are installed.`
          : ' PaddleOCR did not return any text. Try a clearer scan or a text-based PDF.'
        return NextResponse.json({ error: `${baseError}${ocrHint}`, diagnostics }, { status: 400 })
      }
    }

    const text = rawText.toLowerCase()
    const skills = findSkills(text)

    const sections = {
      contact: scoreSection(text, 'contact'),
      summary: scoreSection(text, 'summary'),
      experience: scoreSection(text, 'experience'),
      skills: scoreSection(text, 'skills'),
      education: scoreSection(text, 'education'),
      projects: scoreSection(text, 'projects'),
    }

    const sectionScores = Object.values(sections).map(s => s.score)
    const overallScore = clamp(Math.round(sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length), 50, 95)

    const atsBase = clamp(50 + Math.round((skills.found.length / SKILLS.length) * 40), 50, 90)
    const atsScore = clamp(atsBase + (sections.contact.score > 70 ? 5 : 0), 50, 95)

    const improvements = buildImprovements(text, skills.missing)

    const keywords = {
      matched: skills.found.slice(0, 8),
      recommended: skills.missing.slice(0, 6),
    }

    return NextResponse.json({
      atsScore,
      overallScore,
      source: ocrUsed ? 'ocr' : 'pdf',
      sections,
      skills: {
        found: skills.found.slice(0, 12),
        missing: skills.missing.slice(0, 12),
      },
      improvements,
      keywords,
      summary: { wordCount: rawText.split(/\s+/).length },
    })
  } catch (error: any) {
    console.error('[resume-analyze] failed', error)
    return NextResponse.json(
      { error: error?.message ? `Failed to analyze resume: ${error.message}` : 'Failed to analyze resume' },
      { status: 500 },
    )
  }
}
