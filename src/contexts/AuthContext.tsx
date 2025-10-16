import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // On login/signup, if profile exists but has no starknet_address, create/fetch invisible wallet via backend
        const setupInvisibleWallet = async () => {
          try {
            const currentUser = session?.user;
            if (!currentUser) return;
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, username, email, starknet_address')
              .eq('id', currentUser.id)
              .maybeSingle();
            if (!profile) return;
            if (profile.starknet_address) return; // already provisioned

            const backendUrl = 'http://localhost:8787';
            console.log('Attempting to create invisible wallet via:', backendUrl);
            const r = await fetch(`${backendUrl}/api/wallets/create-or-fetch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: profile.id,
                email: profile.email,
                username: profile.username,
              }),
            });
            if (!r.ok) {
              const text = await r.text();
              console.error('Invisible wallet error:', text);
              // Don't show error toast if backend is not running (for demo purposes)
              if (text.includes('ECONNREFUSED') || text.includes('Failed to fetch')) {
                console.log('Backend not running - skipping invisible wallet creation for demo');
                return;
              }
              toast.error('Invisible wallet setup failed');
              return;
            }
            const resp = await r.json();
            if (resp?.address) {
              toast.success('Invisible wallet created', { description: `${resp.address}` });
            }
          } catch (e) {
            console.error('Invisible wallet setup error:', e);
            // Don't show error if backend is not running
            if (e.message?.includes('Failed to fetch')) {
              console.log('Backend not running - skipping invisible wallet creation for demo');
            }
          }
        };

        // Fire and forget
        setupInvisibleWallet();
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
