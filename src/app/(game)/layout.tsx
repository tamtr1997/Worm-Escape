export default function GameLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-zinc-700 p-2">
      {/* Container for the 9:16 phone-like frame */}
      <div className="relative flex h-full w-auto aspect-[9/16] max-w-full flex-col">
        {/* The actual game content area */}
        <main className="relative flex h-full w-full flex-col overflow-hidden bg-slate-900 shadow-2xl sm:rounded-2xl sm:border-8 sm:border-black">
          {children}
        </main>
      </div>
    </div>
  );
}
