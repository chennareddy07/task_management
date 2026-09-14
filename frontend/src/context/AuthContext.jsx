import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearAccessToken, setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);

const normalizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuthResponse = (data) => {
    setAccessToken(data.accessToken);
    setUser(normalizeUser(data.user));
  };

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    applyAuthResponse(data);
  };

  const register = async (details) => {
    const { data } = await api.post('/auth/register', details);
    applyAuthResponse(data);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  useEffect(() => {
    let active = true;

    api.post('/auth/refresh')
      .then(({ data }) => {
        if (active) {
          applyAuthResponse(data);
        }
      })
      .catch(() => {
        clearAccessToken();
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: Boolean(user), login, register, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
