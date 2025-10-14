"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Ball } from "@/components/ball";
import { ArrowRight, RotateCw, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Ball = {
  id: number;
  value: 1 | -1;
};

type AnimatedBall = Ball & {
  state: 'entering' | 'idle' | 'exiting';
};

let nextId = 0;

const createBallsFromEquation = (str: string): Ball[] => {
  const matches = str.trim().match(/[+-]?\s*\d+/g);
  if (!matches) return [];

  const newBalls: Ball[] = [];
  matches.forEach(match => {
    const num = parseInt(match.replace(/\s/g, ''));
    if (isNaN(num)) return;
    for (let i = 0; i < Math.abs(num); i++) {
      newBalls.push({ id: nextId++, value: num > 0 ? 1 : -1 });
    }
  });
  return newBalls;
};

export function VectorZen() {
  const [equation, setEquation] = useState("5 - 3");
  const [balls, setBalls] = useState<AnimatedBall[]>([]);
  const [selectedBallIds, setSelectedBallIds] = useState<number[]>([]);
  const { toast } = useToast();

  const handleGenerate = useCallback(() => {
    if (!equation.trim()) {
      setBalls([]);
      setSelectedBallIds([]);
      return;
    }
    const newBalls = createBallsFromEquation(equation);
    if (newBalls.length === 0 && equation.trim()) {
        toast({
            variant: "destructive",
            title: "Invalid Equation",
            description: "Please enter a valid equation like '5 - 3'.",
        });
    }
    setBalls(newBalls.map(b => ({ ...b, state: 'entering' })));
    setSelectedBallIds([]);
  }, [equation, toast]);

  useEffect(() => {
    const initialBalls = createBallsFromEquation("5 - 3");
    setBalls(initialBalls.map(b => ({ ...b, state: 'entering' })));
  }, []);

  const handleBallClick = (clickedBallId: number) => {
    const ball = balls.find(b => b.id === clickedBallId);
    if (!ball || ball.state === 'exiting') return;

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
    const positives = balls.filter(b => b.value === 1 && b.state !== 'exiting');
    const negatives = balls.filter(b => b.value === -1 && b.state !== 'exiting');
    const pairsToMake = Math.min(positives.length, negatives.length);

    if (pairsToMake === 0) {
      toast({ title: "Nothing to solve", description: "No available pairs to cancel out." });
      return;
    }

    const positiveIdsToPair = positives.slice(0, pairsToMake).map(b => b.id);
    const negativeIdsToPair = negatives.slice(0, pairsToMake).map(b => b.id);
    const allIdsToPair = [...positiveIdsToPair, ...negativeIdsToPair];
    setSelectedBallIds(allIdsToPair);
  };
  
  const reset = () => {
    setEquation("5 - 3");
    const initialBalls = createBallsFromEquation("5 - 3");
    setBalls(initialBalls.map(b => ({ ...b, state: 'entering' })));
    setSelectedBallIds([]);
  };

  const result = useMemo(() => {
    return balls.filter(b => b.state !== 'exiting').reduce((sum, b) => sum + b.value, 0);
  }, [balls]);

  return (
    <Card className="w-full shadow-xl overflow-hidden border-primary/10">
      <CardHeader className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <Input
            type="text"
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g. 5 - 3 + 2"
            className="text-lg flex-grow font-mono"
            aria-label="Equation input"
          />
          <div className="flex gap-2 self-stretch sm:self-auto">
            <Button onClick={handleGenerate} className="flex-grow sm:flex-grow-0 animate-pop">
              <ArrowRight className="mr-2" /> Generate
            </Button>
            <Button onClick={solveAll} variant="secondary" className="flex-grow sm:flex-grow-0">
              <Sparkles className="mr-2" /> Solve
            </Button>
            <Button onClick={reset} variant="ghost" size="icon" aria-label="Reset">
              <RotateCw />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative min-h-[300px] md:min-h-[400px] bg-grid p-6 flex flex-wrap gap-4 items-center justify-center transition-colors">
          {balls.length === 0 && <p className="text-muted-foreground">Enter an equation and click Generate.</p>}
          {balls.map(ball => (
            <Ball
              key={ball.id}
              type={ball.value === 1 ? "positive" : "negative"}
              selected={selectedBallIds.includes(ball.id)}
              state={ball.state}
              onClick={() => handleBallClick(ball.id)}
            />
          ))}
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
