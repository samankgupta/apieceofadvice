import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username } = body || {};
    if (!username) return NextResponse.json({ error: "username is required" }, { status: 400 });

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
    const user = userData.user;

    // perform upsert using the service-role client (server-side)
    // onConflict 'id' ensures we update existing profile for the user
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username }, { onConflict: "id" });

    if (error) {
      // handle username unique violation explicitly
      const msg = (error?.message || "").toLowerCase();
      if (error?.code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message || "Could not save username" }, { status: 500 });
    }

    return NextResponse.json({ success: true, username });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
