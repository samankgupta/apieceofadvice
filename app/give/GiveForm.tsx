"use client";

import { useState } from "react";

export default function GiveForm({ username }: { username: string }) {
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setLoading(true);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_username: username,
          content,
          from_name: anonymous ? null : name || null,
          is_anonymous: anonymous,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess("Thanks - your advice was sent!");
        setContent("");
        setName("");
        setAnonymous(false);
      } else {
        setSuccess(json?.error || "There was an error sending your advice.");
      }
    } catch (err) {
      setSuccess("Network or server error");
    }

    setLoading(false);
  };

  const copyLink = async () => {
    // copy-button removed per UX change
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        placeholder="Write your advice here"
        className="w-full rounded-lg border border-zinc-200 p-4 text-base text-zinc-800 placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-100"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className={`w-full rounded-lg border border-zinc-200 px-4 py-2 text-base text-zinc-800 shadow-sm disabled:opacity-60`}
            disabled={anonymous}
          />
          
        </div>

        <div className="flex items-center gap-3">
          {/* copy button removed on give page; sharing is in the dashboard */}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-lg bg-sky-600 px-6 py-2 h-11 text-base font-semibold text-white shadow-md hover:bg-sky-700 disabled:opacity-60 hover:cursor-pointer whitespace-nowrap"
          >
            <span>{loading ? "Sending…" : "Send advice"}</span>
          </button>
        </div>
      </div>
        
        <label className="inline-flex items-center gap-2 text-sm text-zinc-900">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            <span>Submit anonymously</span>
        </label>

      {success && (
        <div className="mt-2 inline-block rounded-md bg-green-50 px-3 py-1 text-sm text-green-700">{success}</div>
      )}
    </form>
  );
}
