import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  createdAt: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem('jwt');
    console.log('Initializing token from localStorage:', storedToken ? 'Present' : 'Missing');
    return storedToken;
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Initializing user from localStorage:', parsedUser);
        return parsedUser;
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        return null;
      }
    }
    return null;
  });

  // Update localStorage when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('jwt', token);
      console.log('Token saved to localStorage');
    } else {
      localStorage.removeItem('jwt');
      console.log('Token removed from localStorage');
    }
  }, [token]);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('User saved to localStorage');
    } else {
      localStorage.removeItem('user');
      console.log('User removed from localStorage');
    }
  }, [user]);

  // Add debugging
  useEffect(() => {
    console.log('Auth state:', { token: !!token, user: !!user, isAuthenticated: !!token });
  }, [token, user]);

  const login = async (username: string, password: string) => {
    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Login error:', res.status, errorData);
        throw new Error(errorData || 'Invalid credentials');
      }
      
      const data = await res.json();
      console.log('Login successful, setting token and user');
      
      // Set token and user immediately
      setToken(data.accessToken);
      setUser(data.user);
      
      // Also save to localStorage immediately to avoid race conditions
      localStorage.setItem('jwt', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Token and user saved to localStorage');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const res = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Registration error:', res.status, errorData);
        throw new Error(errorData || 'Registration failed');
      }
      
      const data = await res.json();
      console.log('Registration successful, setting token and user');
      
      // Set token and user immediately
      setToken(data.accessToken);
      setUser(data.user);
      
      // Also save to localStorage immediately to avoid race conditions
      localStorage.setItem('jwt', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Token and user saved to localStorage');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out, clearing token and user');
    setToken(null);
    setUser(null);
    // Also clear localStorage immediately
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
    console.log('Token and user removed from localStorage');
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 