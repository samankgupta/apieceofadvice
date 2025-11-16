import GiveForm from "../GiveForm";
import supabaseAdmin from "../../../lib/supabaseServer";

type Props = {
  params: { username: string };
};

export default async function GivePage(props: Props) {
  // `props.params` can be a Promise in Next.js App Router; await it before using.
  const params = await props.params;
  const username = params.username;

  // Check whether the username exists in the public profiles table.
  const supabase = supabaseAdmin();
  const { data: profileData, error } = await supabase.from("profiles").select("id, username").eq("username", username).limit(1);
  const profile = Array.isArray(profileData) && profileData[0] ? profileData[0] : null;

  if (error) {
    // If the DB errored, show a simple friendly message.
    return (
      <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-amber-50 to-sky-50 p-8">
        <main className="mx-auto max-w-2xl rounded-3xl bg-white/95 p-8 md:p-12 shadow-[0_20px_50px_rgba(2,6,23,0.06)] ring-1 ring-white/60 backdrop-blur-sm">
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">Something went wrong</h1>
          <p className="text-sm text-zinc-700">We had trouble checking that username. Please try again later.</p>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-amber-50 to-sky-50 p-8">
        <main className="mx-auto max-w-2xl rounded-3xl bg-white/95 p-8 md:p-12 shadow-[0_20px_50px_rgba(2,6,23,0.06)] ring-1 ring-white/60 backdrop-blur-sm">
          <h1 className="mb-2 text-2xl font-bold text-zinc-900">Username not found</h1>
          <p className="text-sm text-zinc-700">We couldn't find a user with the username <strong className="text-emerald-600">{username}</strong>.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-amber-50 to-sky-50 p-8">
      <main className="mx-auto max-w-2xl rounded-3xl bg-white/95 p-8 md:p-12 shadow-[0_20px_50px_rgba(2,6,23,0.06)] ring-1 ring-white/60 backdrop-blur-sm">
        <h1 className="mb-2 text-3xl md:text-4xl font-extrabold text-zinc-900">
          Give advice to <span className="text-emerald-600">{username}</span>
        </h1>
        <p className="mb-6 text-base text-zinc-900">Write something kind, helpful, or funny. You may leave your name or be anonymous.</p>

        <GiveForm username={username} />
      </main>
    </div>
  );
}
