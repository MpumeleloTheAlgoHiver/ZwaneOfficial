import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

// ── Fetch public config from server (reads env vars at runtime) ──
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
    const envRes = await fetch('/api/env-config');
    if (envRes.ok) {
        const envData = await envRes.json();
        supabaseUrl = envData.SUPABASE_URL || '';
        supabaseAnonKey = envData.SUPABASE_ANON_KEY || '';
    }
} catch (e) {
    console.error('Failed to load env config:', e);
}

// --- Sanity Check ---
if (!supabaseUrl || !supabaseAnonKey) {
    const body = document.querySelector('body');
    if (body) {
        body.innerHTML = `
            <div style="padding: 2rem; text-align: center; font-family: sans-serif; background-color: #fff5f5; color: #c53030; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;">
                <h1 style="font-size: 1.5rem; font-weight: bold;">Configuration Error</h1>
                <p>Supabase configuration could not be loaded. Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in your environment variables.</p>
            </div>
        `;
    }
    throw new Error('Supabase credentials are missing. Set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.');
}

// Create and export the Supabase client with session-only storage
// This ensures tokens are cleared when browser closes (production security)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage, // Session expires on browser close
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Global auth state listener - logs out admin if session becomes invalid
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
    // Only redirect if we're not already on login page
    if (!window.location.pathname.includes('/auth/login')) {
      console.log('🔒 Admin session expired - redirecting to login');
      window.location.replace('/auth/login.html');
    }
  }
});
