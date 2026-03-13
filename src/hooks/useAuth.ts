// Hook for authentication logic

import { useState, useCallback } from 'react';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        throw new Error('Falha ao fazer login');
      }
      const data = await response.json();
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err?.message || 'Erro desconhecido');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const validateLicense = useCallback(async (username: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/license/${username}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.valid === true;
    } catch {
      return false;
    }
  }, []);

  return {
    user,
    setUser,
    error,
    isLoading,
    login,
    logout,
    validateLicense,
  };
};
