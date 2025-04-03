
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

// Browser-safe model registration
let Evaluation: mongoose.Model<IEvaluation>;
try {
  // Check if the model is already registered
  Evaluation = mongoose.model<IEvaluation>('Evaluation');
} catch (error) {
  // Model not registered yet, so register it
  Evaluation = mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);
}

export default Evaluation;
