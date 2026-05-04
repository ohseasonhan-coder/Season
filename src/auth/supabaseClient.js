import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase = isSupabaseConfigured
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
    })
  : null;

export function siteUrl() {
  return import.meta.env.VITE_APP_SITE_URL || window.location.origin;
}
