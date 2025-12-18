const { createClient } = require('@supabase/supabase-js');

// Supabase credentials (fall back to baked-in defaults for local dev)
const supabaseUrl = process.env.SUPABASE_URL || "https://brydisceqijgqloxjqel.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWRpc2NlcWlqZ3Fsb3hqcWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTU4MzIsImV4cCI6MjA3NDEzMTgzMn0.YilQpHU3tjxEjV3OZKKRepQBXbxy6QVNtMfB3npmTU0";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Create Supabase client for server-side operations
// Note: Using anon key - RLS policies must allow inserts
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseStorage = createClient(supabaseUrl, supabaseServiceRoleKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey);

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
	console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon key for storage operations.');
}

const createAuthedClient = (accessToken) => {
	if (!accessToken) {
		return supabase;
	}

	return createClient(supabaseUrl, supabaseAnonKey, {
		global: {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		}
	});
};

module.exports = { supabase, supabaseStorage, supabaseService, createAuthedClient };
