
'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Ball } from '@/components/ball';
import { ArrowRight, RotateCw, ChevronLeft, ChevronRight, CheckCircle2, Award, Plus, Minus, HelpCircle } from 'lucide-react';
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
  value: 1 | -1;
};

type AnimatedBall = BallType & {
  state: 'entering' | 'idle' | 'exiting';
};

type LevelStage = 'prediction' | 'pairing';

const levels = ['1.5 - (-3.5)', '2 + 2', '4 - 4', '5 - 8'];

let nextId = 0;

const getEquationParts = (
  str: string
): { positives: number[]; negatives: number[]; answer: number } => {
  try {
    const answer = new Function('return ' + str)();
    const expression = str.replace(/\s/g, '');

    // Regex to tokenize the expression into numbers, operators, and parentheses
    const tokens = expression.match(/-?\d*\.?\d+|[+*/()-]/g) || [];
    
    const numbers: number[] = [];
    let currentSign = 1;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token === '+') {
            currentSign = 1;
        } else if (token === '-') {
            currentSign = -1;
        } else if (!isNaN(parseFloat(token))) {
            const num = parseFloat(token);
            // Handle cases like '5-8' where the '-' is an operator, not a sign of the number
            if (numbers.length === 0 && i === 0) { // First number
                 numbers.push(num);
            } else {
                 numbers.push(currentSign * num);
            }
            // Reset sign after consuming a number if the next token is not an operator
            if (i + 1 < tokens.length && !['+', '-'].includes(tokens[i+1])) {
              currentSign = 1;
            }
        } else if (token === '(' && currentSign === -1 && tokens[i+1] === '-') {
           // This is for the case '-(-...'
           currentSign = 1; // Flip the sign
           i++; // Skip the inner '-'
        }
    }

    const positives = numbers.filter((n) => n > 0);
    const negatives = numbers.filter((n) => n < 0).map((n) => Math.abs(n));

    return { positives, negatives, answer };
  } catch (e) {
    console.error('Could not parse equation:', e);
    return { positives: [], negatives: [], answer: 0 };
  }
};

const createBallsFromParts = (positives: number, negatives: number): BallType[] => {
  const newBalls: BallType[] = [];
  for (let i = 0; i < positives; i++) {
    newBalls.push({ id: nextId++, value: 1 });
  }
  for (let i = 0; i < negatives; i++) {
    newBalls.push({ id: nextId++, value: -1 });
  }
  return newBalls;
};

export function VectorZen() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelStage, setLevelStage] = useState<LevelStage>('prediction');

  // Prediction state
  const [correctBallCounts, setCorrectBallCounts] = useState({ positives: [] as number[], negatives: [] as number[] });
  const [prediction, setPrediction] = useState({ positives: '', negatives: '' });
  const [predictionAttempts, setPredictionAttempts] = useState(0);

  // Pairing state
  const [balls, setBalls] = useState<AnimatedBall[]>([]);
  const [selectedBallIds, setSelectedBallIds] = useState<number[]>([]);

  // General level state
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(100);

  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const auth = useAuth();

  // Game flow state
  const [username, setUsername] = useState('');
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

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
      if (currentLevelIndex === 0) {
        setStartTime(Date.now());
      }
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
      sortedPosGuess.length === sortedPosCorrect.length &&
      sortedPosGuess.every((val, index) => val === sortedPosCorrect[index]) &&
      sortedNegGuess.length === sortedNegCorrect.length &&
      sortedNegGuess.every((val, index) => val === sortedNegCorrect[index]);

    setPredictionAttempts((prev) => prev + 1);

    if (isCorrect) {
      let bonus = 0;
      if (predictionAttempts === 0) {
        bonus = 15;
        setScore((prev) => prev + bonus);
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

      const totalPositives = Math.round(correctBallCounts.positives.reduce((sum, n) => sum + n, 0));
      const totalNegatives = Math.round(correctBallCounts.negatives.reduce((sum, n) => sum + n, 0));
      const newBalls = createBallsFromParts(totalPositives, totalNegatives);
      setBalls(newBalls.map((b) => ({ ...b, state: 'entering' })));
      setLevelStage('pairing');
    } else {
      setScore((prev) => Math.max(0, prev - 5));
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

    if (selectedBallIds.includes(clickedBallId)) {
      setSelectedBallIds((prev) => prev.filter((id) => id !== clickedBallId));
      return;
    }

    if (selectedBallIds.length === 0) {
      setSelectedBallIds([clickedBallId]);
    } else {
      const firstSelectedBall = balls.find((b) => b.id === selectedBallIds[0]);
      if (firstSelectedBall && firstSelectedBall.value !== ball.value) {
        setSelectedBallIds((prev) => [...prev, clickedBallId]);
      } else {
        setSelectedBallIds([clickedBallId]);
      }
    }
  };

  useEffect(() => {
    if (selectedBallIds.length < 2) return;

    setBalls((prev) => prev.map((b) => (selectedBallIds.includes(b.id) ? { ...b, state: 'exiting' } : b)));

    const timer = setTimeout(() => {
      setBalls((prev) => prev.filter((b) => !selectedBallIds.includes(b.id)));
      setSelectedBallIds([]);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedBallIds]);

  const resetLevel = () => {
    setupLevel(currentLevelIndex);
    setScore((prev) => Math.max(0, prev - 10)); // Penalize for resetting
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

  const saveScore = async (finalScore: number) => {
    if (user && firestore) {
      const rankData = {
        userId: user.uid,
        username: username || 'Anonymous',
        score: finalScore,
        lastUpdated: new Date().toISOString(),
      };
      const ranksCollection = collection(firestore, 'userRanks');
      await addDocumentNonBlocking(ranksCollection, rankData);
    }
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLevelSolved) return;

    const currentResult = balls.filter((b) => b.state !== 'exiting').reduce((sum, b) => sum + b.value, 0);
    const hasUnpaired = balls.some((b1) =>
      balls.some((b2) => b1.value === -b2.value && b1.state !== 'exiting' && b2.state !== 'exiting')
    );

    if (hasUnpaired) {
      toast({
        variant: 'destructive',
        title: 'Still pairs to make!',
        description: 'You need to cancel out all positive and negative pairs first.',
      });
      setScore((prev) => Math.max(0, prev - 5));
      return;
    }

    if (parseInt(userAnswer) === currentResult && parseInt(userAnswer) === correctAnswer) {
      setIsLevelSolved(true);
      let newScore = score + 25;

      toast({
        title: 'Correct!',
        description: 'You solved the level!',
      });

      if (currentLevelIndex === levels.length - 1) {
        let finalScore = newScore;
        if (startTime) {
          const endTime = Date.now();
          const durationInSeconds = (endTime - startTime) / 1000;
          const timeBonus = Math.max(0, 100 - Math.floor(durationInSeconds));
          finalScore += timeBonus;
          toast({
            title: `Time Bonus: +${timeBonus}`,
            description: `You completed the game in ${durationInSeconds.toFixed(1)} seconds.`,
          });
        }
        setScore(finalScore);
        saveScore(finalScore);
      } else {
        setScore(newScore);
      }
    } else {
      setScore((prev) => Math.max(0, prev - 10));
      toast({
        variant: 'destructive',
        title: 'Not quite!',
        description: 'Your answer is incorrect. Try again.',
      });
    }
  };

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsGameStarted(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter your name to start.',
      });
    }
  };

  const allLevelsComplete = isLevelSolved && currentLevelIndex === levels.length - 1;

  const startOver = () => {
    setCurrentLevelIndex(0);
    setScore(100);
    setIsGameStarted(false);
    setUsername('');
    setStartTime(null);
  };

  return (
    <>
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

      {isGameStarted && (
        <Card className="w-full shadow-xl overflow-hidden border-primary/10 transition-all">
          <CardHeader className="p-4 border-b">
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={goToPrevLevel}
                  variant="outline"
                  size="icon"
                  aria-label="Previous Level"
                  disabled={currentLevelIndex === 0}
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
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Score</p>
                  <p className="font-mono text-2xl font-bold">{score}</p>
                </div>
                <Button onClick={resetLevel} variant="ghost" size="icon" aria-label="Reset Level" className="border">
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
                        What numbers make up this equation? (separate with commas if multiple)
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePredictionSubmit} className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Label htmlFor="positives" className="w-24 text-red-500 font-bold">
                            Positive #s
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
                          <Label htmlFor="negatives" className="w-24 text-blue-500 font-bold">
                            Negative #s
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
                  type={ball.value === 1 ? 'positive' : 'negative'}
                  selected={selectedBallIds.includes(ball.id)}
                  state={ball.state}
                  onClick={() => handleBallClick(ball.id)}
                  className={cn(isLevelSolved && 'cursor-not-allowed')}
                />
              ))}
              {allLevelsComplete && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center animate-fade-in backdrop-blur-sm">
                  <Award className="w-24 h-24 text-yellow-500 animate-bounce" />
                  <h2 className="text-4xl font-bold font-headline mt-4">You're a VectorZen Master!</h2>
                  <p className="text-muted-foreground mt-2">Final Score: {score}</p>
                  <Button onClick={startOver} className="mt-6">
                    Play Again
                  </Button>
                </div>
              )}
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
      )}
    </>
  );
}

    