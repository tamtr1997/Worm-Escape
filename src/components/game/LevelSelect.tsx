
'use client';

import { useRouter } from 'next/navigation';
import { useLevels } from '@/hooks/useLevels';
import { Lock, Unlock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function LevelSelect() {
  const { levels, highestLevelUnlocked, isLoading } = useLevels();
  const router = useRouter();

  const handleLevelSelect = (levelId: string) => {
    router.push(`/play/${levelId}`);
  };

  return (
    <section className="flex flex-col items-center justify-center flex-1 mt-20 mb-28 w-full px-4">
        <ScrollArea className="h-full w-full">
            <div className="grid grid-cols-4 gap-4 p-4">
                {levels.map((level) => {
                const isUnlocked = level.order <= highestLevelUnlocked;
                return (
                    <Button
                        key={level.id}
                        onClick={() => isUnlocked && handleLevelSelect(level.id)}
                        disabled={!isUnlocked}
                        className={cn(
                            "aspect-square h-16 w-16 rounded-lg text-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 border-4 border-white/30",
                            isUnlocked 
                                ? "bg-green-600/80 hover:bg-green-500/80" 
                                : "bg-gray-500/50"
                        )}
                        style={{
                            boxShadow: isUnlocked 
                                ? '0 4px 6px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
                                : '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                    {isUnlocked ? (
                        <>
                         <span className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">{String(level.order).padStart(2, '0')}</span>
                        </>
                    ) : (
                        <Lock className="h-8 w-8" />
                    )}
                    </Button>
                );
                })}
            </div>
        </ScrollArea>
    </section>
  );
}
