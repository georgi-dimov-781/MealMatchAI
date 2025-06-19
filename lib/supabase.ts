/**
 * Supabase Client Configuration
 * 
 * This module initializes and exports the Supabase client for use throughout the application.
 * The Supabase URL and anon key are loaded from environment variables for security.
 * 
 * This client provides access to:
 * - Database operations via the Postgres interface
 * - Authentication (when implemented)
 * - Storage (for file uploads)
 * - Realtime subscriptions
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseKey);
