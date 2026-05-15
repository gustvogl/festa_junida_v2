import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProfile } from '../lib/api';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function hydrateProfile(nextSession) {
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await fetchProfile();
      setProfile(nextProfile);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await hydrateProfile(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await hydrateProfile(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  const value = useMemo(
    () => ({
      loading,
      session,
      user: session?.user ?? null,
      profile,
      setProfile,
      signOut,
    }),
    [loading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth precisa estar dentro de AuthProvider');
  }
  return context;
}
