
'use client';

import { useState, useEffect, useCallback } from 'react';
import { EquationEquilibrium } from '@/components/equation-equilibrium';
import { Ranking } from '@/components/ranking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
import Link from 'next/link';
import { Award, Home } from 'lucide-react';

export default function EquationPage() {
    const [username, setUsername] = useState('');
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [score, setScore] = useState(100);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [isGameComplete, setIsGameComplete] = useState(false);
    const [finalScore, setFinalScore] = useState<number | null>(null);

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
        const ranksCollection = collection(firestore, 'equationRanks');
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
    
    const handleGameCompletion = () => {
        setIsGameComplete(true);
    };

    useEffect(() => {
        if (isGameComplete) {
            let finalScoreValue = score;
            if (startTime) {
                const endTime = Date.now();
                const durationInSeconds = (endTime - startTime) / 1000;
                const timeBonus = Math.max(0, 100 - Math.floor(durationInSeconds));
                finalScoreValue += timeBonus;
                toast({
                    title: `Time Bonus: +${timeBonus}`,
                    description: `You completed the game in ${durationInSeconds.toFixed(1)} seconds.`,
                });
            }
            setFinalScore(finalScoreValue);
            saveScore(finalScoreValue);
        }
    }, [isGameComplete, score, saveScore, startTime, toast]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <Dialog open={!isGameStarted} onOpenChange={(isOpen) => !isOpen && isGameStarted && setIsGameStarted(true)}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <form onSubmit={handleStartGame}>
            <DialogHeader>
              <DialogTitle>Welcome to Equation Equilibrium</DialogTitle>
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
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <Link href="/">
              <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
                Equation Equilibrium
              </h1>
          </Link>
          <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
            Keep the scale balanced to find the value of x!
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 relative">
                {isGameComplete && (
                     <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm z-20 rounded-lg">
                        <Award className="w-24 h-24 text-yellow-500 animate-bounce" />
                        <h2 className="text-4xl font-bold font-headline mt-4">You're a Master of Balance!</h2>
                        <p className="text-muted-foreground mt-2">Final Score: {finalScore ?? score}</p>
                         <Link href="/" passHref>
                          <Button variant="outline" className="mt-6">
                            <Home className="mr-2" /> Exit to Welcome Screen
                          </Button>
                        </Link>
                    </div>
                )}
                {isGameStarted ? (
                    <EquationEquilibrium 
                        score={score}
                        onScoreChange={handleScoreChange}
                        onGameComplete={handleGameCompletion}
                    />
                ) : (
                    <Card className="flex items-center justify-center min-h-[400px]">
                        <p className="text-muted-foreground">Enter your name to start the game!</p>
                    </Card>
                )}
            </div>
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">Score</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="font-mono text-5xl font-bold">{finalScore ?? score}</p>
                    </CardContent>
                </Card>
                <Ranking collectionName="equationRanks" title="Equation Leaderboard" />
            </div>
        </div>
      </div>
    </main>
  );
}
