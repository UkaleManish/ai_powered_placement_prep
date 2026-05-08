import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

export const runtime = 'nodejs'

type TestCase = { input: string; output: string }

function normalize(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

async function runPython(source: string, input: string) {
  const python = process.env.PYTHON_EXECUTABLE || 'python'
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'coding-run-'))
  const filePath = path.join(tempDir, 'solution.py')

  try {
    await fs.writeFile(filePath, source, 'utf8')

    const { stdout, stderr, exitCode } = await new Promise<{ stdout: string; stderr: string; exitCode: number | null }>((resolve) => {
      const child = spawn(python, [filePath], { stdio: 'pipe' })
      let out = ''
      let err = ''

      child.stdout.on('data', chunk => { out += chunk.toString() })
      child.stderr.on('data', chunk => { err += chunk.toString() })
      child.on('error', () => resolve({ stdout: out, stderr: err || 'Failed to start Python', exitCode: 1 }))
      child.on('close', code => resolve({ stdout: out, stderr: err, exitCode: code }))

      if (input) {
        child.stdin.write(input)
      }
      child.stdin.end()
    })

    return { stdout, stderr, exitCode: exitCode ?? 1 }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const language = body?.language
    const source = body?.source
    const tests = Array.isArray(body?.tests) ? body.tests : []

    if (!language || !source) {
      return NextResponse.json({ error: 'Missing language or source' }, { status: 400 })
    }

    if (language !== 'python') {
      return NextResponse.json({ error: 'Only Python execution is supported on this machine' }, { status: 400 })
    }

    if (!tests.length) {
      return NextResponse.json({ error: 'No test cases provided' }, { status: 400 })
    }

    const results = [] as any[]
    for (const test of tests as TestCase[]) {
      const exec = await runPython(source, test.input || '')
      const passed = normalize(exec.stdout) === normalize(test.output || '') && exec.exitCode === 0 && !exec.stderr
      results.push({
        input: test.input,
        expected: test.output,
        got: exec.stdout,
        passed,
        stderr: exec.stderr || null,
        exitCode: exec.exitCode,
        phase: 'run',
      })
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to execute code' }, { status: 500 })
  }
}
