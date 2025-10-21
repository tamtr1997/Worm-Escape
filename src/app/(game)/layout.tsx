export default function GameLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-700">
      <main className="relative flex aspect-[3/4] h-dvh max-w-full flex-col overflow-hidden bg-slate-900 shadow-2xl sm:h-auto sm:max-h-[95dvh] sm:max-w-[392px] sm:rounded-2xl sm:border-8 sm:border-black">
        {children}
      </main>
    </div>
  );
}
