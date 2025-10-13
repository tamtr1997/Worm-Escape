'use client';

import { Suspense } from 'react';
import LevelCreator from '@/components/game/LevelCreator';

function CreateLevelPageContent() {
  return <LevelCreator />;
}

export default function CreateLevelPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<div>Loading...</div>}>
        <CreateLevelPageContent />
      </Suspense>
    </main>
  );
}
