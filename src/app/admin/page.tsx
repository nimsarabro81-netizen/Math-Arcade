
import { Ranking } from '@/components/ranking';
import { AdminControls } from '@/components/admin-controls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            Admin Panel
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage the game leaderboards.
          </p>
        </header>
        <Tabs defaultValue="vectorzen" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vectorzen">VectorZen Leaderboard</TabsTrigger>
            <TabsTrigger value="algebra">Algebra Arena Leaderboard</TabsTrigger>
          </TabsList>
          <TabsContent value="vectorzen">
            <section className="mt-6 space-y-4">
              <AdminControls collectionName="userRanks" leaderboardName="VectorZen Leaderboard" />
              <Ranking collectionName="userRanks" title="VectorZen Leaderboard" />
            </section>
          </TabsContent>
          <TabsContent value="algebra">
            <section className="mt-6 space-y-4">
              <AdminControls collectionName="algebraRanks" leaderboardName="Algebra Arena Leaderboard" />
              <Ranking collectionName="algebraRanks" title="Algebra Arena Leaderboard" />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
