import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export const runtime = 'nodejs'

export async function GET() {
  const python = process.env.PADDLEOCR_PYTHON || 'python'
  const scriptPath = path.join(process.cwd(), 'scripts', 'ocr_paddle.py')

  const result = await new Promise<{ stdout: string; stderr: string; exitCode: number | null; error: string | null }>((resolve) => {
    const child = spawn(python, [scriptPath, '--check'], {
      env: { ...process.env },
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
    payload = result.stdout ? JSON.parse(result.stdout) : null
  } catch (parseError) {
    payload = null
  }

  if (result.exitCode !== 0 || !payload || payload?.error || result.error) {
    return NextResponse.json(
      {
        ok: false,
        error: payload?.error || result.error || 'paddleocr_check_failed',
        diagnostics: {
          python,
          scriptPath,
          exitCode: result.exitCode,
          stderr: result.stderr || null,
        },
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, details: payload })
}
