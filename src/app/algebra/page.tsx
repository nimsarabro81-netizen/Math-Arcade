
'use client';

import { AlgebraArena } from '@/components/algebra-arena';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function AlgebraPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <Link href="/">
              <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
              Algebra Arena
              </h1>
          </Link>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            Drag, drop, and combine terms to simplify the expressions!
          </p>
        </header>
        <AlgebraArena />
      </div>
    </main>
  );
}
