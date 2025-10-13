'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useLevels } from '@/hooks/useLevels';
import { PlusCircle, Play, Trash2, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WormIcon } from '@/components/icons/WormIcon';

export default function Home() {
  const { levels, highestLevelUnlocked, resetProgress } = useLevels();
  const router = useRouter();

  const handlePlay = (levelId: string) => {
    router.push(`/play/${levelId}`);
  };
  
  const sortedLevels = [...levels].sort((a, b) => a.order - b.order);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-background font-body">
      <div className="w-full max-w-5xl">
        <header className="text-center mb-12 flex flex-col items-center">
          <WormIcon className="w-24 h-auto text-primary mb-4" />
          <h1 className="text-5xl md:text-7xl font-bold text-primary font-headline">Worm Escape</h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl">A slippery puzzle game. Slide the blocks to free the worm!</p>
        </header>
        
        <div className="flex justify-center mb-10 gap-4">
          <Link href="/create" passHref>
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-shadow">
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
          <h2 className="text-3xl font-semibold mb-6 text-center text-primary/90">Levels</h2>
          {sortedLevels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedLevels.map((level) => {
                const isUnlocked = level.order <= highestLevelUnlocked;
                return (
                <Card key={level.id} className={`flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 bg-card ${!isUnlocked ? 'bg-muted/50' : ''}`}>
                  <CardHeader>
                    <CardTitle className="truncate flex items-center justify-between">
                      <span>Level {level.order}</span>
                      {isUnlocked ? <Unlock className="h-4 w-4 text-green-500" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      A {level.cols}x{level.rows} puzzle.
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <Button onClick={() => handlePlay(level.id)} className="bg-primary/90 hover:bg-primary" disabled={!isUnlocked}>
                      <Play className="mr-2 h-4 w-4" /> Play
                    </Button>
                  </CardFooter>
                </Card>
              )})}
            </div>
          ) : (
             <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg border-border">
                <h3 className="text-xl font-medium text-muted-foreground">No levels yet!</h3>
                <p className="text-muted-foreground mt-2">Go to the Level Editor to create your first level.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
