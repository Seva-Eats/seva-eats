import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { AUTH_STORAGE_FLAG_KEY } from '@/constants/auth';
import { getCurrentSession, supabase } from '@/lib/supabase';

const USER_STORAGE_KEY = 'user-profile';

export type UserRole = 'recipient' | 'dasher';
export type AuthProvider = 'google' | 'apple' | 'email' | 'guest' | null;

export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  homeAddress: {
    address: string;
    latitude: number;
    longitude: number;
  } | null;
  dietaryRestrictions: string[];
  servingSize: number;
  notificationsEnabled: boolean;
  role: UserRole;
  isAuthenticated: boolean;
  authProvider: AuthProvider;
};

type UserContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setHomeAddress: (address: { address: string; latitude: number; longitude: number }) => Promise<void>;
  setRole: (role: UserRole) => Promise<void>;
  mockSignIn: (provider: Exclude<AuthProvider, null>, details?: { name?: string; email?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  clearProfile: () => Promise<void>;
  hasCompletedProfile: boolean;
};

const defaultUser: UserProfile = {
  id: `user-${Date.now()}`,
  name: '',
  phone: '',
  homeAddress: null,
  dietaryRestrictions: [],
  servingSize: 1,
  notificationsEnabled: true,
  role: 'recipient',
  isAuthenticated: false,
  authProvider: null,
};

const roleMap: Record<string, UserRole> = {
  recipient: 'recipient',
  volunteer: 'dasher',
  dasher: 'dasher',
  both: 'recipient',
};

const normalizeUser = (stored: Partial<UserProfile> & { familySize?: number; role?: string }): UserProfile => {
  const role = roleMap[stored.role ?? 'recipient'] ?? 'recipient';
  const servingSize = stored.servingSize ?? stored.familySize ?? defaultUser.servingSize;

  return {
    ...defaultUser,
    ...stored,
    role,
    servingSize,
  };
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const session = await getCurrentSession();
      const stored = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalized = normalizeUser({
          ...parsed,
          isAuthenticated: session ? true : parsed.isAuthenticated,
          authProvider: session ? (parsed.authProvider ?? 'google') : parsed.authProvider,
        });
        setUser(normalized);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
      } else {
        const seedUser = {
          ...defaultUser,
          isAuthenticated: !!session,
          authProvider: session ? 'google' : null,
        };
        setUser(seedUser);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(seedUser));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      setUser(defaultUser);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      const base = prev ?? defaultUser;
      const updated = { ...base, ...updates };
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
      return updated;
    });
  }, []);

  const setHomeAddress = useCallback(async (address: { address: string; latitude: number; longitude: number }) => {
    await updateProfile({ homeAddress: address });
  }, [updateProfile]);

  const setRole = useCallback(async (role: UserRole) => {
    await updateProfile({ role });
  }, [updateProfile]);

  const mockSignIn = useCallback(async (
    provider: Exclude<AuthProvider, null>,
    details?: { name?: string; email?: string }
  ) => {
    setUser((prev) => {
      const base = prev ?? defaultUser;
      const updated: UserProfile = {
        ...base,
        name: details?.name ?? base.name,
        email: details?.email ?? base.email,
        isAuthenticated: true,
        authProvider: provider,
      };
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
      AsyncStorage.setItem(AUTH_STORAGE_FLAG_KEY, 'true').catch(console.error);
      return updated;
    });
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) {
      supabase.auth.signOut().catch(console.error);
    }
    setUser((prev) => {
      const base = prev ?? defaultUser;
      const updated: UserProfile = {
        ...base,
        isAuthenticated: false,
        authProvider: null,
      };
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
      AsyncStorage.removeItem(AUTH_STORAGE_FLAG_KEY).catch(console.error);
      return updated;
    });
  }, []);

  const clearProfile = useCallback(async () => {
    setUser(defaultUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUser));
    await AsyncStorage.removeItem(AUTH_STORAGE_FLAG_KEY);
  }, []);

  const hasCompletedProfile = useMemo(() => {
    if (!user) return false;
    return !!(user.name && user.phone && user.homeAddress);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      updateProfile,
      setHomeAddress,
      setRole,
      mockSignIn,
      signOut,
      clearProfile,
      hasCompletedProfile,
    }),
    [
      user,
      isLoading,
      updateProfile,
      setHomeAddress,
      setRole,
      mockSignIn,
      signOut,
      clearProfile,
      hasCompletedProfile,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
