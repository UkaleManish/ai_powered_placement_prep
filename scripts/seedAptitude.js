const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  const text = fs.readFileSync(envPath, 'utf8')
  text.split(/\r?\n/).forEach(line => {
    if (!line || line.trim().startsWith('#')) return
    const idx = line.indexOf('=')
    if (idx === -1) return
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  })
}

loadEnvLocal()

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing Firebase admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.')
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })
}

const db = admin.firestore()

const questions = [
  {
    section: 'Quant',
    difficulty: 'Easy',
    question: 'The arithmetic mean of 5 consecutive integers starting with s is a. What is the arithmetic mean of 9 consecutive integers starting with s + 2?',
    options: ['A. a + 4', 'B. a + 6', 'C. a + 5', 'D. a + 2'],
    correct: 0,
    explanation: 'If 5 integers start at s, mean is s+2=a. For 9 integers starting at s+2, mean is (s+2)+4=a+4.',
  },
  {
    section: 'Quant',
    difficulty: 'Easy',
    question: 'A train travels at 60 km/h for the first half of the journey and 40 km/h for the second half. What is the average speed?',
    options: ['A. 48 km/h', 'B. 50 km/h', 'C. 52 km/h', 'D. 45 km/h'],
    correct: 0,
    explanation: 'Average speed is the harmonic mean: 2 * (60 * 40) / (60 + 40) = 48 km/h.',
  },
  {
    section: 'Verbal',
    difficulty: 'Easy',
    question: 'Choose the word most similar in meaning to EPHEMERAL:',
    options: ['A. Permanent', 'B. Transient', 'C. Substantial', 'D. Eternal'],
    correct: 1,
    explanation: 'Ephemeral means lasting for a very short time, similar to transient.',
  },
  {
    section: 'Verbal',
    difficulty: 'Easy',
    question: 'Find the odd one out: Manager, Director, Supervisor, Employee, Leader',
    options: ['A. Manager', 'B. Director', 'C. Employee', 'D. Leader'],
    correct: 2,
    explanation: 'All others are leadership roles; employee is a subordinate role.',
  },
  {
    section: 'Logical',
    difficulty: 'Easy',
    question: 'If all Bloops are Razzles, and all Razzles are Lazzles, then all Bloops are definitely:',
    options: ['A. Not Lazzles', 'B. Lazzles', 'C. Not Razzles', 'D. None of above'],
    correct: 1,
    explanation: 'Transitive property: Bloops -> Razzles -> Lazzles, so Bloops are Lazzles.',
  },
  {
    section: 'Logical',
    difficulty: 'Easy',
    question: 'In a row, Ravi is 7th from the left and 14th from the right. How many people are in the row?',
    options: ['A. 20', 'B. 21', 'C. 22', 'D. 19'],
    correct: 0,
    explanation: 'Total = 7 + 14 - 1 = 20.',
  },
  {
    section: 'Quant',
    difficulty: 'Medium',
    question: 'What is the compound interest on 8000 at 10% per annum for 2 years, compounded annually?',
    options: ['A. 1680', 'B. 1600', 'C. 1760', 'D. 1640'],
    correct: 0,
    explanation: 'CI = 8000 * (1.1)^2 - 8000 = 9680 - 8000 = 1680.',
  },
  {
    section: 'Verbal',
    difficulty: 'Medium',
    question: 'Select the correctly spelled word:',
    options: ['A. Accomodation', 'B. Accommodation', 'C. Accomadation', 'D. Acomodation'],
    correct: 1,
    explanation: 'The correct spelling is Accommodation.',
  },
  {
    section: 'Quant',
    difficulty: 'Medium',
    question: 'If the cost price is 20% less than the selling price, what is the profit percent?',
    options: ['A. 20%', 'B. 25%', 'C. 30%', 'D. 40%'],
    correct: 1,
    explanation: 'Let SP = 100, CP = 80, profit = 20, profit% = 20/80 = 25%.',
  },
  {
    section: 'Logical',
    difficulty: 'Medium',
    question: 'A is taller than B but shorter than C. D is shorter than B. Who is the tallest?',
    options: ['A. A', 'B. B', 'C. C', 'D. D'],
    correct: 2,
    explanation: 'C is taller than A, and A is taller than B and D. So C is tallest.',
  },
  {
    section: 'Verbal',
    difficulty: 'Medium',
    question: 'Choose the correct sentence:',
    options: ['A. She don’t like coffee.', 'B. She doesn’t likes coffee.', 'C. She doesn’t like coffee.', 'D. She don’t likes coffee.'],
    correct: 2,
    explanation: 'Correct form is “doesn’t like”.',
  },
  {
    section: 'Core',
    difficulty: 'Easy',
    question: 'Which of the following is NOT a necessary condition for deadlock in OS?',
    options: ['A. Mutual Exclusion', 'B. Hold and Wait', 'C. Preemption', 'D. Circular Wait'],
    correct: 2,
    explanation: 'Preemption breaks deadlock; the other three are necessary conditions.',
  },
  {
    section: 'Core',
    difficulty: 'Easy',
    question: 'Which normal form removes transitive dependency?',
    options: ['A. 1NF', 'B. 2NF', 'C. 3NF', 'D. BCNF'],
    correct: 2,
    explanation: '3NF removes transitive dependencies.',
  },
  {
    section: 'Core',
    difficulty: 'Medium',
    question: 'Which OOP principle allows one interface with multiple implementations?',
    options: ['A. Encapsulation', 'B. Inheritance', 'C. Polymorphism', 'D. Abstraction'],
    correct: 2,
    explanation: 'Polymorphism allows the same interface to represent different forms.',
  },
  {
    section: 'Core',
    difficulty: 'Medium',
    question: 'Which property of DBMS ensures that a transaction either fully completes or is rolled back?',
    options: ['A. Consistency', 'B. Atomicity', 'C. Isolation', 'D. Durability'],
    correct: 1,
    explanation: 'Atomicity ensures all-or-nothing execution.',
  },
  {
    section: 'Core',
    difficulty: 'Easy',
    question: 'Encapsulation is mainly used to:',
    options: ['A. Hide implementation details', 'B. Increase inheritance', 'C. Allow multiple classes', 'D. Improve compilation'],
    correct: 0,
    explanation: 'Encapsulation hides internal details using access control.',
  },
]

async function run() {
  const existingSnap = await db.collection('aptitudeQuestions').get()
  const existingQuestions = new Set(
    existingSnap.docs
      .map(doc => (doc.data()?.question || '').trim())
      .filter(Boolean),
  )

  const batch = db.batch()
  let added = 0
  questions.forEach(q => {
    const key = (q.question || '').trim()
    if (!key || existingQuestions.has(key)) return
    const ref = db.collection('aptitudeQuestions').doc()
    batch.set(ref, q)
    added += 1
  })

  if (added === 0) {
    console.log('No new aptitude questions to seed.')
    return
  }

  await batch.commit()
  console.log(`Seeded ${added} aptitude questions.`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
