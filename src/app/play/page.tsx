import { VectorZen } from '@/components/vector-zen';
import { Ranking } from '@/components/ranking';
import Link from 'next/link';

export default function PlayPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <Link href="/">
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
            <VectorZen />
          </div>
          <div className="lg:col-span-1">
            <Ranking />
          </div>
        </div>
        <footer className="text-center mt-8">
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary">
                Admin Panel
            </Link>
        </footer>
      </div>
    </main>
  );
}

    