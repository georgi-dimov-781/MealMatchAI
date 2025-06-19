/**
 * Next.js Configuration
 * 
 * This file contains configuration options for the Next.js application.
 * It handles environment variables, build settings, and deployment options.
 */

import type { NextConfig } from "next";

/**
 * Next.js configuration object
 * 
 * - env: Exposes environment variables to the client-side code
 */
const nextConfig: NextConfig = {  
  // Configure environment variables to be exposed to the client
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
