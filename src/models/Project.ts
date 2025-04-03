
import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
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
let Project: mongoose.Model<IProject>;
try {
  // Check if the model is already registered
  Project = mongoose.model<IProject>('Project');
} catch (error) {
  // Model not registered yet, so register it
  Project = mongoose.model<IProject>('Project', ProjectSchema);
}

export default Project;
