import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a server-side supabase client using the service role key.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Simple in-memory rate limiter
// NOTE: this is for local/dev or low-traffic use. For production, use Redis or your platform's rate limit features.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 10; // max submissions per IP per window
const ipMap: Map<string, { count: number; firstSeen: number }> = new Map();

function getIp(req: Request) {
  // Try common headers used by proxies / platforms
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  // Fallback (may be localhost during dev)
  return "127.0.0.1";
}

export async function POST(req: Request) {
  try {
    const ip = getIp(req);
    const now = Date.now();
    const entry = ipMap.get(ip);
    if (!entry) {
      ipMap.set(ip, { count: 1, firstSeen: now });
    } else {
      // reset if window expired
      if (now - entry.firstSeen > RATE_LIMIT_WINDOW_MS) {
        ipMap.set(ip, { count: 1, firstSeen: now });
      } else {
        entry.count += 1;
        ipMap.set(ip, entry);
        if (entry.count > MAX_PER_WINDOW) {
          return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }
      }
    }

    const body = await req.json();
    const { target_username, content, from_name, is_anonymous } = body;
    if (!target_username || !content) {
      return NextResponse.json({ error: "target_username and content are required" }, { status: 400 });
    }

    // Resolve the profile by username. We store target_profile_id (stable) so
    // username changes don't affect previously-submitted advice.
    const { data: profileData, error: profileErr } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", target_username)
      .limit(1);
    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
    const profile = Array.isArray(profileData) && profileData[0] ? profileData[0] : null;
    if (!profile) return NextResponse.json({ error: "Target user not found" }, { status: 404 });

    const insert = {
      target_username: profile.username, // keep the username for readability
      target_profile_id: profile.id,
      content,
      from_name: is_anonymous ? null : from_name || null,
      is_anonymous: Boolean(is_anonymous),
    } as any;

    const { error } = await supabase.from("advice").insert(insert);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
