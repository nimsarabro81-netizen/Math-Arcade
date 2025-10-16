
'use client'
import { VectorZen } from '@/components/vector-zen';
import { Ranking } from '@/components/ranking';
import Link from 'next/link';
import { useState } from 'react';

export default function PlayPage() {
  
  const [score, setScore] = useState(100);

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <Link href="/vector-zen">
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
              VectorZen
            </h1>
          </Link>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            A playful game to master integers. Can you top the leaderboard?
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <VectorZen 
                isGameStarted={true}
                username={"Player"}
                score={score}
                onScoreChange={handleScoreChange}
                onGameComplete={() => {}}
            />
          </div>
          <div className="lg:col-span-1">
            <Ranking collectionName="userRanks" />
          </div>
        </div>
      </div>
    </main>
  );
}
