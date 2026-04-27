import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session ?? null;
}

type OtpType = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email' | 'email_change';

function parseHashParams(urlString: string) {
  const hash = new URL(urlString).hash;
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

function normalizeOtpType(value: string | null): OtpType | null {
  if (
    value === 'signup' ||
    value === 'magiclink' ||
    value === 'recovery' ||
    value === 'invite' ||
    value === 'email' ||
    value === 'email_change'
  ) {
    return value;
  }
  return null;
}

export async function completeAuthFromUrl(urlString: string) {
  if (!supabase) return false;

  const url = new URL(urlString);
  const hashParams = parseHashParams(urlString);

  const code = url.searchParams.get('code') ?? hashParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }

  const accessToken = url.searchParams.get('access_token') ?? hashParams.get('access_token');
  const refreshToken = url.searchParams.get('refresh_token') ?? hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return true;
  }

  const tokenHash = url.searchParams.get('token_hash') ?? hashParams.get('token_hash');
  const otpType = normalizeOtpType(
    url.searchParams.get('type') ?? hashParams.get('type')
  );
  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (error) throw error;
    return true;
  }

  return false;
}
