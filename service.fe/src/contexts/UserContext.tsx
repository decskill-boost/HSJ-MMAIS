import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { fetchCurrentUser } from '../lib/api';
import { supabase } from '../services/supabaseClient';
import type { Permission, UserProfile } from '../types/permissions';

interface UserContextValue {
  user: UserProfile | null;
  permissions: Permission[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  permissions: [],
  isLoading: true,
  isAuthenticated: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        try {
          const profile = await fetchCurrentUser(session.access_token);
          setUser(profile);
        } catch {
          setUser(null);
        }
      }

      setIsLoading(false);
    }

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.access_token) {
          try {
            const profile = await fetchCurrentUser(session.access_token);
            setUser(profile);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        permissions: user?.permissions ?? [],
        isLoading,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
