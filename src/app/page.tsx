
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { VectorZen } from '@/components/vector-zen';
import { MultiplicationZen } from '@/components/multiplication-zen';
import { Ranking } from '@/components/ranking';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
import { Award, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [gameMode, setGameMode] = useState<'addition' | 'multiplication'>('addition');
  
  // Lifted state
  const [username, setUsername] = useState('');
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
    if (!user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
  };
  
  const saveScore = useCallback((finalScoreValue: number) => {
    if (user && firestore) {
      const rankData = {
        userId: user.uid,
        username: username || 'Anonymous',
        score: finalScoreValue,
        lastUpdated: new Date().toISOString(),
      };
      const ranksCollection = collection(firestore, 'userRanks');
      addDocumentNonBlocking(ranksCollection, rankData);
    }
  }, [user, firestore, username]);

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsGameStarted(true);
      setStartTime(Date.now());
    } else {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter your name to start.',
      });
    }
  };

  const handleGameCompletion = (game: 'addition' | 'multiplication') => {
    if (game === 'addition') setAdditionComplete(true);
    if (game === 'multiplication') setMultiplicationComplete(true);
  };
  
  useEffect(() => {
    if (allGamesComplete) {
      let finalScoreValue = score;
      if (startTime) {
        const endTime = Date.now();
        const durationInSeconds = (endTime - startTime) / 1000;
        const timeBonus = Math.max(0, 100 - Math.floor(durationInSeconds));
        finalScoreValue += timeBonus;
      }
      setFinalScore(finalScoreValue);
      saveScore(finalScoreValue);
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
  
  const startOver = () => {
    setIsGameStarted(false);
    setUsername('');
    setScore(100);
    setStartTime(null);
    setAdditionComplete(false);
    setMultiplicationComplete(false);
    setFinalScore(null);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
       <Dialog open={!isGameStarted} onOpenChange={(isOpen) => !isOpen && isGameStarted && setIsGameStarted(true)}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleStartGame}>
            <DialogHeader>
              <DialogTitle>Welcome to VectorZen</DialogTitle>
              <DialogDescription>Enter your name to appear on the leaderboard.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="col-span-3"
                  placeholder="Your Name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Start Game</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            VectorZen
          </h1>
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
                    username={username}
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
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gamepad2 /> More Games</CardTitle>
                </CardHeader>
                <CardContent>
                    <Link href="/algebra">
                        <Button variant="outline">Algebra Arena</Button>
                    </Link>
                </CardContent>
            </Card>
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
                <Ranking />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
