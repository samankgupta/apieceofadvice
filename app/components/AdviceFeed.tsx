"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Advice = {
  id: string;
  content: string;
  from_name?: string | null;
  is_anonymous?: boolean;
  created_at?: string;
};

export default function AdviceFeed() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string>("");
  const [editingUsername, setEditingUsername] = useState<string>("");
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(u ?? null);
      if (u) {
        // load profile data (username) from server
        await loadProfile(u.id);
      }
    }
    fetchUser();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      // @ts-ignore
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // helper to (re)load profile username for a given user id
  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId);
        if (!error && Array.isArray(data) && data[0] && data[0].username) {
          setUsername(data[0].username);
          setEditingUsername(data[0].username);
        } else {
        // default username derived from auth email prefix if profile missing
        const { data: ud } = await supabase.auth.getUser();
        const u = ud?.user;
        const email = u?.email || "";
        const prefix = email.split("@")[0] || "";
        setEditingUsername(prefix);
        setUsername(prefix);
      }
    } catch (e) {
      // ignore and keep current state
    }
  }

  useEffect(() => {
    // fetch advice for the currently signed-in user's profile id
    if (!user?.id) return;
    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function fetchAdvice() {
    setLoading(true);
    const { data, error } = await supabase
      .from("advice")
      .select("id, content, from_name, is_anonymous, created_at")
      .eq("target_profile_id", user?.id)
      .order("created_at", { ascending: false });
    if (!error && data) setAdvice(data as Advice[]);
    setLoading(false);
  }

  async function saveUsername() {
    if (!user || !editingUsername) return;
    setUsernameError(null);
    // Use server API to perform a verified upsert (prevents RLS failures client-side)
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setUsernameError("You must be signed in to change your username.");
      return;
    }

    const res = await fetch("/api/profile/upsert", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username: editingUsername }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 409) {
        setUsernameError(payload?.error || "That username is already taken. Try another one.");
      } else {
        setUsernameError(payload?.error || "Could not save username. Please try again.");
      }
      return;
    }

    // success
    // Optimistically show the new username immediately (use server-returned value when present),
    // then re-load the canonical profile to avoid eventual-consistency races.
    const newName = payload?.username || editingUsername;
    setUsername(newName);
    setEditingUsername(newName);
    setUsernameError(null);
    // reload canonical value in background
    loadProfile(user.id).catch(() => {});
    alert("Username saved - your give link is /give/" + editingUsername);
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      // Use server-side API to perform a verified delete. This sends the
      // user's access token in the Authorization header so the server can
      // verify ownership before using the service role key to delete.
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setDeleteError("You must be signed in to delete advice.");
        setDeleteLoading(false);
        return;
      }

      const res = await fetch("/api/advice/delete", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: confirmDeleteId }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(payload?.error || "Could not delete advice");
      } else {
        if (payload?.success) {
          setAdvice((prev) => prev.filter((x) => x.id !== confirmDeleteId));
          setConfirmDeleteId(null);
        } else {
          setDeleteError(payload?.error || "Could not delete advice");
        }
      }
    } catch (e) {
      setDeleteError("Network error");
    }
    setDeleteLoading(false);
  }

  const copyLink = async () => {
    if (!username) return;
    const link = `${window.location.origin}/give/${username}`;
    await navigator.clipboard.writeText(link);
    alert("Link copied to clipboard: " + link);
  };

  return (
    <div className="w-full text-zinc-900">

  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={editingUsername}
          onChange={(e) => {
            setEditingUsername(e.target.value);
            setUsernameError(null);
          }}
          placeholder="Choose a public username"
          className="w-full rounded border px-4 py-2 text-base"
        />
        {usernameError && <div className="mt-2 text-sm text-red-600">{usernameError}</div>}
        <div className="flex gap-3">
          <button
            onClick={saveUsername}
            disabled={!user || !editingUsername || editingUsername === username}
            className={`rounded-lg px-5 py-2 min-w-[140px] h-11 text-base inline-flex items-center justify-center whitespace-nowrap shadow-sm
              ${editingUsername === username || !editingUsername || !user ? "bg-green-400 text-white cursor-not-allowed opacity-70" : "bg-green-600 text-white hover:cursor-pointer hover:shadow-md"}`}
          >
            <span>Save username</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xl font-extrabold text-stone-800">Pieces of advice</h3>
        {loading ? (
          <div>Loading…</div>
        ) : !username ? (
          <div className="text-sm text-zinc-800">Set a username to see incoming advice.</div>
        ) : advice.length === 0 ? (
          <div className="text-sm text-zinc-800">No advice yet - share your link!</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {advice.map((a) => (
              <li key={a.id} className="rounded border p-3 relative">
                <div className="text-sm text-zinc-900">{a.content}</div>
                <div className="mt-2 text-xs text-zinc-700">
                  From: {a.is_anonymous ? "Anonymous" : a.from_name ?? "(unknown)"} •{' '}
                  {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                </div>
                {/* show delete icon for owner (user with matching username) */}
                {user && username && (
                  <button
                    onClick={() => setConfirmDeleteId(a.id)}
                    aria-label="Delete advice"
                    className="absolute right-3 top-3 rounded-md text-zinc-500 hover:text-rose-600 hover:cursor-pointer"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.069l-.867 12.142A2 2 0 0 1 17.069 22H6.93a2 2 0 0 1-1.995-1.858L4.07 8H3a1 1 0 0 1 0-2h4V4zm2 2h6V4H9v2zM6.074 8l.857 12H17.07l.857-12H6.074zM10 10a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z"/>
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 text-center shadow-lg">
            <h3 className="text-lg font-semibold">Delete advice?</h3>
            <p className="mt-2 text-sm text-zinc-700">This will permanently delete the selected advice. Are you sure?</p>
            {deleteError && <div className="mt-3 text-sm text-red-600">{deleteError}</div>}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-md hover:cursor-pointer px-4 py-2 border"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="rounded-md hover:cursor-pointer bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
