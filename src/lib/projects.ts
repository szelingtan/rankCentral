
import Project from '../models/Project';
import { connectDB } from './db';

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
    // Use exec() to properly handle the promise
    const projects = await Project.find({ owner: userId }).sort({ createdAt: -1 }).exec();
    
    return projects;
  } catch (error) {
    console.error('Get projects error:', error);
    throw error;
  }
};

export const getProjectById = async (projectId: string, userId: string) => {
  await connectDB();
  
  try {
    // Use exec() to properly handle the promise
    const project = await Project.findOne({ _id: projectId, owner: userId }).exec();
    
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  } catch (error) {
    console.error('Get project error:', error);
    throw error;
  }
};
