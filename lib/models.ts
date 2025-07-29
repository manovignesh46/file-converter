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
  outputFiles: [String],
  storedFiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessedFile'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  error: String,
})

const ProcessedFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
  operation: {
    type: String,
    required: true,
  },
  jobId: {
    type: String,
    required: true,
  },
  sessionId: String,
  metadata: {
    originalSize: Number,
    compressionRatio: Number,
    dimensions: {
      width: Number,
      height: Number,
    },
    format: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours (TTL index)
  },
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
export const ProcessedFile = mongoose.models.ProcessedFile || mongoose.model('ProcessedFile', ProcessedFileSchema)
export const FileHistory = mongoose.models.FileHistory || mongoose.model('FileHistory', FileHistorySchema)
