
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { VectorZen } from '@/components/vector-zen';
import { MultiplicationZen } from '@/components/multiplication-zen';
import { Ranking } from '@/components/ranking';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { Award, Gamepad2, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayerIdentity } from '@/hooks/use-player-identity';
import { useRouter } from 'next/navigation';

export default function VectorZenPage() {
  const [gameMode, setGameMode] = useState<'addition' | 'multiplication'>('addition');
  
  const { identity, isIdentityLoaded } = usePlayerIdentity();
  const router = useRouter();

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [score, setScore] = useState(100);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [additionComplete, setAdditionComplete] = useState(false);
  const [multiplicationComplete, setMultiplicationComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const allGamesComplete = additionComplete && multiplicationComplete;

  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const auth = useAuth();

  useEffect(() => {
    if (isIdentityLoaded && !identity) {
      router.push('/');
    } else if (identity) {
      setIsGameStarted(true);
      setStartTime(Date.now());
    }
  }, [identity, isIdentityLoaded, router]);

  useEffect(() => {
    if (!user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
  };
  
  const saveScore = useCallback((finalScoreValue: number, duration: number) => {
    if (user && firestore && identity) {
      const rankData = {
        userId: user.uid,
        username: identity.username,
        avatar: identity.avatar,
        score: finalScoreValue,
        duration: duration,
        lastUpdated: new Date().toISOString(),
      };
      const rankDocRef = doc(firestore, 'userRanks', user.uid);
      setDocumentNonBlocking(rankDocRef, rankData, { merge: true });
    }
  }, [user, firestore, identity]);


  const handleGameCompletion = (game: 'addition' | 'multiplication') => {
    if (game === 'addition') setAdditionComplete(true);
    if (game === 'multiplication') setMultiplicationComplete(true);
  };
  
  useEffect(() => {
    if (allGamesComplete) {
      let finalScoreValue = score;
      let durationInSeconds = 0;
      if (startTime) {
        const endTime = Date.now();
        durationInSeconds = (endTime - startTime) / 1000;
        const timeBonus = Math.max(0, 100 - Math.floor(durationInSeconds));
        finalScoreValue += timeBonus;
      }
      setFinalScore(finalScoreValue);
      saveScore(finalScoreValue, durationInSeconds);
    }
  }, [allGamesComplete, score, saveScore, startTime]);

  useEffect(() => {
    if (finalScore !== null && startTime) {
      const durationInSeconds = (Date.now() - startTime) / 1000;
      const timeBonus = Math.max(0, 100 - Math.floor(durationInSeconds));
      toast({
        title: `Time Bonus: +${timeBonus}`,
        description: `You completed the game in ${durationInSeconds.toFixed(1)} seconds.`,
      });
    }
  }, [finalScore, startTime, toast]);

  if (!isIdentityLoaded || !identity) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
        <p>Loading or redirecting...</p>
      </main>
    );
  }

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
            A playful set of games to master integers and algebra. Can you top the leaderboard?
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 relative">
             {allGamesComplete && (
                <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm z-20 rounded-lg">
                  <Award className="w-24 h-24 text-yellow-500 animate-bounce" />
                  <h2 className="text-4xl font-bold font-headline mt-4">You're a VectorZen Master!</h2>
                  <p className="text-muted-foreground mt-2">Final Score: {finalScore ?? score}</p>
                   <Link href="/" passHref>
                    <Button variant="outline" className="mt-6">
                      <Home className="mr-2" /> Exit to Welcome Screen
                    </Button>
                  </Link>
                </div>
              )}
            <Tabs value={gameMode} onValueChange={(value) => setGameMode(value as any)} className={cn("w-full", allGamesComplete && "blur-sm")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="addition" disabled={allGamesComplete}>Addition & Subtraction</TabsTrigger>
                <TabsTrigger value="multiplication" disabled={allGamesComplete}>Multiplication</TabsTrigger>
              </TabsList>
              <TabsContent value="addition">
                <VectorZen
                    isGameStarted={isGameStarted}
                    username={identity.username}
                    score={score}
                    onScoreChange={handleScoreChange}
                    onGameComplete={() => handleGameCompletion('addition')}
                />
              </TabsContent>
              <TabsContent value="multiplication">
                <MultiplicationZen 
                    isGameStarted={isGameStarted}
                    score={score}
                    onScoreChange={handleScoreChange}
                    onGameComplete={() => handleGameCompletion('multiplication')}
                />
              </TabsContent>
            </Tabs>
          </div>
          <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="text-center">Score</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="font-mono text-5xl font-bold">{finalScore ?? score}</p>
                </CardContent>
             </Card>
            <div className="mt-8">
                <Ranking collectionName="userRanks" title="VectorZen Leaderboard" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
