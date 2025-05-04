
import User from '../models/User';
import { connectDB } from './db';

// Browser-compatible token generation and verification
export const generateToken = (payload: any): string => {
  // In a real app, use a dedicated library for JWT in the browser
  // For now, this is a simplified version for demo purposes
  const base64Encode = (data: string) => btoa(unescape(encodeURIComponent(data)));
  const header = base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = base64Encode(JSON.stringify(payload));
  const signature = base64Encode(`${header}.${encodedPayload}-DEMO-SIGNATURE`);
  return `${header}.${encodedPayload}.${signature}`;
};

export const verifyToken = (token: string) => {
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
    // Find user by email with exec() to properly handle the promise
    const user = await User.findOne({ email }).exec();
    
    if (!user) {
      throw new Error('User not found');
    }

    // In a real application, you would properly compare hashed passwords
    // This is simplified for demonstration purposes
    const isMatch = await user.comparePassword(password);
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
    // Check if user already exists with exec() to properly handle the promise
    const existingUser = await User.findOne({ email }).exec();
    
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
