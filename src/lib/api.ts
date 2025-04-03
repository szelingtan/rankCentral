
import User, { IUser } from '../models/User';
import Project, { IProject } from '../models/Project';
import Document, { IDocument } from '../models/Document';
import Evaluation, { IEvaluation } from '../models/Evaluation';
import { connectDB } from './db';

// Browser-compatible token generation and verification
const generateToken = (payload: any): string => {
  // In a real app, use a dedicated library for JWT in the browser
  // For now, this is a simplified version for demo purposes
  const base64Encode = (data: string) => btoa(unescape(encodeURIComponent(data)));
  const header = base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = base64Encode(JSON.stringify(payload));
  const signature = base64Encode(`${header}.${encodedPayload}-DEMO-SIGNATURE`);
  return `${header}.${encodedPayload}.${signature}`;
};

const verifyToken = (token: string) => {
  try {
    // In a real app, you would verify the signature
    // This is just for demo purposes
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');
    
    const payloadBase64 = parts[1];
    const payload = JSON.parse(decodeURIComponent(escape(atob(payloadBase64))));
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// User Authentication
export const authenticateUser = async (email: string, password: string) => {
  await connectDB();
  
  try {
    // Find user by email - proper Mongoose query
    const user = await User.findOne({ email }).lean();
    
    if (!user) {
      throw new Error('User not found');
    }

    // In a real application, you would properly compare hashed passwords
    // This is simplified for demonstration purposes
    const userInstance = new User(user);
    const isMatch = await userInstance.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({ 
      id: user._id.toString(), 
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    });

    return { token, user: { id: user._id.toString(), email: user.email } };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Register a new user
export const registerUser = async (email: string, password: string) => {
  await connectDB();
  
  try {
    // Check if user already exists - proper Mongoose query
    const existingUser = await User.findOne({ email }).lean();
    
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create a new user
    const user = new User({ email, password });
    await user.save();

    const token = generateToken({ 
      id: user._id.toString(), 
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    });

    return { token, user: { id: user._id.toString(), email: user.email } };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Export verifyToken for use in other files
export { verifyToken };

// Project Operations
export const createProject = async (userId: string, name: string, description: string) => {
  await connectDB();
  
  try {
    const project = new Project({
      name,
      description,
      owner: userId,
    });
    
    await project.save();
    return project;
  } catch (error) {
    console.error('Create project error:', error);
    throw error;
  }
};

export const getUserProjects = async (userId: string) => {
  await connectDB();
  
  try {
    // Proper Mongoose query
    const projects = await Project.find({ owner: userId }).sort({ createdAt: -1 }).lean();
    
    return projects;
  } catch (error) {
    console.error('Get projects error:', error);
    throw error;
  }
};

export const getProjectById = async (projectId: string, userId: string) => {
  await connectDB();
  
  try {
    // Proper Mongoose query
    const project = await Project.findOne({ _id: projectId, owner: userId }).lean();
    
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  } catch (error) {
    console.error('Get project error:', error);
    throw error;
  }
};

// Document Operations
export const uploadDocument = async (
  projectId: string, 
  userId: string, 
  name: string, 
  fileUrl: string
) => {
  await connectDB();
  
  try {
    // Verify the project exists and belongs to user - proper Mongoose query
    const project = await Project.findOne({ _id: projectId, owner: userId }).lean();
    
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
    // Proper Mongoose query
    const documents = await Document.find({ 
      project: projectId, 
      owner: userId 
    }).sort({ createdAt: -1 }).lean();
    
    return documents;
  } catch (error) {
    console.error('Get documents error:', error);
    throw error;
  }
};

// Evaluation Operations
export const createEvaluation = async (
  projectId: string,
  userId: string,
  name: string,
  fileUrl: string,
  documentIds: string[]
) => {
  await connectDB();
  
  try {
    // Verify the project exists and belongs to user - proper Mongoose query
    const project = await Project.findOne({ _id: projectId, owner: userId }).lean();
    
    if (!project) {
      throw new Error('Project not found');
    }

    const evaluation = new Evaluation({
      name,
      fileUrl,
      project: projectId,
      documents: documentIds,
      owner: userId,
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
    // Proper Mongoose query
    const evaluations = await Evaluation.find({ 
      project: projectId, 
      owner: userId 
    }).sort({ createdAt: -1 }).lean();
    
    return evaluations;
  } catch (error) {
    console.error('Get evaluations error:', error);
    throw error;
  }
};
