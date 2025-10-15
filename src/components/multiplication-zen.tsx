
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Ball } from '@/components/ball';
import { ArrowRight, RotateCw, ChevronLeft, ChevronRight, CheckCircle2, Award, Repeat, Copy, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useAuth, useFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
import { Label } from './ui/label';

type BallType = {
  id: number;
  value: 1 | -1 | 0.5 | -0.5;
};

type AnimatedBall = BallType & {
  state: 'entering' | 'idle' | 'exiting';
};

const levels = ['3 x 2', '3 x -2', '-3 x 2', '-3 x -2'];

let nextId = 0;

const getEquationParts = (equation: string): { factor1: number, factor2: number, answer: number } => {
  const parts = equation.split('x').map(s => s.trim());
  const factor1 = parseInt(parts[0], 10);
  const factor2 = parseInt(parts[1], 10);
  return { factor1, factor2, answer: factor1 * factor2 };
};

export function MultiplicationZen() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [equation, setEquation] = useState({ factor1: 0, factor2: 0, answer: 0 });
  
  const [group, setGroup] = useState<AnimatedBall[]>([]);
  const [stampedGroups, setStampedGroups] = useState<AnimatedBall[][]>([]);
  const [finalBalls, setFinalBalls] = useState<AnimatedBall[]>([]);
  
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  
  const { toast } = useToast();

  const setupLevel = useCallback((levelIndex: number) => {
    const eq = getEquationParts(levels[levelIndex]);
    setEquation(eq);
    
    const initialGroupValue = eq.factor2;
    const initialGroup: AnimatedBall[] = [];
    const full = Math.floor(Math.abs(initialGroupValue));
    for (let i = 0; i < full; i++) {
      initialGroup.push({ id: nextId++, value: Math.sign(initialGroupValue) as 1 | -1, state: 'entering' });
    }
    
    setGroup(initialGroup);
    setStampedGroups([]);
    setFinalBalls([]);
    setIsFlipped(false);
    setIsLevelSolved(false);
    setUserAnswer('');
  }, []);

  useEffect(() => {
    setupLevel(currentLevelIndex);
  }, [currentLevelIndex, setupLevel]);

  const handleStamp = () => {
    if (stampedGroups.length >= Math.abs(equation.factor1)) {
        toast({ title: "Max groups reached!", description: "You've already created the required number of groups."});
        return;
    }
    const newGroup = group.map(ball => ({...ball, id: nextId++}));
    setStampedGroups(prev => [...prev, newGroup]);
  };

  const handleFlip = () => {
    if (equation.factor1 > 0) {
        toast({ variant: "destructive", title: "Can't flip!", description: "You only flip when the first number is negative."});
        return;
    }
    if (isFlipped) {
        toast({ variant: "destructive", title: "Already flipped!", description: "You can only flip once!"});
        return;
    }

    const allStampedBalls = stampedGroups.flat();
    setFinalBalls(allStampedBalls.map(b => ({ ...b, value: -b.value as BallType['value'] })));
    setIsFlipped(true);
  };
  
  useEffect(() => {
    if (equation.factor1 > 0) {
        setFinalBalls(stampedGroups.flat());
    }
  }, [stampedGroups, equation.factor1]);


  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLevelSolved) return;

    if (stampedGroups.length !== Math.abs(equation.factor1)) {
        toast({ variant: 'destructive', title: 'Not enough groups!', description: `You need to stamp ${Math.abs(equation.factor1)} groups.`});
        return;
    }
    
    if (equation.factor1 < 0 && !isFlipped) {
        toast({ variant: 'destructive', title: 'Flip required!', description: "The first number is negative, so you need to flip the signs."});
        return;
    }

    const currentResult = finalBalls.reduce((sum, b) => sum + b.value, 0);

    if (parseFloat(userAnswer) === currentResult && parseFloat(userAnswer) === equation.answer) {
      setIsLevelSolved(true);
      toast({
        title: 'Correct!',
        description: 'You solved the multiplication problem!',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Not quite!',
        description: 'Your answer is incorrect. Check your groups and flips.',
      });
    }
  };
  
  const resetLevel = () => setupLevel(currentLevelIndex);
  
  const goToNextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
    }
  };

  const goToPrevLevel = () => {
    if (currentLevelIndex > 0) {
      setCurrentLevelIndex(prev => prev - 1);
    }
  };
  
  const allLevelsComplete = isLevelSolved && currentLevelIndex === levels.length - 1;

  return (
    <Card className="w-full shadow-xl overflow-hidden border-primary/10 transition-all">
      <CardHeader className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={goToPrevLevel} variant="outline" size="icon" aria-label="Previous Level" disabled={currentLevelIndex === 0}>
              <ChevronLeft />
            </Button>
            <div className="text-center px-4">
              <p className="text-sm font-medium text-muted-foreground">Level {currentLevelIndex + 1}</p>
              <p className="font-mono text-2xl sm:text-3xl font-bold">{levels[currentLevelIndex]}</p>
            </div>
            <Button onClick={goToNextLevel} variant="outline" size="icon" aria-label="Next Level" disabled={!isLevelSolved || allLevelsComplete}>
              <ChevronRight />
            </Button>
          </div>
          <div className="flex items-center gap-4">
             <Button onClick={resetLevel} variant="ghost" size="icon" aria-label="Reset Level" className="border">
              <RotateCw />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Grouping Box */}
            <div className="md:col-span-1">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-center">Step 1: Create a Group</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2 items-center justify-center p-4 min-h-[80px] bg-muted/50 rounded-b-lg">
                        {group.map(ball => <Ball key={ball.id} type={ball.value > 0 ? 'positive' : 'negative'} size="full" state="idle" />)}
                    </CardContent>
                </Card>
            </div>
            
            {/* Action Buttons */}
            <div className="md:col-span-1 flex flex-col items-center justify-center gap-4">
                <Button onClick={handleStamp} className="w-full">
                    <Copy className="mr-2" /> Step 2: Stamp Group
                </Button>
                <Button onClick={handleFlip} className="w-full" variant="destructive" disabled={equation.factor1 > 0}>
                    <Repeat className="mr-2" /> Step 3: Flip Signs
                </Button>
            </div>
            
             {/* Stamping Area */}
            <div className="md:col-span-1">
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-center">Stamped Groups</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 items-center justify-center p-4 min-h-[80px] bg-muted/50 rounded-b-lg">
                        {stampedGroups.map((g, i) => (
                            <div key={i} className="flex gap-1 p-1 border rounded-md bg-background">
                                {g.map(ball => <Ball key={ball.id} type={ball.value > 0 ? 'positive' : 'negative'} size="full" state="idle" className="w-8 h-8"/>)}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Result Area */}
        <Card className={cn("transition-all", isFlipped && "border-destructive")}>
            <CardHeader>
                <CardTitle className="text-center">Result Area</CardTitle>
            </CardHeader>
            <CardContent className="relative min-h-[200px] bg-grid p-6 flex flex-wrap gap-4 items-center justify-center">
                {finalBalls.map(ball => (
                    <Ball
                        key={ball.id}
                        type={ball.value > 0 ? 'positive' : 'negative'}
                        size="full"
                        state="idle"
                    />
                ))}

                {isLevelSolved && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
                        <CheckCircle2 className="w-24 h-24 text-green-500" />
                        <h2 className="text-4xl font-bold font-headline mt-4">Correct!</h2>
                         {!allLevelsComplete ? (
                            <Button onClick={goToNextLevel} className="mt-6 animate-pulse">
                                Next Level <ArrowRight className="ml-2" />
                            </Button>
                         ) : (
                            <p className="text-muted-foreground mt-2">You've mastered multiplication!</p>
                         )}
                    </div>
                )}
            </CardContent>
        </Card>
      </CardContent>
      <CardFooter className="flex justify-center items-center text-center bg-muted/30 p-4 border-t">
        <form onSubmit={handleSubmitAnswer} className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="number"
            placeholder="Final Answer"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isLevelSolved}
            className="text-center text-lg h-12"
          />
          <Button type="submit" className="h-12" disabled={isLevelSolved}>
            Submit
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
