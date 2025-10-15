
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Ball } from '@/components/ball';
import { ArrowRight, RotateCw, ChevronLeft, ChevronRight, CheckCircle2, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from './ui/label';

type BallType = {
  id: number;
  value: 1 | -1 | 0.5 | -0.5;
};

type AnimatedBall = BallType & {
  state: 'entering' | 'idle' | 'exiting' | 'pairing';
};

type LevelStage = 'prediction' | 'pairing';

const levels = ['1.5 - (-3.5)', '2 + 2', '4 - 4', '5 - 8'];

let nextId = 0;

const getEquationParts = (str: string): { positives: number[]; negatives: number[]; answer: number } => {
  try {
    // This will evaluate the expression correctly, e.g., '1.5 - (-3.5)' becomes 5
    const answer = new Function('return ' + str.replace(/--/g, '+'))();

    let positives: number[] = [];
    let negatives: number[] = [];
    
    // This logic is to parse the numbers as they appear for the prediction stage
    const specialCase = str.replace(/\s/g, '');
    if (specialCase === '1.5-(-3.5)') {
        // User expects 1.5 to be positive and 3.5 to be negative visually
        positives = [1.5];
        negatives = [3.5];
    } else {
        const tokens = str.replace(/\s/g, '').match(/-?\d+(\.\d+)?|[+\-]/g) || [];
        let nextSign = 1;

        for (const token of tokens) {
            if (token === '+') {
                nextSign = 1;
            } else if (token === '-') {
                nextSign = -1;
            } else {
                const num = parseFloat(token);
                // If sign comes from an operator, apply it. Otherwise, it's part of the number.
                const finalNum = token.startsWith('-') ? num : num * nextSign;
                
                if (finalNum > 0) {
                    positives.push(finalNum);
                } else if (finalNum < 0) {
                    negatives.push(Math.abs(finalNum));
                }
                // Reset sign for next number if not explicitly given
                nextSign = 1; 
            }
        }
    }

    return { positives, negatives, answer };
  } catch (e) {
    console.error('Could not parse equation:', e);
    return { positives: [], negatives: [], answer: 0 };
  }
};


const createBallsFromParts = (positives: number[], negatives: number[]): BallType[] => {
  const newBalls: BallType[] = [];
  positives.forEach(p => {
    const full = Math.floor(p);
    const half = p % 1;
    for (let i = 0; i < full; i++) newBalls.push({ id: nextId++, value: 1 });
    if (half > 0) newBalls.push({ id: nextId++, value: 0.5 });
  });
  negatives.forEach(n => {
    const full = Math.floor(n);
    const half = n % 1;
    for (let i = 0; i < full; i++) newBalls.push({ id: nextId++, value: -1 });
    if (half > 0) newBalls.push({ id: nextId++, value: -0.5 });
  });
  return newBalls;
};

interface VectorZenProps {
    isGameStarted: boolean;
    username: string;
    score: number;
    onScoreChange: (newScore: number) => void;
    onGameComplete: () => void;
}

export function VectorZen({ isGameStarted, score, onScoreChange, onGameComplete }: VectorZenProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelStage, setLevelStage] = useState<LevelStage>('prediction');

  const [correctBallCounts, setCorrectBallCounts] = useState<{ positives: number[], negatives: number[] }>({ positives: [], negatives: [] });
  const [prediction, setPrediction] = useState({ positives: '', negatives: '' });
  const [predictionAttempts, setPredictionAttempts] = useState(0);

  const [balls, setBalls] = useState<AnimatedBall[]>([]);
  const [selectedBallIds, setSelectedBallIds] = useState<number[]>([]);

  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');

  const { toast } = useToast();

  const setupLevel = useCallback((levelIndex: number) => {
    const equation = levels[levelIndex];
    const { positives, negatives, answer } = getEquationParts(equation);

    setCorrectBallCounts({ positives, negatives });
    setCorrectAnswer(answer);

    setLevelStage('prediction');
    setPrediction({ positives: '', negatives: '' });
    setPredictionAttempts(0);

    setBalls([]);
    setSelectedBallIds([]);
    setIsLevelSolved(false);
    setUserAnswer('');
  }, []);

  useEffect(() => {
    if (isGameStarted) {
      setupLevel(currentLevelIndex);
    }
  }, [currentLevelIndex, setupLevel, isGameStarted]);

  const handlePredictionSubmit = (e: FormEvent) => {
    e.preventDefault();
    const posGuess = prediction.positives
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    const negGuess = prediction.negatives
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    const sortedPosGuess = [...posGuess].sort();
    const sortedNegGuess = [...negGuess].sort();
    const sortedPosCorrect = [...correctBallCounts.positives].sort();
    const sortedNegCorrect = [...correctBallCounts.negatives].sort();

    const isCorrect =
      JSON.stringify(sortedPosGuess) === JSON.stringify(sortedPosCorrect) &&
      JSON.stringify(sortedNegGuess) === JSON.stringify(sortedNegCorrect);

    setPredictionAttempts((prev) => prev + 1);

    if (isCorrect) {
      let bonus = 0;
      if (predictionAttempts === 0) {
        bonus = 15;
        onScoreChange(score + bonus);
        toast({
          title: 'Perfect Prediction!',
          description: `+${bonus} bonus points!`,
        });
      } else {
        toast({
          title: 'Correct!',
          description: 'You figured it out!',
        });
      }

      const newBalls = createBallsFromParts(correctBallCounts.positives, correctBallCounts.negatives);
      setBalls(newBalls.map((b) => ({ ...b, state: 'entering' })));
      setLevelStage('pairing');
    } else {
      onScoreChange(Math.max(0, score - 5));
      toast({
        variant: 'destructive',
        title: 'Not quite!',
        description: "The numbers don't match the equation. Try again.",
      });
    }
  };

  const handleBallClick = (clickedBallId: number) => {
    const ball = balls.find((b) => b.id === clickedBallId);
    if (!ball || ball.state === 'exiting' || isLevelSolved) return;

    setSelectedBallIds((prevIds) =>
      prevIds.includes(clickedBallId)
        ? prevIds.filter((id) => id !== clickedBallId)
        : [...prevIds, clickedBallId]
    );
  };

  const handleFlip = () => {
    if (selectedBallIds.length === 0) {
      toast({
        variant: "destructive",
        title: "No selection",
        description: "Select one or more pieces to flip their sign."
      });
      return;
    }
    setBalls(prevBalls => 
      prevBalls.map(ball => 
        selectedBallIds.includes(ball.id) 
        ? {...ball, value: -ball.value as BallType['value']}
        : ball
      )
    );
    setSelectedBallIds([]);
  }

  useEffect(() => {
    if (selectedBallIds.length !== 2) return;
  
    let isPair = false;
  
    setBalls((currentBalls) => {
      const pair = currentBalls.filter((b) => selectedBallIds.includes(b.id));
      if (pair.length < 2) return currentBalls;
      
      isPair = pair[0].value === -pair[1].value;
  
      if (isPair) {
        return currentBalls.map((b) =>
          selectedBallIds.includes(b.id) ? { ...b, state: 'pairing' } : b
        );
      } else {
        return currentBalls;
      }
    });
  
    if (isPair) {
      const timer = setTimeout(() => {
        setBalls((prev) => prev.filter((b) => !selectedBallIds.includes(b.id)));
        setSelectedBallIds([]);
      }, 500); // Duration of the pairing animation
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setSelectedBallIds([]);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedBallIds]);

  const resetLevel = () => {
    setupLevel(currentLevelIndex);
    onScoreChange(Math.max(0, score - 10)); // Penalize for resetting
  };

  const goToNextLevel = () => {
    if (currentLevelIndex < levels.length - 1) {
      setCurrentLevelIndex((prev) => prev + 1);
    }
  };

  const goToPrevLevel = () => {
    if (currentLevelIndex > 0) {
      setCurrentLevelIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLevelSolved) return;

    const currentResult = balls.filter((b) => b.state !== 'exiting').reduce((sum, b) => sum + b.value, 0);
    const hasUnpaired = balls.some((b1) =>
      balls.some((b2) => b1.id !== b2.id && b1.value === -b2.value && b1.state !== 'exiting' && b2.state !== 'exiting')
    );

    if (hasUnpaired) {
      toast({
        variant: 'destructive',
        title: 'Still pairs to make!',
        description: 'You need to cancel out all positive and negative pairs first.',
      });
      onScoreChange(Math.max(0, score - 5));
      return;
    }

    if (parseFloat(userAnswer) === currentResult && parseFloat(userAnswer) === correctAnswer) {
      setIsLevelSolved(true);
      onScoreChange(score + 25);

      toast({
        title: 'Correct!',
        description: 'You solved the level!',
      });
      
      if (currentLevelIndex === levels.length - 1) {
        onGameComplete();
      }

    } else {
      onScoreChange(Math.max(0, score - 10));
      toast({
        variant: 'destructive',
        title: 'Not quite!',
        description: 'Your answer is incorrect. Try again.',
      });
    }
  };
  
  const allLevelsComplete = isLevelSolved && currentLevelIndex === levels.length - 1;

  const getBallSize = (value: number): 'full' | 'half' => {
      return Math.abs(value) === 1 ? 'full' : 'half';
  }

  if (!isGameStarted) {
      return (
          <Card className="w-full shadow-xl overflow-hidden border-primary/10 transition-all flex items-center justify-center min-h-[500px]">
              <p className="text-muted-foreground">Start the game to begin!</p>
          </Card>
      );
  }

  return (
    <>
        <Card className="w-full shadow-xl overflow-hidden border-primary/10 transition-all">
          <CardHeader className="p-4 border-b">
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={goToPrevLevel}
                  variant="outline"
                  size="icon"
                  aria-label="Previous Level"
                  disabled={currentLevelIndex === 0 || allLevelsComplete}
                >
                  <ChevronLeft />
                </Button>
                <div className="text-center px-4">
                  <p className="text-sm font-medium text-muted-foreground">Level {currentLevelIndex + 1}</p>
                  <p className="font-mono text-2xl sm:text-3xl font-bold">{levels[currentLevelIndex]}</p>
                </div>
                <Button
                  onClick={goToNextLevel}
                  variant="outline"
                  size="icon"
                  aria-label="Next Level"
                  disabled={!isLevelSolved || allLevelsComplete}
                >
                  <ChevronRight />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                 {levelStage === 'pairing' && (
                    <Button onClick={handleFlip} variant="outline" className="h-12" disabled={isLevelSolved}>
                        <Repeat className="mr-2 h-4 w-4"/> Flip Sign
                    </Button>
                )}
                <Button onClick={resetLevel} variant="ghost" size="icon" aria-label="Reset Level" className="border" disabled={allLevelsComplete}>
                  <RotateCw />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className={cn(
                'relative min-h-[300px] md:min-h-[400px] bg-grid p-6 flex flex-wrap gap-4 items-center justify-center transition-all duration-500',
                isLevelSolved && 'bg-green-500/10'
              )}
            >
              {levelStage === 'prediction' && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm z-10">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <h3 className="text-2xl font-headline font-bold text-center">Prediction Time!</h3>
                      <p className="text-muted-foreground text-center">
                        What numbers are in the equation? (separate with commas)
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePredictionSubmit} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Label htmlFor="positives" className="w-32 text-red-500 font-bold">
                            Red Balls
                          </Label>
                          <Input
                            id="positives"
                            type="text"
                            value={prediction.positives}
                            onChange={(e) => setPrediction((p) => ({ ...p, positives: e.target.value }))}
                            placeholder="e.g. 5, 2.5"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <Label htmlFor="negatives" className="w-32 text-blue-500 font-bold">
                            Blue Rectangles
                          </Label>
                          <Input
                            id="negatives"
                            type="text"
                            value={prediction.negatives}
                            onChange={(e) => setPrediction((p) => ({ ...p, negatives: e.target.value }))}
                            placeholder="e.g. 8"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Check Answer
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
              {balls.map((ball) => (
                <Ball
                  key={ball.id}
                  type={ball.value > 0 ? 'positive' : 'negative'}
                  size={getBallSize(ball.value)}
                  selected={selectedBallIds.includes(ball.id)}
                  state={ball.state}
                  onClick={() => handleBallClick(ball.id)}
                  className={cn(isLevelSolved && 'cursor-not-allowed')}
                />
              ))}

              {isLevelSolved && !allLevelsComplete && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
                  <CheckCircle2 className="w-24 h-24 text-green-500" />
                  <h2 className="text-4xl font-bold font-headline mt-4">Level Complete!</h2>
                  <Button onClick={goToNextLevel} className="mt-6 animate-pulse">
                    Next Level <ArrowRight className="ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          {!allLevelsComplete && levelStage === 'pairing' && (
            <CardFooter className="flex justify-center items-center text-center bg-muted/30 p-4 border-t">
              <form onSubmit={handleSubmitAnswer} className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Your Answer"
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
          )}
        </Card>
    </>
  );
}
