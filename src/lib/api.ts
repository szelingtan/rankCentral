
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Project, { IProject } from '../models/Project';
import Document, { IDocument } from '../models/Document';
import Evaluation, { IEvaluation } from '../models/Evaluation';
import { connectDB } from './db';

// Secret for JWT - use a strong, random string in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User Authentication
export const authenticateUser = async (email: string, password: string) => {
  await connectDB();
  
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user: { id: user._id, email: user.email } };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Register a new user
export const registerUser = async (email: string, password: string) => {
  await connectDB();
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create a new user
    const user = new User({ email, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user: { id: user._id, email: user.email } };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Verify token and get user
export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

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
    const projects = await Project.find({ owner: userId }).sort({ createdAt: -1 });
    return projects;
  } catch (error) {
    console.error('Get projects error:', error);
    throw error;
  }
};

export const getProjectById = async (projectId: string, userId: string) => {
  await connectDB();
  
  try {
    const project = await Project.findOne({ _id: projectId, owner: userId });
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
    // Verify the project exists and belongs to user
    const project = await Project.findOne({ _id: projectId, owner: userId });
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
    const documents = await Document.find({ 
      project: projectId, 
      owner: userId 
    }).sort({ createdAt: -1 });
    
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
    // Verify the project exists and belongs to user
    const project = await Project.findOne({ _id: projectId, owner: userId });
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
    const evaluations = await Evaluation.find({ 
      project: projectId, 
      owner: userId 
    }).sort({ createdAt: -1 });
    
    return evaluations;
  } catch (error) {
    console.error('Get evaluations error:', error);
    throw error;
  }
};
