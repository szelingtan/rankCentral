
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

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
