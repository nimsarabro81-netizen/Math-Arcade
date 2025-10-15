
import { Ranking } from '@/components/ranking';
import { AdminControls } from '@/components/admin-controls';

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            Admin Panel
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage the VectorZen game leaderboard.
          </p>
        </header>
        <div className="space-y-8">
          <AdminControls />
          <div>
            <h2 className="text-2xl font-headline font-bold text-center mb-4">Leaderboard Preview</h2>
            <Ranking />
          </div>
        </div>
      </div>
    </main>
  );
}
