import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authAPI.getMe();
        setUser(data.user);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    toast.success(data.message || 'Welcome to PrepPilot! 🎉');
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    toast.success(data.message || 'Welcome back!');
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully.');
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const { data } = await authAPI.updateProfile(updates);
    setUser(data.user);
    toast.success('Profile updated!');
    return data;
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await authAPI.getMe();
    setUser(data.user);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isCandidate: user?.role === 'candidate',
    isRecruiter: user?.role === 'recruiter',
    isAdmin: user?.role === 'admin',
    register,
    login,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

export default AuthContext;