
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Ranking } from '@/components/ranking';
import { AdminControls } from '@/components/admin-controls';
import { GameStatusControls } from '@/components/game-status-controls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Podium } from '@/components/podium';
import { ScoreChart } from '@/components/score-chart';
import { LogOut } from 'lucide-react';

const ADMIN_EMAIL = "nimsarabro81@gmail.com";

export default function AdminPage() {
  const { user, isUserLoading } = useFirebase();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }
    // If not loading, and user is not logged in OR is not the admin, redirect
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  // Show a loading/redirecting message while we verify the user
  if (isUserLoading || !user || user.email !== ADMIN_EMAIL) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
        <p>Verifying access...</p>
      </main>
    );
  }

  // If user is verified as admin, show the admin panel
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8 relative">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            Admin Panel
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Manage game settings and leaderboards.
          </p>
           <Button onClick={handleLogout} variant="outline" className="absolute top-0 right-0">
             <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
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
