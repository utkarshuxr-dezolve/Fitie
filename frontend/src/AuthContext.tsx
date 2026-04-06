import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token && !cancelled) {
          const { data } = await authAPI.me();
          if (!cancelled) setUser({ id: data._id || data.id, ...data });
        }
      } catch {
        if (!cancelled) await AsyncStorage.removeItem('token');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const { data } = await authAPI.me();
        setUser({ id: data._id || data.id, ...data });
      }
    } catch {
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.setItem('token', data.token);
    setUser({ id: data.id, email: data.email, name: data.name });
  };

  const register = async (email: string, password: string, name: string) => {
    const { data } = await authAPI.register({ email, password, name });
    await AsyncStorage.setItem('token', data.token);
    setUser({ id: data.id, email: data.email, name: data.name });
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
