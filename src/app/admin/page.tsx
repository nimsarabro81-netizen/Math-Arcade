
import { Ranking } from '@/components/ranking';
import { AdminControls } from '@/components/admin-controls';
import { GameStatusControls } from '@/components/game-status-controls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            Admin Panel
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage game settings and leaderboards.
          </p>
        </header>

        <GameStatusControls />

        <Tabs defaultValue="vectorzen" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vectorzen">VectorZen</TabsTrigger>
            <TabsTrigger value="algebra">Algebra Arena</TabsTrigger>
            <TabsTrigger value="equation">Equation Equilibrium</TabsTrigger>
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
          <TabsContent value="equation">
            <section className="mt-6 space-y-4">
                <AdminControls collectionName="equationRanks" leaderboardName="Equation Equilibrium Leaderboard" />
                <Ranking collectionName="equationRanks" title="Equation Equilibrium Leaderboard" />
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
