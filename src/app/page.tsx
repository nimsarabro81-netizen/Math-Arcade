import { VectorZen } from '@/components/vector-zen';

export default function Home() {
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
            <VectorZen />
          </div>
          <div className="lg:col-span-1">
            <h2 className="font-headline text-3xl font-bold text-center mb-4">Leaderboard</h2>
            {/* The Ranking component will be created in the next step */}
          </div>
        </div>
      </div>
    </main>
  );
}
