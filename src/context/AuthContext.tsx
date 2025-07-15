
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  users: User[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  addUser: (name: string, email: string, pass: string, role: UserRole) => Promise<User>;
  updateUser: (userId: string, data: Partial<Omit<User, 'id' | 'email'>>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserPassword: (userId: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database
let MOCK_USERS: { [key: string]: User & { password_hash: string } } = {
  "admin@example.com": {
    id: "user_admin_1",
    email: "admin@example.com",
    name: "Admin User",
    role: "Admin",
    password_hash: "password123" 
  },
  "cashier@example.com": {
    id: "user_cashier_1",
    email: "cashier@example.com",
    name: "Cashier User",
    role: "Cashier",
    password_hash: "password123"
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const syncUsersState = () => {
    const userList = Object.values(MOCK_USERS).map(({ password_hash, ...user }) => user);
    setUsers(userList);
  }

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
    } finally {
      syncUsersState();
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
      }, 500);
    });
  };

  const signup = async (name: string, email: string, pass: string): Promise<void> => {
    return addUser(name, email, pass, 'Cashier').then(newUser => {
        setUser(newUser);
        sessionStorage.setItem('user', JSON.stringify(newUser));
    });
  };

  const addUser = async (name: string, email: string, pass: string, role: UserRole): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const existingUser = Object.values(MOCK_USERS).find(u => u.email === email);
            if (existingUser) {
                reject(new Error("An account with this email already exists."));
            } else {
                const newUser: User = {
                    id: `user_${Date.now()}`,
                    name,
                    email,
                    role,
                };
                MOCK_USERS[email] = { ...newUser, password_hash: pass };
                syncUsersState();
                resolve(newUser);
            }
        }, 500);
    });
  };

  const updateUser = async (userId: string, data: Partial<Omit<User, 'id'|'email'>>): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userEntry = Object.entries(MOCK_USERS).find(([, u]) => u.id === userId);
        if (userEntry) {
          const [email, userToUpdate] = userEntry;
          const updatedUser = { ...userToUpdate, ...data };
          MOCK_USERS[email] = updatedUser;
          
          // If the logged in user is the one being updated, update their session
          if(user?.id === userId) {
            const { password_hash, ...userToStore } = updatedUser;
            setUser(userToStore);
            sessionStorage.setItem('user', JSON.stringify(userToStore));
          }
          
          syncUsersState();
          const { password_hash, ...publicUser } = updatedUser;
          resolve(publicUser);
        } else {
          reject(new Error("User not found."));
        }
      }, 500);
    });
  };

  const updateUserPassword = async (userId: string, newPass: string): Promise<void> => {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              const userEntry = Object.entries(MOCK_USERS).find(([, u]) => u.id === userId);
              if (userEntry) {
                  const [email, userToUpdate] = userEntry;
                  MOCK_USERS[email] = { ...userToUpdate, password_hash: newPass };
                  syncUsersState();
                  resolve();
              } else {
                  reject(new Error("User not found."));
              }
          }, 500);
      });
  };

  const deleteUser = async (userId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userEntry = Object.entries(MOCK_USERS).find(([, u]) => u.id === userId);
        if (userEntry) {
          const [email] = userEntry;
          delete MOCK_USERS[email];
          syncUsersState();
          resolve();
        } else {
          reject(new Error("User not found."));
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  const value = { user, users, loading, login, signup, logout, addUser, updateUser, deleteUser, updateUserPassword };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContext');
  }
  return context;
}
