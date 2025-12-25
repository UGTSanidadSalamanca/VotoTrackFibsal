import React, { createContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { User } from '../types';
import { mockUsers } from '../lib/data';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('voto-track-user', null);
  const [storedUsers] = useLocalStorage<User[]>('voto-track-managed-users', mockUsers);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Buscar primero en los usuarios almacenados
    const foundUser = storedUsers.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      const { password: _, ...userToStore } = foundUser;
      setUser(userToStore as User);
      return true;
    }
    return false;
  }, [storedUsers, setUser]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
