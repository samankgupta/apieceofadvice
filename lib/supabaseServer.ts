import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key.
// WARNING: keep SUPABASE_SERVICE_ROLE_KEY secret and only set it on the server (Vercel/Netlify/Supabase Edge Runtime env).
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );

export default supabaseAdmin;
