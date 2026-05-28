import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginAPI, signup as signupAPI, verifyToken } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('aura_token'));

  useEffect(() => {
    if (token) {
      verifyToken(token)
        .then(data => {
          setUser(data.user);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('aura_token');
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await loginAPI(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('aura_token', data.token);
    return data;
  };

  const signup = async (username, email, password) => {
    const data = await signupAPI(username, email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('aura_token', data.token);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aura_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};