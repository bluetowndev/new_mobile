import React, { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ accessToken: '', refreshToken: '', user: null });

  const value = useMemo(() => ({
    auth,
    setAuth: (payload) => setAuth(payload),
    clearAuth: () => setAuth({ accessToken: '', refreshToken: '', user: null }),
  }), [auth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


