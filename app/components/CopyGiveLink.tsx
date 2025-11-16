"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

type Props = {
  inline?: boolean;
};

export default function CopyGiveLink({ inline = false }: Props) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [closing, setClosing] = useState(false);
  // refs for timers so we can clear on unmount
  const autoTimer = useRef<number | null>(null);
  const finishTimer = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) return setUsername(null);

  // fetch profile (use limit(1) and read array to avoid PostgREST single-object coercion)
  const { data } = await supabase.from("profiles").select("username").eq("id", user.id).limit(1);
  if (!mounted) return;
  const row = Array.isArray(data) && data[0] ? data[0] : null;
  if (row && row.username) setUsername(row.username);
      else {
        const email = user.email || "";
        setUsername(email.split("@")[0] || null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // clear timers on unmount
  useEffect(() => {
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, []);

  const copy = async () => {
    if (!username) return;
    setLoading(true);
    const link = `${window.location.origin}/give/${username}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setClosing(false);
      // auto-dismiss after 2s: start closing animation, then unmount
      autoTimer.current = window.setTimeout(() => {
        setClosing(true);
        finishTimer.current = window.setTimeout(() => {
          setCopied(false);
          setClosing(false);
        }, 200);
      }, 2000) as unknown as number;
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const containerClass = inline ? "inline-flex items-center" : "mt-4";
  const btnClass = inline
    ? "rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:shadow-lg disabled:opacity-60 hover:cursor-pointer"
    : "rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60 hover:cursor-pointer";

  return (
    <>
      <div className={containerClass}>
        <button onClick={copy} disabled={!username || loading} className={btnClass}>
          {loading ? "Copying…" : username ? `Copy` : "Set a username"}
        </button>
        {!username && <div className="ml-3 text-sm text-zinc-600">Set a public username to enable your give link.</div>}
      </div>

      {(copied || closing) && (
        <div aria-live="polite" className="fixed z-50 left-1/2 bottom-8 transform -translate-x-1/2">
          <div
            className={`max-w-md w-full rounded-lg bg-white p-3 shadow-lg border transition duration-200 ease-out transform ${copied && !closing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Give link copied</p>
                <p className="mt-1 text-xs text-zinc-600">Your /give link has been copied to the clipboard.</p>
              </div>
              <div className="flex items-start">
                <button
                  onClick={() => {
                    setClosing(true);
                    if (autoTimer.current) clearTimeout(autoTimer.current);
                    finishTimer.current = window.setTimeout(() => {
                      setCopied(false);
                      setClosing(false);
                    }, 200) as unknown as number;
                  }}
                  aria-label="Dismiss"
                  className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M6 18L18 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
