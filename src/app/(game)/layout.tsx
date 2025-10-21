export default function GameLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="h-dvh w-full bg-zinc-700 p-2">
      {/* Grid container to center the aspect-ratio box */}
      <div className="grid h-full w-full place-items-center">
        {/* The actual game content area with the correct aspect ratio and constraints */}
        <main className="relative aspect-[3/4] h-full max-h-full w-full max-w-full overflow-hidden bg-slate-900 shadow-2xl sm:rounded-2xl sm:border-8 sm:border-black">
          <div className="flex h-full w-full flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
