
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { allPermissions, Permission } from '@/types/permissions';
import { verifyTwoFactorCode } from '@/lib/2fa';

interface AuthContextType {
  user: User | null;
  users: User[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  verifyTwoFactor: (userId: string, code: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  addUser: (name: string, email: string, pass: string, phone?: string, imageUrl?: string, permissions?: Permission[]) => Promise<User>;
  updateUser: (userId: string, data: Partial<Omit<User, 'id' | 'email'>>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserPassword: (userId: string, newPass: string) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasUsers: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database - starts empty and is populated by the setup screen
let MOCK_USERS: { [key: string]: User & { password_hash: string } } = {};

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
      const storedMockUsers = localStorage.getItem('MOCK_USERS');
      if (storedMockUsers) {
        MOCK_USERS = JSON.parse(storedMockUsers);
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
    } finally {
      syncUsersState();
      setLoading(false);
    }
  }, []);

  const persistMockUsers = () => {
    localStorage.setItem('MOCK_USERS', JSON.stringify(MOCK_USERS));
  };
  
  const hasUsers = () => {
      return Object.keys(MOCK_USERS).length > 0;
  }

  const login = async (email: string, pass: string): Promise<User> => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existingUser = Object.values(MOCK_USERS).find(u => u.email === email);
        if (existingUser && existingUser.password_hash === pass) {
          const { password_hash, ...userToStore } = existingUser;
          if (!userToStore.twoFactorEnabled) {
            setUser(userToStore);
            sessionStorage.setItem('user', JSON.stringify(userToStore));
          }
          setLoading(false);
          resolve(userToStore);
        } else {
          setLoading(false);
          reject(new Error("Invalid email or password."));
        }
      }, 500);
    });
  };
  
  const verifyTwoFactor = async (userId: string, code: string): Promise<void> => {
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              const userToVerify = Object.values(MOCK_USERS).find(u => u.id === userId);
              if (!userToVerify || !userToVerify.twoFactorSecret) {
                  return reject(new Error("2FA not set up for this user."));
              }
              const isValid = verifyTwoFactorCode(userToVerify.twoFactorSecret, code);

              if (isValid) {
                  const { password_hash, ...userToStore } = userToVerify;
                  setUser(userToStore);
                  sessionStorage.setItem('user', JSON.stringify(userToStore));
                  resolve();
              } else {
                  reject(new Error("Invalid 2FA code."));
              }
          }, 300);
      });
  };

  const signup = async (name: string, email: string, pass: string): Promise<void> => {
    return addUser(name, email, pass, undefined, undefined, ['pos:read', 'pos:write']).then(newUser => {
        setUser(newUser);
        sessionStorage.setItem('user', JSON.stringify(newUser));
    });
  };

  const addUser = async (name: string, email: string, pass: string, phone?: string, imageUrl?: string, permissions: Permission[] = ['pos:read']): Promise<User> => {
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
                    phone,
                    imageUrl,
                    permissions,
                    twoFactorEnabled: false,
                };
                MOCK_USERS[email] = { ...newUser, password_hash: pass };
                persistMockUsers();
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
          
          if(user?.id === userId) {
            const { password_hash, ...userToStore } = updatedUser;
            setUser(userToStore);
            sessionStorage.setItem('user', JSON.stringify(userToStore));
          }
          
          persistMockUsers();
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
                  persistMockUsers();
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
          persistMockUsers();
          syncUsersState();
          resolve();
        } else {
          reject(new Error("User not found."));
        }
      }, 500);
    });
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('admin')) return true;
    return user.permissions.includes(permission);
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  const value = { user, users, loading, login, verifyTwoFactor, signup, logout, addUser, updateUser, deleteUser, updateUserPassword, hasPermission, hasUsers };

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
