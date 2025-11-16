"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdviceFeed from "../components/AdviceFeed";
import Image from "next/image";
import AuthButton from "../components/AuthButton";
import CopyGiveLink from "../components/CopyGiveLink";
import { supabase } from "../../lib/supabaseClient";

export default function Dashboard() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        router.push("/");
        return;
      }
      setChecking(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-rose-50 via-amber-50 to-sky-50 py-12">
      {/* Decorative subtle gradient blobs behind the dashboard */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute left-10 top-8 transform blur-3xl">
          <div className="rounded-full bg-gradient-to-br from-rose-100 via-amber-100 to-sky-100 opacity-40" />
        </div>
        <div className="absolute right-8 bottom-12 transform blur-2xl">
          <div className="rounded-full bg-gradient-to-tr from-indigo-50 to-cyan-50 opacity-25" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-6">
        <header className="mb-8 rounded-3xl bg-white/95 p-6 md:p-8 shadow-[0_12px_40px_rgba(2,6,23,0.06)] ring-1 ring-white/60 backdrop-blur-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900">Your advice inbox</h1>
              <div className="text-sm text-zinc-800">All the advice people left for you, in one place.</div>
            </div>

            <div className="mt-4 md:mt-0">
              <AuthButton />
            </div>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl bg-white p-6 md:p-8 shadow-md">
            <AdviceFeed />
          </div>
          <aside className="rounded-2xl bg-white p-6 md:p-8 shadow-md h-60">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-lg text-slate-800 font-bold">Share your give link</h2>
              <CopyGiveLink inline />
            </div>
            <p className="mb-4 text-sm text-zinc-800">Copy your public give link and share it with others so they can leave advice for you.</p>
            <p className="mt-4 text-sm text-zinc-800">Pro tip: pin your give link somewhere people can see it (bio, email signature, or Slack).</p>
          </aside>
        </div>
      </main>
    </div>
  );
}
