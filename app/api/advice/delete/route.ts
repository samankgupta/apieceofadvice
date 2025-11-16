import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Expect the caller to include the user's access token in the Authorization header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Resolve the user from the provided access token
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
    }
    const user = userData.user;

    // Find the advice row and its target_profile_id
    const { data: rows, error: fetchErr } = await supabase
      .from("advice")
      .select("id, target_profile_id")
      .eq("id", id)
        .limit(1);
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      const row = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const targetProfileId = row.target_profile_id as string | null;

    // Verify ownership: the advice must target the profile id equal to the authenticated user
    if (!targetProfileId || targetProfileId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Owner verified — perform the delete using the service-role client
    const { error: delErr } = await supabase.from("advice").delete().eq("id", id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
