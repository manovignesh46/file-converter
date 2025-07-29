import mongoose from 'mongoose'

const JobSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'error'],
    default: 'pending',
  },
  progress: {
    type: Number,
    default: 0,
  },
  message: {
    type: String,
    default: '',
  },
  operation: {
    type: String,
    required: true,
  },
  options: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  inputFiles: [{
    originalName: String,
    fileName: String,
    size: Number,
    mimeType: String,
  }],
  outputFiles: [{
    type: mongoose.Schema.Types.Mixed, // Allow both string and object formats for backward compatibility
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  error: String,
})

const FileHistorySchema = new mongoose.Schema({
  userId: String, // For future user system
  sessionId: String,
  originalName: String,
  processedName: String,
  operation: String,
  originalSize: Number,
  processedSize: Number,
  compressionRatio: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const Job = mongoose.models.Job || mongoose.model('Job', JobSchema)
export const FileHistory = mongoose.models.FileHistory || mongoose.model('FileHistory', FileHistorySchema)
