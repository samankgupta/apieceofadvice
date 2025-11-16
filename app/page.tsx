"use client";

import Image from "next/image";
import AuthButton from "./components/AuthButton";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function getUser() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(u ?? null);
      if (u) {
        // If user is signed in, go to dashboard
        router.push("/dashboard");
      }
    }
    getUser();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) router.push("/dashboard");
    });
    return () => {
      mounted = false;
      // @ts-ignore
      sub?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-tr from-rose-50 via-amber-100 to-sky-100">
      {/* Decorative subtle gradient blobs behind the card */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-10 -translate-x-1/2 transform blur-3xl">
          <div className="w-[780px] h-[420px] rounded-full bg-gradient-to-br from-rose-100 via-amber-100 to-sky-100 opacity-40" />
        </div>
        <div className="absolute right-10 bottom-20 transform blur-2xl">
          <div className="w-[420px] h-[240px] rounded-full bg-gradient-to-tr from-indigo-50 to-cyan-50 opacity-25" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl px-6 py-12 md:py-16">
        <div className="rounded-4xl bg-white/95 p-12 md:p-16 shadow-gray-800 ring-1 ring-white/60 backdrop-blur-sm border border-zinc-100 hover:border-zinc-200">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="flex items-center gap-4">
              {/* <div className="flex h-14 items-center rounded-md bg-linear-to-br from-rose-400 to-amber-400 px-4 py-2 shadow-md">
                <span className="text-lg font-bold text-zinc-900">APOA</span>
              </div> */}
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight bg-gradient-to-r from-zinc-800 via-stone-700 to-slate-800 bg-clip-text text-transparent">
                  A Piece Of Advice
                </h1>
                <p className="mb-2 text-sm font-extrabold sm:text-base text-stone-500 tracking-wider">Share & receive short, honest advice</p>
              </div>
            </div>

            <p className="max-w-2xl text-base md:text-lg text-slate-800">
              Take advice from strangers or people you know. <br/>
              For personal growth, product feedback, company culture, or anything in between.
            </p>
            <div className="mt-6">
              <AuthButton />
            </div>

            <p className="mt-4 text-sm text-zinc-800">No forms - Sign In with Google and get your share link.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
