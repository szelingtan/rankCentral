
import mongoose, { Document, Schema } from 'mongoose';

export interface IEvaluation extends Document {
  name: string;
  fileUrl: string;
  project: mongoose.Types.ObjectId;
  documents: mongoose.Types.ObjectId[];
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSchema = new Schema<IEvaluation>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  documents: [{
    type: Schema.Types.ObjectId,
    ref: 'Document',
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Evaluation || mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
