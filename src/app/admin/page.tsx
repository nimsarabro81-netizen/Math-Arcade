
import { Ranking } from '@/components/ranking';
import { AdminControls } from '@/components/admin-controls';

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            Admin Panel
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage the VectorZen game leaderboards.
          </p>
        </header>
        <div className="space-y-12">
            <section>
                <AdminControls collectionName="userRanks" leaderboardName="VectorZen Leaderboard" />
                <div className="mt-4">
                    <Ranking collectionName="userRanks" title="VectorZen Leaderboard" />
                </div>
            </section>
            <section>
                <AdminControls collectionName="algebraRanks" leaderboardName="Algebra Arena Leaderboard" />
                 <div className="mt-4">
                    <Ranking collectionName="algebraRanks" title="Algebra Arena Leaderboard" />
                </div>
            </section>
        </div>
      </div>
    </main>
  );
}
