import { createContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import type { UserResponse } from '../types/user.types';
import type { RegisterRequest, LoginRequest } from '../types/auth.types';

export interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user from stored JWT on mount
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      userService
        .getMe()
        .then((userData) => setUser(userData))
        .catch(() => authService.clearToken())
        .finally(() => setLoading(false));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authService.login(data);
    authService.saveToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authService.register(data);
    authService.saveToken(response.token);
    setUser(response.user);
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const response = await authService.googleLogin(idToken);
    authService.saveToken(response.token);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    authService.clearToken();
    setUser(null);
  }, []);

  // Allow components to refresh user data (e.g. after profile update)
  const refreshUser = useCallback(async () => {
    const updatedUser = await userService.getMe();
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
