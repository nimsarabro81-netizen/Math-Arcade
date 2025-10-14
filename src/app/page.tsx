import { VectorZen } from '@/components/vector-zen';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-5xl space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            VectorZen
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            A playful game to master integers. Can you solve all the levels?
          </p>
        </header>
        <VectorZen />
      </div>
    </main>
  );
}
