
'use client';

import { useState } from 'react';
import { VectorZen } from '@/components/vector-zen';
import { MultiplicationZen } from '@/components/multiplication-zen';
import { Ranking } from '@/components/ranking';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const [gameMode, setGameMode] = useState<'addition' | 'multiplication'>('addition');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            VectorZen
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            A playful game to master integers. Can you top the leaderboard?
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs value={gameMode} onValueChange={(value) => setGameMode(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="addition">Addition & Subtraction</TabsTrigger>
                <TabsTrigger value="multiplication">Multiplication</TabsTrigger>
              </TabsList>
              <TabsContent value="addition">
                <VectorZen />
              </TabsContent>
              <TabsContent value="multiplication">
                <MultiplicationZen />
              </TabsContent>
            </Tabs>
          </div>
          <div className="lg:col-span-1">
            <Ranking />
          </div>
        </div>
      </div>
    </main>
  );
}
