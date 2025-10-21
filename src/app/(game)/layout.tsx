export default function GameLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-700">
      <main className="relative flex h-full max-h-dvh w-full max-w-[392px] flex-col overflow-hidden rounded-2xl border-4 border-black bg-slate-900 shadow-2xl sm:border-8 sm:aspect-[3/4] sm:h-auto sm:max-h-[95dvh]">
        {children}
      </main>
    </div>
  );
}
