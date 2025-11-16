import GiveForm from "./GiveForm";

type Props = {
  params: { username: string };
};

export default function GivePage({ params }: Props) {
  const username = params.username;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-rose-50 via-amber-50 to-sky-50 p-8">
      <main className="mx-auto max-w-2xl rounded-3xl bg-white/95 p-8 md:p-12 shadow-[0_20px_50px_rgba(2,6,23,0.06)] ring-1 ring-white/60 backdrop-blur-sm">
        <h1 className="mb-2 text-3xl md:text-4xl font-extrabold text-zinc-900">
          Give advice to <span className="text-rose-600">{username}</span>
        </h1>
        <p className="mb-6 text-base text-zinc-900">Write something kind, helpful, or funny. You may leave your name or be anonymous.</p>

        {/* Render client-side form component */}
        <GiveForm username={username} />
      </main>
    </div>
  );
}
