import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

// Holds "who is logged in" so every page can read it.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // True until we know whether a login cookie exists. Pages wait for this.
  const [loading, setLoading] = useState(true);

  // After a page refresh the user state is empty, so ask the server who we are.
  useEffect(() => {
    api
      .get('/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api.post('/auth/login', { email: email, password: password });
    setUser(data.user);
  }

  async function register(fullName, email, password) {
    const body = { full_name: fullName, email: email, password: password };
    const data = await api.post('/auth/register', body);
    setUser(data.user);
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  const value = { user, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
