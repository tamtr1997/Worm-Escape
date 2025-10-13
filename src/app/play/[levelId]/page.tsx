'use client';

import { useParams, useSearchParams } from 'next/navigation';
import GameBoard from '@/components/game/GameBoard';

export default function PlayLevelPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const levelId = typeof params.levelId === 'string' ? params.levelId : '';
  const fromEditor = searchParams.get('from') === 'editor';

  if (!levelId) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p>Loading level...</p>
      </main>
    );
  }

  return <GameBoard levelId={levelId} isPlaytest={fromEditor} />;
}
