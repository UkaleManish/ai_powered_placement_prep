import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  college: { type: String, default: '' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  avatar: { type: String, default: '' },
  stats: {
    testsAttempted: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
