
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useLevels } from '@/hooks/useLevels';
import { PlusCircle, Play, Trash2, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WormIcon } from '@/components/icons/WormIcon';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { levels, highestLevelUnlocked, resetProgress, isLoading } = useLevels();
  const router = useRouter();

  const handlePlay = (levelId: string) => {
    router.push(`/play/${levelId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 font-body">
      <div className="w-full max-w-5xl">
        <header className="text-center mb-12 flex flex-col items-center">
          <WormIcon className="w-24 h-auto text-accent mb-4" />
          <h1 className="text-5xl md:text-7xl font-bold text-white font-headline drop-shadow-lg">Worm Escape</h1>
          <p className="text-lg text-white/80 mt-4 max-w-2xl">A slippery puzzle game. Slide the blocks to free the worm!</p>
        </header>
        
        <div className="flex justify-center mb-10 gap-4">
          <Link href="/create" passHref>
            <Button size="lg" variant="secondary" className="shadow-md hover:shadow-lg transition-shadow bg-white/90 text-primary hover:bg-white">
              <PlusCircle className="mr-2 h-5 w-5" />
              Level Editor
            </Button>
          </Link>
           <Button size="lg" variant="destructive" onClick={resetProgress} className="shadow-md hover:shadow-lg transition-shadow">
              <Trash2 className="mr-2 h-5 w-5" />
              Reset Progress
            </Button>
        </div>

        <section>
          <h2 className="text-3xl font-semibold mb-6 text-center text-white/90">Levels</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-primary/50 border-primary/70">
                  <CardHeader>
                    <Skeleton className="h-6 w-24 bg-white/10" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-32 bg-white/10" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-24 bg-white/10" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : levels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((level) => {
                const isUnlocked = level.order <= highestLevelUnlocked;
                return (
                <Card key={level.id} className={`flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 bg-primary/40 border-primary/60 ${!isUnlocked ? 'bg-primary/20 brightness-75' : ''}`}>
                  <CardHeader>
                    <CardTitle className="truncate flex items-center justify-between text-white/90">
                      <span>Level {level.order}</span>
                      {isUnlocked ? <Unlock className="h-4 w-4 text-green-400" /> : <Lock className="h-4 w-4 text-white/50" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-white/60">
                      A {level.cols}x{level.rows} puzzle.
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Button onClick={() => handlePlay(level.id)} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={!isUnlocked}>
                      <Play className="mr-2 h-4 w-4" /> Play
                    </Button>
                  </CardFooter>
                </Card>
              )})}
            </div>
          ) : (
             <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg border-white/20">
                <h3 className="text-xl font-medium text-white/70">No levels yet!</h3>
                <p className="text-white/60 mt-2">Go to the Level Editor to create your first level.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
