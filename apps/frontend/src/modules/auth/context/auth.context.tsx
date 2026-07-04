'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { getMessage } from '@/shared/i18n';
import { decodeJwtPayload } from '../util/jwt.util';

const AUTH_TOKEN_COOKIE = 'auth_token';
const COOKIE_EXPIRES_DAYS = 7;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function hydrateFromToken(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  return { id: payload.sub, name: payload.name, email: payload.email };
}

function readInitialSession(): { user: AuthUser | null; token: string | null; status: AuthStatus } {
  if (typeof window === 'undefined') {
    return { user: null, token: null, status: 'loading' };
  }

  const savedToken = Cookies.get(AUTH_TOKEN_COOKIE) ?? null;
  if (!savedToken) {
    return { user: null, token: null, status: 'unauthenticated' };
  }

  const hydratedUser = hydrateFromToken(savedToken);
  if (!hydratedUser) {
    Cookies.remove(AUTH_TOKEN_COOKIE);
    return { user: null, token: null, status: 'unauthenticated' };
  }

  return { user: hydratedUser, token: savedToken, status: 'authenticated' };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState(readInitialSession);

  const login = useCallback((newToken: string) => {
    const hydratedUser = hydrateFromToken(newToken);
    if (!hydratedUser) return;

    Cookies.set(AUTH_TOKEN_COOKIE, newToken, {
      expires: COOKIE_EXPIRES_DAYS,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    setSession({ user: hydratedUser, token: newToken, status: 'authenticated' });
  }, []);

  const logout = useCallback(() => {
    Cookies.remove(AUTH_TOKEN_COOKIE);
    setSession({ user: null, token: null, status: 'unauthenticated' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session.user, token: session.token, status: session.status, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(getMessage('AUTH_CONTEXT_PROVIDER_REQUIRED'));
  }
  return context;
}
