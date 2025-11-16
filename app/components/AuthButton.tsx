"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function getUser() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (mounted) setUser(u ?? null);
    }
    getUser();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      // @ts-ignore
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // redirect to home after sign-out
    try {
      router.push("/");
    } catch (e) {
      // ignore in non-browser env
    }
  };

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <div className="text-base text-zinc-900">{user.email}</div>
          <button
            onClick={signOut}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 inline-flex items-center hover:cursor-pointer whitespace-nowrap"
          >
            <span>Sign out</span>
          </button>
        </>
      ) : (
        <button
          onClick={signInWithGoogle}
          aria-label="Sign in with Google"
          className="inline-flex items-center border gap-3 rounded-md bg-white px-5 py-3 text-base font-semibold text-zinc-900 shadow-md ring-1 ring-zinc-100 hover:shadow-lg transform hover:scale-[1.01] transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 hover:cursor-pointer whitespace-nowrap"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M23.5 12.27c0-.82-.07-1.61-.2-2.38H12v4.52h6.45c-.28 1.5-1.12 2.77-2.39 3.62v3.01h3.86c2.26-2.08 3.58-5.15 3.58-8.77z" fill="#4285F4"/>
            <path d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.86-3.01c-1.08.72-2.47 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.98H1.18v3.12C3.15 21.9 7.32 24 12 24z" fill="#34A853"/>
            <path d="M5.25 14.26a7.2 7.2 0 010-4.52V6.62H1.18a11.98 11.98 0 000 10.76l4.07-3.12z" fill="#FBBC05"/>
            <path d="M12 4.77c1.76 0 3.34.6 4.58 1.77l3.44-3.44C17.95 1.12 15.23 0 12 0 7.32 0 3.15 2.1 1.18 5.62l4.07 3.12C6.2 6.89 8.86 4.77 12 4.77z" fill="#EA4335"/>
          </svg>
          <span className="translate-y-px">Sign in with Google</span>
          
        </button>
      )}
    </div>
  );
}
