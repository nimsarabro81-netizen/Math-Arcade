import { VectorZen } from '@/components/vector-zen';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl space-y-8">
        <header className="text-center">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            VectorZen
          </h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            A playful way to understand integers. Convert numbers to balls, pair them up, and solve equations visually.
          </p>
        </header>
        <VectorZen />
      </div>
    </main>
  );
}
