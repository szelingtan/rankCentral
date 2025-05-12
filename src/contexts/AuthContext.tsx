
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy user credentials for development purposes
const DUMMY_USER = {
  email: 'demo@example.com',
  password: 'password123',
  id: 'dummy-user-id-123'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003';
  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Decode JWT token
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp && decoded.exp < currentTime) {
          localStorage.removeItem('authToken');
        } else {
          setUser({ id: decoded.id, email: decoded.email });
        }
      } catch (error) {
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // For development: check if using dummy credentials
      if (email === DUMMY_USER.email && password === DUMMY_USER.password) {
        console.log('Using dummy credentials for development');
        
        // Create a simple JWT-like token
        const payload = {
          id: DUMMY_USER.id,
          email: DUMMY_USER.email,
          exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
        };
        
        const base64Payload = btoa(JSON.stringify(payload));
        const dummyToken = `header.${base64Payload}.signature`;
        
        localStorage.setItem('authToken', dummyToken);
        setUser({ id: DUMMY_USER.id, email: DUMMY_USER.email });
        setLoading(false);
        return;
      }
      
      // Regular login flow for non-dummy users
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      // First try to parse as text
      const textResponse = await response.text();
      let data;
      
      try {
        // Try to parse the text as JSON
        data = JSON.parse(textResponse);
      } catch (e) {
        // If parsing fails, throw an error with the raw text
        console.error('Failed to parse response:', textResponse);
        throw new Error('Invalid server response: ' + (textResponse || 'Empty response'));
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      localStorage.setItem('authToken', data.token || data.access_token);
      setUser(data.user || { id: data.id, email: data.email });
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const textResponse = await response.text();
      let data;
      
      try {
        // Try to parse the text as JSON
        data = JSON.parse(textResponse);
      } catch (e) {
        // If parsing fails, throw an error with the raw text
        console.error('Failed to parse response:', textResponse);
        throw new Error('Invalid server response: ' + (textResponse || 'Empty response'));
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Registration failed');
      }

      localStorage.setItem('authToken', data.token || data.access_token);
      setUser(data.user || { id: data.id, email: data.email });
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
