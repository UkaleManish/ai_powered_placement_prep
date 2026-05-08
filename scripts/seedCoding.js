require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })
const admin = require('firebase-admin')

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

const db = admin.firestore()

const questions = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    acceptance: '49%',
    description: 'Given an array of integers and a target, return indices of the two numbers that add up to the target.',
    examples: [
      {
        input: 'n=4\nnums=2 7 11 15\ntarget=9',
        output: '0 1',
        explanation: 'nums[0] + nums[1] == 9',
      },
    ],
    inputFormat: 'First line: n. Second line: n integers. Third line: target.',
    outputFormat: 'Two indices separated by space.',
    starterCode: {
      python: "import sys\n\nparts = sys.stdin.read().strip().split()\nif not parts:\n    sys.exit(0)\n\nn = int(parts[0])\nnums = list(map(int, parts[1:1+n]))\ntarget = int(parts[1+n])\n\nseen = {}\nfor i, val in enumerate(nums):\n    need = target - val\n    if need in seen:\n        print(seen[need], i)\n        break\n    seen[val] = i\n",
      javascript: "const fs = require('fs');\nconst parts = fs.readFileSync(0,'utf8').trim().split(/\\s+/);\nif (!parts[0]) process.exit(0);\nconst n = Number(parts[0]);\nconst nums = parts.slice(1, 1 + n).map(Number);\nconst target = Number(parts[1 + n]);\nconst seen = new Map();\nfor (let i = 0; i < nums.length; i++) {\n  const need = target - nums[i];\n  if (seen.has(need)) {\n    console.log(seen.get(need) + ' ' + i);\n    break;\n  }\n  seen.set(nums[i], i);\n}\n",
        cpp: `#include <bits/stdc++.h>
    using namespace std;

    int main() {
      ios::sync_with_stdio(false);
      cin.tie(nullptr);

      int n;
      if (!(cin >> n)) return 0;
      vector<int> nums(n);
      for (int i = 0; i < n; i++) cin >> nums[i];
      int target;
      cin >> target;

      unordered_map<int,int> seen;
      for (int i = 0; i < n; i++) {
        int need = target - nums[i];
        if (seen.count(need)) {
          cout << seen[need] << " " << i;
          break;
        }
        seen[nums[i]] = i;
      }
      return 0;
    }
    `,
    },
    testCases: [
      { input: '4\n2 7 11 15\n9', output: '0 1' },
      { input: '3\n3 2 4\n6', output: '1 2' },
      { input: '2\n3 3\n6', output: '0 1' },
    ],
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['Stack', 'String'],
    acceptance: '41%',
    description: 'Given a string containing just the characters (){}[], determine if the input string is valid.',
    examples: [
      {
        input: 's=()[]{}',
        output: 'true',
        explanation: 'All brackets are properly closed.',
      },
    ],
    inputFormat: 'Single line string.',
    outputFormat: 'true or false',
    starterCode: {
      python: "import sys\n\ns = sys.stdin.read().strip()\nstack = []\nmatch = {')':'(', ']':'[', '}':'{'}\nvalid = True\nfor ch in s:\n    if ch in '([{':\n        stack.append(ch)\n    elif ch in match:\n        if not stack or stack[-1] != match[ch]:\n            valid = False\n            break\n        stack.pop()\nprint('true' if valid and not stack else 'false')\n",
      javascript: "const fs = require('fs');\nconst s = fs.readFileSync(0,'utf8').trim();\nconst stack = [];\nconst match = {')':'(', ']':'[', '}':'{'};\nlet valid = true;\nfor (const ch of s) {\n  if ('([{'.includes(ch)) stack.push(ch);\n  else if (match[ch]) {\n    if (!stack.length || stack[stack.length - 1] !== match[ch]) { valid = false; break; }\n    stack.pop();\n  }\n}\nconsole.log(valid && stack.length === 0 ? 'true' : 'false');\n",
        cpp: `#include <bits/stdc++.h>
    using namespace std;

    int main(){
      ios::sync_with_stdio(false);
      cin.tie(nullptr);

      string s;
      if (!getline(cin, s)) return 0;
      vector<char> st;
      unordered_map<char,char> match{{')','('},{']','['},{'}','{'}};
      bool valid = true;
      for (char ch : s) {
        if (ch=='(' || ch=='[' || ch=='{') st.push_back(ch);
        else if (match.count(ch)) {
          if (st.empty() || st.back() != match[ch]) { valid = false; break; }
          st.pop_back();
        }
      }
      cout << (valid && st.empty() ? "true" : "false");
      return 0;
    }
    `,
    },
    testCases: [
      { input: '()[]{}', output: 'true' },
      { input: '(]', output: 'false' },
      { input: '([{}])', output: 'true' },
    ],
  },
  {
    title: 'Binary Search',
    difficulty: 'Easy',
    tags: ['Binary Search', 'Array'],
    acceptance: '55%',
    description: 'Given a sorted array and a target, return the index of the target or -1 if not found.',
    examples: [
      {
        input: 'n=6\nnums=-1 0 3 5 9 12\ntarget=9',
        output: '4',
        explanation: '9 exists at index 4',
      },
    ],
    inputFormat: 'First line: n. Second line: n integers. Third line: target.',
    outputFormat: 'Index of target or -1.',
    starterCode: {
      python: "import sys\n\nparts = sys.stdin.read().strip().split()\nif not parts:\n    sys.exit(0)\n\nn = int(parts[0])\nnums = list(map(int, parts[1:1+n]))\ntarget = int(parts[1+n])\n\nleft, right = 0, n - 1\nans = -1\nwhile left <= right:\n    mid = (left + right) // 2\n    if nums[mid] == target:\n        ans = mid\n        break\n    if nums[mid] < target:\n        left = mid + 1\n    else:\n        right = mid - 1\nprint(ans)\n",
      javascript: "const fs = require('fs');\nconst parts = fs.readFileSync(0,'utf8').trim().split(/\\s+/);\nif (!parts[0]) process.exit(0);\nconst n = Number(parts[0]);\nconst nums = parts.slice(1, 1 + n).map(Number);\nconst target = Number(parts[1 + n]);\nlet left = 0, right = n - 1, ans = -1;\nwhile (left <= right) {\n  const mid = Math.floor((left + right) / 2);\n  if (nums[mid] === target) { ans = mid; break; }\n  if (nums[mid] < target) left = mid + 1; else right = mid - 1;\n}\nconsole.log(ans);\n",
      cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    int target;\n    cin >> target;\n\n    int left = 0, right = n - 1, ans = -1;\n    while (left <= right) {\n        int mid = (left + right) / 2;\n        if (nums[mid] == target) { ans = mid; break; }\n        if (nums[mid] < target) left = mid + 1; else right = mid - 1;\n    }\n    cout << ans;\n    return 0;\n}\n",
    },
    testCases: [
      { input: '6\n-1 0 3 5 9 12\n9', output: '4' },
      { input: '6\n-1 0 3 5 9 12\n2', output: '-1' },
    ],
  },
]

async function seed() {
  const snapshot = await db.collection('codingQuestions').limit(1).get()
  if (!snapshot.empty) {
    console.log('codingQuestions already seeded')
    return
  }

  const batch = db.batch()
  questions.forEach((q) => {
    const ref = db.collection('codingQuestions').doc()
    batch.set(ref, {
      ...q,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  })

  await batch.commit()
  console.log('codingQuestions seeded')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
