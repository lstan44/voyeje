import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { trackEvent, EventCategories, EventActions, setUserProperties } from '../lib/analytics';
import { logger } from '../lib/logger';

// Input validation constants
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_MIN_LENGTH = 8;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Security utility functions
const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= PASSWORD_MIN_LENGTH;
};

const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim();
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const profileFetchInProgress = useRef<boolean>(false);
  const lastProfileFetch = useRef<number>(0);
  const mounted = useRef(false);

  // Set secure cookie options
  const COOKIE_OPTIONS = {
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  };

  const fetchProfile = useCallback(async (userId: string) => {
    if (profileFetchInProgress.current) return;
    
    const now = Date.now();
    if (now - lastProfileFetch.current < 1000) return;
    
    try {
      profileFetchInProgress.current = true;
      lastProfileFetch.current = now;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sanitizeInput(userId))
        .single();

      if (error) {
        logger.error(error, 'fetch_profile');
        return;
      }

      if (mounted.current) {
        setProfile(data);
      }
    } catch (error) {
      logger.error(error, 'fetch_profile');
    } finally {
      profileFetchInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let authListener: any;

    const initializeAuth = async () => {
      try {

        const { data: { session: initialSession }, error: sessionError } = 
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchProfile(initialSession.user.id);

          setUserProperties({
            userId: initialSession.user.id,
            userEmail: initialSession.user.email,
            authProvider: initialSession.user.app_metadata.provider,
            isAnonymous: false
          });
        }

        authListener = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          logger.info(`Auth state changed: ${event}`, 'auth_state_change');

          if (mounted.current) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession?.user) {
              await fetchProfile(currentSession.user.id);
              
              setUserProperties({
                userId: currentSession.user.id,
                userEmail: currentSession.user.email,
                authProvider: currentSession.user.app_metadata.provider,
                isAnonymous: false
              });
            } else {
              setProfile(null);
              setUserProperties({ isAnonymous: true });
            }
          }
        });
      } catch (error) {
        logger.error(error, 'initialize_auth');
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted.current = false;
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchProfile]);

  const signInWithPassword = async (email: string, password: string) => {
    try {
      // Input validation
      const sanitizedEmail = sanitizeEmail(email);
      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }

      if (!validatePassword(password)) {
        throw new Error('Password must be at least 8 characters long');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      }, {
        cookieOptions: COOKIE_OPTIONS,
      });

      if (error) throw error;

      trackEvent(EventCategories.Auth, EventActions.SignIn, 'Email');
      logger.info(`User signed in via password: ${sanitizedEmail}`, 'auth_signin');
    } catch (error) {
      logger.error(error, 'sign_in_password');
      trackEvent(EventCategories.Error, EventActions.AuthError, 'Sign in error');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          cookieOptions: COOKIE_OPTIONS,
        },
      });

      if (error) throw error;

      trackEvent(EventCategories.Auth, EventActions.GoogleSignIn);
      logger.info('User initiated Google sign in', 'auth_google');
    } catch (error) {
      logger.error(error, 'sign_in_google');
      trackEvent(EventCategories.Error, EventActions.AuthError, 'Google sign in error');
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Input validation
      const sanitizedEmail = sanitizeEmail(email);
      if (!validateEmail(sanitizedEmail)) {
        throw new Error('Invalid email format');
      }

      if (!validatePassword(password)) {
        throw new Error('Password must be at least 8 characters long');
      }

      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email_confirm_url: `${window.location.origin}/auth/callback`
          },
          cookieOptions: COOKIE_OPTIONS,
        },
      });

      if (error) throw error;

      trackEvent(EventCategories.Auth, EventActions.SignUp, 'Email');
      logger.info(`New user signed up: ${sanitizedEmail}`, 'auth_signup');
    } catch (error) {
      logger.error(error, 'sign_up');
      trackEvent(EventCategories.Error, EventActions.AuthError, 'Sign up error');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear local state
      setSession(null);
      setUser(null);
      setProfile(null);

      // Clear secure cookies
      document.cookie = 'sb-access-token=; Max-Age=0; path=/; secure; samesite=strict';
      document.cookie = 'sb-refresh-token=; Max-Age=0; path=/; secure; samesite=strict';

      trackEvent(EventCategories.Auth, EventActions.SignOut);
      logger.info('User signed out', 'auth_signout');
    } catch (error) {
      logger.error(error, 'sign_out');
      trackEvent(EventCategories.Error, EventActions.AuthError, 'Sign out error');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signInWithPassword,
        signInWithGoogle,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}