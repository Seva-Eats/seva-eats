import { supabase } from '@/lib/supabase';

export type UpsertRecipientProfileInput = {
  fullName: string;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type UpsertUserPreferencesInput = {
  dietaryRestrictions?: string[];
  notificationSms?: boolean;
  notificationEmail?: boolean;
  language?: string;
  notes?: string | null;
};

export async function upsertRecipientProfile(input: UpsertRecipientProfileInput) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.rpc('upsert_recipient_profile', {
    p_full_name: input.fullName,
    p_phone: input.phone ?? null,
    p_address_line1: input.addressLine1 ?? null,
    p_address_line2: input.addressLine2 ?? null,
    p_city: input.city ?? null,
    p_province: input.province ?? null,
    p_postal_code: input.postalCode ?? null,
    p_latitude: input.latitude ?? null,
    p_longitude: input.longitude ?? null,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertUserPreferences(input: UpsertUserPreferencesInput) {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.rpc('upsert_user_preferences', {
    p_dietary_restrictions: input.dietaryRestrictions ?? [],
    p_notification_sms: input.notificationSms ?? true,
    p_notification_email: input.notificationEmail ?? false,
    p_language: input.language ?? 'en',
    p_notes: input.notes ?? null,
  });

  if (error) {
    throw error;
  }

  return data;
}
