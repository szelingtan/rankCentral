
import Document from '../models/Document';
import Project from '../models/Project';
import { connectDB } from './db';

export const uploadDocument = async (
  projectId: string, 
  userId: string, 
  name: string, 
  fileUrl: string
) => {
  await connectDB();
  
  try {
    // Verify the project exists and belongs to user with exec() to properly handle the promise
    const project = await Project.findOne({ _id: projectId, owner: userId }).exec();
    
    if (!project) {
      throw new Error('Project not found');
    }

    const document = new Document({
      name,
      fileUrl,
      fileType: 'pdf',
      project: projectId,
      owner: userId,
    });
    
    await document.save();
    return document;
  } catch (error) {
    console.error('Upload document error:', error);
    throw error;
  }
};

export const getProjectDocuments = async (projectId: string, userId: string) => {
  await connectDB();
  
  try {
    // Use exec() to properly handle the promise
    const documents = await Document.find({ 
      project: projectId, 
      owner: userId 
    }).sort({ createdAt: -1 }).exec();
    
    return documents;
  } catch (error) {
    console.error('Get documents error:', error);
    throw error;
  }
};
