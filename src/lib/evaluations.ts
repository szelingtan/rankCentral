
import Evaluation from '../models/Evaluation';
import Project from '../models/Project';
import { connectDB } from './db';

export const createEvaluation = async (
  projectId: string,
  userId: string,
  name: string,
  fileUrl: string,
  documentIds: string[],
  reportName?: string
) => {
  await connectDB();
  
  try {
    // Verify the project exists and belongs to user with exec() to properly handle the promise
    const project = await Project.findOne({ _id: projectId, owner: userId }).exec();
    
    if (!project) {
      throw new Error('Project not found');
    }

    const evaluation = new Evaluation({
      name,
      fileUrl,
      project: projectId,
      documents: documentIds,
      owner: userId,
      reportName: reportName // Store the report name if provided
    });
    
    await evaluation.save();
    return evaluation;
  } catch (error) {
    console.error('Create evaluation error:', error);
    throw error;
  }
};

export const getProjectEvaluations = async (projectId: string, userId: string) => {
  await connectDB();
  
  try {
    // Use exec() to properly handle the promise
    const evaluations = await Evaluation.find({ 
      project: projectId, 
      owner: userId 
    }).sort({ createdAt: -1 }).exec();
    
    return evaluations;
  } catch (error) {
    console.error('Get evaluations error:', error);
    throw error;
  }
};

// Function to get API key from localStorage (frontend only)
export const getOpenAIApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('openai_api_key');
  }
  return null;
};
