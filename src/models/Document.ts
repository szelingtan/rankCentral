
import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  name: string;
  fileUrl: string;
  fileType: string;
  project: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf'],
    default: 'pdf',
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Browser-safe model registration
let DocumentModel: mongoose.Model<IDocument>;
try {
  // Check if the model is already registered
  DocumentModel = mongoose.model<IDocument>('Document');
} catch (error) {
  // Model not registered yet, so register it
  DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);
}

export default DocumentModel;
