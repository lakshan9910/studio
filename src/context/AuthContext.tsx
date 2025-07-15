
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database
const MOCK_USERS: { [key: string]: User & { password_hash: string } } = {
  "user@example.com": {
    id: "user_1",
    email: "user@example.com",
    name: "Test User",
    password_hash: "password123" 
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulate checking for a logged-in user in session storage
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existingUser = Object.values(MOCK_USERS).find(u => u.email === email);
        if (existingUser && existingUser.password_hash === pass) {
          const { password_hash, ...userToStore } = existingUser;
          setUser(userToStore);
          sessionStorage.setItem('user', JSON.stringify(userToStore));
          setLoading(false);
          resolve();
        } else {
          setLoading(false);
          reject(new Error("Invalid email or password."));
        }
      }, 1000);
    });
  };

  const signup = async (name: string, email: string, pass: string): Promise<void> => {
    setLoading(true);
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const existingUser = Object.values(MOCK_USERS).find(u => u.email === email);
            if (existingUser) {
                setLoading(false);
                reject(new Error("An account with this email already exists."));
            } else {
                const newUser: User = {
                    id: `user_${Date.now()}`,
                    name,
                    email,
                };
                MOCK_USERS[email] = { ...newUser, password_hash: pass };
                setUser(newUser);
                sessionStorage.setItem('user', JSON.stringify(newUser));
                setLoading(false);
                resolve();
            }
        }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  const value = { user, loading, login, signup, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
