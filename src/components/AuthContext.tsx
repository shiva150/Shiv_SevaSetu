import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { User, UserRole } from '../types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  signup: (data: {
    phone: string;
    email?: string;
    name: string;
    password: string;
    role: UserRole;
    language?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from stored tokens
    api.getMe().then((u) => {
      if (u) setUser(u as unknown as User);
    }).finally(() => setLoading(false));
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const result = await api.login(phone, password);
      setUser(result.user as unknown as User);
      toast.success(`Welcome back, ${result.user.name}!`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
      throw err;
    }
  };

  const signup = async (data: {
    phone: string;
    email?: string;
    name: string;
    password: string;
    role: UserRole;
    language?: string;
  }) => {
    try {
      const result = await api.signup({
        phone: data.phone,
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role === 'admin' ? 'careseeker' : data.role, // admin cannot self-register
        language: data.language,
      });
      setUser(result.user as unknown as User);
      toast.success(`Welcome to SevaSetu, ${result.user.name}!`);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to sign up. Please try again.');
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      toast.success('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const refreshUser = async () => {
    const u = await api.getMe();
    if (u) setUser(u as unknown as User);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
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
