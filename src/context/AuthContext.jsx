import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { sendWhatsAppNotification } from '../services/whatsappService';
import {
  getTable, insertRow, genId, nowIso,
  getLocalSession, setLocalSession, clearLocalSession,
} from '../services/localStore';
import { logAdminAction } from '../services/adminService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Local-mode session bootstrap ---
  useEffect(() => {
    if (isSupabaseConfigured) return;
    const session = getLocalSession();
    if (session?.userId) {
      const found = getTable('profiles').find((p) => p.id === session.userId);
      if (found) {
        setUser({ id: found.id, email: found.email });
        setProfile(found);
      }
    }
    setLoading(false);
  }, []);

  // --- Supabase-mode session bootstrap ---
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return; // local mode already sets profile above
    if (!user) {
      setProfile(null);
      return;
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) {
      const found = getTable('profiles').find(
        (p) => p.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (!found || found.password !== password) {
        throw new Error('Invalid email or password.');
      }
      setLocalSession(found.id);
      setUser({ id: found.id, email: found.email });
      setProfile(found);
      if (found.role !== 'customer') await logAdminAction('signed in', 'auth', found.id);
      return { user: found };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    if (!isSupabaseConfigured) {
      const exists = getTable('profiles').some(
        (p) => p.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (exists) throw new Error('An account with that email already exists.');
      const row = insertRow('profiles', {
        id: genId('cust'),
        full_name: fullName,
        email: email.trim(),
        password,
        role: 'customer',
        vip_status: false,
        loyalty_points: 0,
        created_at: nowIso(),
      });
      setLocalSession(row.id);
      setUser({ id: row.id, email: row.email });
      setProfile(row);
      await sendWhatsAppNotification('new_registration', { customerName: fullName, email });
      return { user: row };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;

    await sendWhatsAppNotification('new_registration', { customerName: fullName, email });
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      clearLocalSession();
      setUser(null);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isStaff = ['admin', 'manager', 'staff'].includes(profile?.role);
  const isVip = profile?.vip_status === true;

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, isAdmin, isStaff, isVip }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
