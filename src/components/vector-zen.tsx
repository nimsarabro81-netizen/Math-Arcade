"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Ball } from "@/components/ball";
import { ArrowRight, RotateCw, Sparkles, ChevronLeft, ChevronRight, CheckCircle2, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Ball = {
  id: number;
  value: 1 | -1;
};

type AnimatedBall = Ball & {
  state: 'entering' | 'idle' | 'exiting';
};

const levels = [
  "3 - 1",
  "2 + 2",
  "4 - 4",
  "5 - 8",
  "-2 + 5",
  "3 - 7 + 2",
  "-5 + 5",
];

let nextId = 0;

const createBallsFromEquation = (str: string): { balls: Ball[], answer: number } => {
  const matches = str.trim().match(/[+-]?\s*\d+/g);
  if (!matches) return { balls: [], answer: 0 };

  const newBalls: Ball[] = [];
  let answer = 0;
  matches.forEach(match => {
    const num = parseInt(match.replace(/\s/g, ''));
    if (isNaN(num)) return;
    answer += num;
    for (let i = 0; i < Math.abs(num); i++) {
      newBalls.push({ id: nextId++, value: num > 0 ? 1 : -1 });
    }
  });
  return { balls: newBalls, answer };
};

export function VectorZen() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [balls, setBalls] = useState<AnimatedBall[]>([]);
  const [selectedBallIds, setSelectedBallIds] = useState<number[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const { toast } = useToast();

  const setupLevel = useCallback((levelIndex: number) => {
    const equation = levels[levelIndex];
    const { balls: newBalls, answer } = createBallsFromEquation(equation);
    setBalls(newBalls.map(b => ({ ...b, state: 'entering' })));
    setCorrectAnswer(answer);
    setSelectedBallIds([]);
    setIsLevelSolved(false);
  }, []);

  useEffect(() => {
    setupLevel(currentLevelIndex);
  }, [currentLevelIndex, setupLevel]);

  const handleBallClick = (clickedBallId: number) => {
    const ball = balls.find(b => b.id === clickedBallId);
    if (!ball || ball.state === 'exiting' || isLevelSolved) return;

    if (selectedBallIds.includes(clickedBallId)) {
      setSelectedBallIds(prev => prev.filter(id => id !== clickedBallId));
      return;
    }
    
    if (selectedBallIds.length === 0) {
      setSelectedBallIds([clickedBallId]);
    } else {
      const firstSelectedBall = balls.find(b => b.id === selectedBallIds[0]);
      if (firstSelectedBall && firstSelectedBall.value !== ball.value) {
        setSelectedBallIds(prev => [...prev, clickedBallId]);
      } else {
        setSelectedBallIds([clickedBallId]);
      }
    }
  };

  useEffect(() => {
    if (selectedBallIds.length < 2) return;

    setBalls(prev => prev.map(b => selectedBallIds.includes(b.id) ? { ...b, state: 'exiting' } : b));
    
    const timer = setTimeout(() => {
      setBalls(prev => prev.filter(b => !selectedBallIds.includes(b.id)));
      setSelectedBallIds([]);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedBallIds]);
  
  const solveAll = () => {
    if (isLevelSolved) return;
    const positives = balls.filter(b => b.value === 1 && b.state !== 'exiting');
    const negatives = balls.filter(b => b.value === -1 && b.state !== 'exiting');
    const pairsToMake = Math.min(positives.length, negatives.length);

    if (pairsToMake === 0) {
      toast({ title: "Nothing to pair", description: "No available positive and negative balls to cancel out." });
      return;
    }

    const positiveIdsToPair = positives.slice(0, pairsToMake).map(b => b.id);
    const negativeIdsToPair = negatives.slice(0, pairsToMake).map(b => b.id);
    const allIdsToPair = [...positiveIdsToPair, ...negativeIdsToPair];
    setSelectedBallIds(allIdsToPair);
  };
  
  const resetLevel = () => {
    setupLevel(currentLevelIndex);
  };

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

  const result = useMemo(() => {
    return balls.filter(b => b.state !== 'exiting').reduce((sum, b) => sum + b.value, 0);
  }, [balls]);

  useEffect(() => {
    if (balls.length > 0 && result === correctAnswer) {
      const hasUnpaired = balls.some(b1 => balls.some(b2 => b1.value === -b2.value));
      if (!hasUnpaired) {
        setIsLevelSolved(true);
        toast({
          title: "Correct!",
          description: "You solved the level!",
        });
      }
    }
  }, [result, correctAnswer, balls, toast]);

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
                    <p className="font-mono text-xl font-bold">{levels[currentLevelIndex]}</p>
                </div>
                <Button onClick={goToNextLevel} variant="outline" size="icon" aria-label="Next Level" disabled={currentLevelIndex === levels.length - 1}>
                    <ChevronRight />
                </Button>
            </div>
            <div className="flex gap-2 self-stretch sm:self-auto">
                <Button onClick={solveAll} variant="secondary" className="flex-grow sm:flex-grow-0" disabled={isLevelSolved}>
                <Sparkles className="mr-2" /> Auto-Solve
                </Button>
                <Button onClick={resetLevel} variant="ghost" size="icon" aria-label="Reset Level">
                <RotateCw />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn(
          "relative min-h-[300px] md:min-h-[400px] bg-grid p-6 flex flex-wrap gap-4 items-center justify-center transition-all duration-500",
          isLevelSolved && "bg-green-500/10"
        )}>
          {balls.length === 0 && !isLevelSolved && <p className="text-muted-foreground">Level complete!</p>}
          {balls.map(ball => (
            <Ball
              key={ball.id}
              type={ball.value === 1 ? "positive" : "negative"}
              selected={selectedBallIds.includes(ball.id)}
              state={ball.state}
              onClick={() => handleBallClick(ball.id)}
              className={cn(isLevelSolved && "cursor-not-allowed")}
            />
          ))}
          {isLevelSolved && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
              {allLevelsComplete ? (
                <>
                  <Award className="w-24 h-24 text-yellow-500 animate-bounce" />
                  <h2 className="text-4xl font-bold font-headline mt-4">You're a VectorZen Master!</h2>
                  <p className="text-muted-foreground mt-2">You have completed all the levels.</p>
                  <Button onClick={() => setCurrentLevelIndex(0)} className="mt-6">Play Again</Button>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-24 h-24 text-green-500" />
                  <h2 className="text-4xl font-bold font-headline mt-4">Level Complete!</h2>
                  <Button onClick={goToNextLevel} className="mt-6 animate-pulse">
                    Next Level <ArrowRight className="ml-2" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-center items-center text-center bg-muted/30 p-4 border-t">
        <div className="text-center">
            <p className="text-sm text-muted-foreground font-headline tracking-widest uppercase">Result</p>
            <h3 key={result} className="font-headline text-5xl font-bold text-primary animate-pop">{result}</h3>
        </div>
      </CardFooter>
    </Card>
  );
}
