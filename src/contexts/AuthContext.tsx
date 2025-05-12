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
  getAuthHeaders: () => { Authorization: string } | {};
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

  const apiUrl = 'https://rankcentral.onrender.com';

  // Helper function to get authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  };

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('access_token');
    const userJson = localStorage.getItem('user');
    
    if (token && userJson) {
      try {
        const userData = JSON.parse(userJson);
        setUser({ id: userData.id, email: userData.email });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
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
        
        const dummyUser = { id: DUMMY_USER.id, email: DUMMY_USER.email };
        
        // Store dummy tokens
        localStorage.setItem('access_token', 'dummy_access_token');
        localStorage.setItem('refresh_token', 'dummy_refresh_token');
        localStorage.setItem('user', JSON.stringify(dummyUser));
        
        setUser(dummyUser);
        setLoading(false);
        return;
      }
      
      // Regular login flow for non-dummy users
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // Store tokens and user info as expected by your backend
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
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

      // Store tokens and user info
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setUser(data.user);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Call logout API if needed
    const token = localStorage.getItem('access_token');
    if (token) {
      // Optional: Notify server of logout to invalidate token
      fetch(`${apiUrl}/api/logout`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      }).catch(err => console.error('Logout API error:', err));
    }
    
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
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
        getAuthHeaders,
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