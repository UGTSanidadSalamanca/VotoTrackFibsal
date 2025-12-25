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
    // Buscar tanto en los usuarios de código como en los almacenados por el administrador
    const allAvailableUsers = [...mockUsers, ...storedUsers];

    // Eliminar duplicados por nombre de usuario (priorizar mockUsers si hay conflicto)
    const uniqueUsers = allAvailableUsers.filter((u, index, self) =>
      index === self.findIndex((t) => t.username === u.username)
    );

    const foundUser = uniqueUsers.find(
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
