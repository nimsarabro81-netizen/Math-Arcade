
import { Ranking } from '@/components/ranking';
import { AdminControls } from '@/components/admin-controls';
import { GameStatusControls } from '@/components/game-status-controls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Podium } from '@/components/podium';
import { ScoreChart } from '@/components/score-chart';

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            Admin Panel
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage game settings and leaderboards.
          </p>
        </header>

        <GameStatusControls />

        <Tabs defaultValue="overview" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vectorzen">VectorZen</TabsTrigger>
            <TabsTrigger value="algebra">Algebra Arena</TabsTrigger>
            <TabsTrigger value="equation">Equation Equilibrium</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <section className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <Podium />
              </div>
              <div className="lg:col-span-3">
                <ScoreChart />
              </div>
            </section>
          </TabsContent>
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
