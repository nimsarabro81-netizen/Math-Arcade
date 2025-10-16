
'use client';

import { useState, useEffect, useReducer } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, RotateCw, ArrowRight, ChevronLeft, ChevronRight, Lightbulb, Minus, Plus, X as MultiplyIcon, Divide, Bot } from 'lucide-react';
import { produce } from 'immer';

// --- UTILITY TYPES AND FUNCTIONS ---

type Term = { x: number; c: number };
type Equation = { left: Term; right: Term };
type Operation = { op: 'add' | 'subtract' | 'multiply' | 'divide'; value: number };

const initialEquation: Equation = {
  left: { x: 0, c: 0 },
  right: { x: 0, c: 0 },
};

const levels = ["2x-1=3", "3x+2=11", "x/2+1=3", "10-x=7", "5-2x=-1", "2x+5=x+7", "2x/3=4"];

const parseEquation = (expr: string): Equation => {
  const [leftStr, rightStr] = expr.split('=');

  const parseSide = (sideExpr: string): Term => {
    let x = 0;
    let c = 0;
    const terms = sideExpr.replace(/ /g, '').replace(/-/g, '+-').split('+').filter(Boolean);
    
    terms.forEach(termStr => {
      let t = termStr.trim();
      if (t.includes('x')) {
        if (t.includes('/')) {
            const parts = t.split('x/');
            const numeratorStr = parts[0];
            const denominatorStr = parts[1];
            
            let numerator = 1;
            if (numeratorStr && numeratorStr !== '+') {
                 if(numeratorStr === '-') numerator = -1;
                 else numerator = parseFloat(numeratorStr);
            }

            const denominator = parseFloat(denominatorStr);
            x += numerator / denominator;
        } else {
            t = t.replace('x', '');
            if (t === '' || t === '+') x += 1;
            else if (t === '-') x -= 1;
            else x += parseFloat(t);
        }
      } else {
        c += parseFloat(t);
      }
    });
    return { x, c };
  };

  return {
    left: parseSide(leftStr),
    right: parseSide(rightStr),
  };
};

const formatTerm = (term: Term, isLeft: boolean) => {
    let parts: string[] = [];
    if (term.x !== 0) {
        const isFraction = Math.abs(term.x) > 0 && Math.abs(term.x) < 1;
        let xStr = '';
        if (isFraction) {
            const sign = term.x > 0 ? '' : '-';
            const absX = Math.abs(term.x);
            // This is a simplification for visualization, may need a proper fraction library for complex cases
            if (Math.abs(absX * 3).toFixed(2) === '2.00') {
                 xStr = `${sign}2x/3`
            } else {
                xStr = `${sign}x/${(1/absX).toFixed(0)}`;
            }
        }
        else {
            xStr = term.x === 1 ? 'x' : term.x === -1 ? '-x' : `${term.x}x`;
        }
        parts.push(xStr);
    }
    if (term.c !== 0) {
        if (parts.length > 0 && term.c > 0) {
            parts.push(`+ ${term.c}`);
        } else {
            parts.push(term.c.toString());
        }
    }
    if (parts.length === 0) return '0';
    return parts.join(' ').replace(/^\+ /, '').trim();
}

// --- REDUCER LOGIC ---

type Action = { type: 'APPLY_OPERATION'; payload: Operation } | { type: 'RESET'; payload: Equation };

function equationReducer(state: Equation, action: Action): Equation {
  switch (action.type) {
    case 'APPLY_OPERATION': {
      const { op, value } = action.payload;
      return produce(state, draft => {
        const applyToTerm = (term: Term) => {
          switch (op) {
            case 'add':
              term.c += value;
              break;
            case 'subtract':
              term.c -= value;
              break;
            case 'multiply':
              term.x *= value;
              term.c *= value;
              break;
            case 'divide':
              term.x /= value;
              term.c /= value;
              break;
          }
           // Round to avoid floating point inaccuracies
           term.x = parseFloat(term.x.toPrecision(10));
           term.c = parseFloat(term.c.toPrecision(10));
        };
        applyToTerm(draft.left);
        applyToTerm(draft.right);
      });
    }
    case 'RESET':
      return action.payload;
    default:
      return state;
  }
}


// --- COMPONENTS ---

const TermBlock = ({ value, isX }: { value: number; isX: boolean }) => {
    const items = [];
    const absValue = Math.abs(value);
    const isNegative = value < 0;

    for (let i = 0; i < absValue; i++) {
        items.push(
            <div key={i} className={cn(
                "flex items-center justify-center font-bold text-white rounded-lg shadow-md transition-all text-xl border-b-4",
                isX ? 'bg-blue-500 w-12 h-12 border-blue-700' : 'bg-green-500 w-10 h-10 border-green-700',
                isNegative && "bg-red-500 border-red-700",
            )}>
                {isX ? 'x' : '1'}
            </div>
        );
    }
    return <div className="flex flex-wrap items-center justify-center gap-2 p-1">{items}</div>;
};

const EquationSide = ({ term }: { term: Term }) => {
  return (
    <Card className="w-full min-h-[120px] p-2 flex flex-col justify-center items-center bg-muted/50">
      <CardContent className="p-2 w-full flex-grow flex items-center justify-center">
         <div className="flex flex-col items-center gap-2">
            {term.x !== 0 && <TermBlock value={term.x} isX />}
            {term.c !== 0 && <TermBlock value={term.c} isX={false} />}
            {(term.x === 0 && term.c === 0) && <span className="text-4xl font-bold text-muted-foreground">0</span>}
        </div>
      </CardContent>
       <CardFooter className="p-2 mt-auto w-full">
         <p className="font-mono text-xl font-bold text-center w-full bg-background/50 rounded p-1">
             {formatTerm(term, true)}
         </p>
       </CardFooter>
    </Card>
  );
};

// --- MAIN GAME COMPONENT ---

interface EquationEquilibriumProps {
    score: number;
    onScoreChange: (newScore: number) => void;
    onGameComplete: () => void;
}

export function EquationEquilibrium({ score, onScoreChange, onGameComplete }: EquationEquilibriumProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [initialState, setInitialState] = useState(initialEquation);
  const [equationState, dispatch] = useReducer(equationReducer, initialEquation);
  
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [operationValue, setOperationValue] = useState('');
  
  const { toast } = useToast();
  
  useEffect(() => {
    const newInitialState = parseEquation(levels[currentLevelIndex]);
    setInitialState(newInitialState);
    dispatch({ type: 'RESET', payload: newInitialState });
    setIsLevelSolved(false);
    setUserAnswer('');
    setOperationValue('');
  }, [currentLevelIndex]);
  
  const handleOperation = (op: Operation['op']) => {
    if (isLevelSolved) return;
    const value = parseFloat(operationValue);
    if (isNaN(value) || value === 0) {
      toast({ variant: 'destructive', title: 'Invalid Value', description: 'Please enter a non-zero number to perform the operation.' });
      return;
    }

    if (op === 'divide') {
        if (equationState.left.c % value !== 0 || equationState.left.x % value !== 0 || 
            equationState.right.c % value !== 0 || equationState.right.x % value !== 0) {
            toast({ variant: 'destructive', title: 'Invalid Division', description: "All terms must be evenly divisible by that number." });
            return;
        }
    }

    dispatch({ type: 'APPLY_OPERATION', payload: { op, value } });
    setOperationValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLevelSolved) return;
    
    const finalAnswer = parseFloat(userAnswer);
    if (isNaN(finalAnswer)) {
        toast({ variant: 'destructive', title: 'Invalid Answer', description: 'Please enter a number.' });
        return;
    }

    let isCorrect = false;
    // Check for x = value
    if (equationState.left.x === 1 && equationState.left.c === 0 && equationState.right.x === 0 && Math.abs(equationState.right.c - finalAnswer) < 0.001) {
        isCorrect = true;
    }
    // Check for value = x
    if (equationState.right.x === 1 && equationState.right.c === 0 && equationState.left.x === 0 && Math.abs(equationState.left.c - finalAnswer) < 0.001) {
        isCorrect = true;
    }

    if (isCorrect) {
      toast({ title: 'Correct!', description: `x = ${finalAnswer}` });
      onScoreChange(score + 25);
      setIsLevelSolved(true);
      if (currentLevelIndex === levels.length - 1) onGameComplete();
    } else {
      toast({ variant: 'destructive', title: 'Not quite!', description: "The equation isn't solved yet, or your answer is wrong. Keep balancing!" });
      onScoreChange(Math.max(0, score - 10));
    }
  };

  const resetLevel = () => {
    dispatch({ type: 'RESET', payload: initialState });
    setIsLevelSolved(false);
    setUserAnswer('');
    setOperationValue('');
    onScoreChange(Math.max(0, score - 5));
    toast({ variant: 'destructive', title: 'Reset Penalty', description: '-5 points for resetting.' });
  };
  
  const handleHint = () => {
      let hintText = '';
      const {left, right} = equationState;
      // Hint to gather constants
      if(left.c !== 0 && right.x === 0) {
          hintText = `Try to get rid of the '${left.c}' on the left side.`;
      } 
      // Hint to gather variables
      else if (left.x !== 0 && right.x !== 0) {
          hintText = `Try to move the 'x' terms to one side.`;
      }
      // Hint to isolate x
      else if ((left.x !== 1 && left.x !== 0 && left.c === 0) || (right.x !== 1 && right.x !== 0 && right.c === 0)) {
           const xTerm = left.x !== 0 ? left.x : right.x;
           hintText = `How can you turn '${formatTerm({x: xTerm, c: 0}, true)}' into just 'x'?`;
      }
      else {
          hintText = 'Keep simplifying until you have x on one side and a number on the other!';
      }

      toast({ title: 'Hint Used!', description: hintText });
      onScoreChange(Math.max(0, score - 15));
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

  const allLevelsComplete = isLevelSolved && currentLevelIndex === levels.length - 1;
  const currentExpression = levels[currentLevelIndex];

  return (
    <Card className="w-full shadow-xl overflow-hidden border-primary/10 transition-all">
      <CardHeader className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
                <Button onClick={goToPrevLevel} variant="outline" size="icon" aria-label="Previous Level" disabled={currentLevelIndex === 0}>
                    <ChevronLeft />
                </Button>
                <div className="text-center px-4">
                    <p className="text-sm font-medium text-muted-foreground">Level {currentLevelIndex + 1}: Solve for x</p>
                    <p className="font-mono text-xl sm:text-2xl font-bold">{currentExpression}</p>
                </div>
                <Button onClick={goToNextLevel} variant="outline" size="icon" aria-label="Next Level" disabled={!isLevelSolved || allLevelsComplete}>
                    <ChevronRight />
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleHint} variant="outline" size="icon" aria-label="Get a Hint" disabled={isLevelSolved}>
                    <Lightbulb />
                </Button>
                <Button onClick={resetLevel} variant="ghost" size="icon" aria-label="Reset Level" className="border" disabled={isLevelSolved}>
                    <RotateCw />
                </Button>
            </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-center gap-4">
          <EquationSide term={equationState.left} />
          <div className="text-5xl font-bold text-muted-foreground">=</div>
          <EquationSide term={equationState.right} />
        </div>
        
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-center">Apply Operation to Both Sides</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-2 p-4">
                 <Input 
                    type="number"
                    placeholder="Enter a value..."
                    value={operationValue}
                    onChange={e => setOperationValue(e.target.value)}
                    className="w-full sm:w-40 h-12 text-center text-lg"
                    disabled={isLevelSolved}
                 />
                 <div className="flex gap-2">
                    <Button onClick={() => handleOperation('add')} size="icon" className="h-12 w-12" disabled={isLevelSolved}><Plus /></Button>
                    <Button onClick={() => handleOperation('subtract')} size="icon" className="h-12 w-12" disabled={isLevelSolved}><Minus /></Button>
                    <Button onClick={() => handleOperation('multiply')} size="icon" className="h-12 w-12" disabled={isLevelSolved}><MultiplyIcon /></Button>
                    <Button onClick={() => handleOperation('divide')} size="icon" className="h-12 w-12" disabled={isLevelSolved}><Divide /></Button>
                 </div>
            </CardContent>
        </Card>
      </CardContent>
      
       <CardFooter className="flex justify-center items-center text-center bg-muted/30 p-4 border-t">
        {isLevelSolved ? (
             <div className="text-center">
                 {allLevelsComplete ? (
                     <>
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-2" />
                        <h2 className="text-3xl font-bold font-headline">Equation Master!</h2>
                     </>
                 ) : (
                     <>
                        <h2 className="text-2xl font-bold font-headline mb-2">Level Complete!</h2>
                        <Button onClick={goToNextLevel} className="animate-pulse">
                            Next Level <ArrowRight className="ml-2" />
                        </Button>
                     </>
                 )}
            </div>
        ) : (
             <form onSubmit={handleSubmit} className="flex w-full max-w-md items-center space-x-2">
                <p className="font-mono text-xl font-bold">x = </p>
                <Input
                    type="number"
                    placeholder="?"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className="w-24 text-center text-lg h-12 rounded-md border"
                />
                <Button type="submit" className="h-12">Check Final Answer</Button>
            </form>
        )}
      </CardFooter>
    </Card>
  );
}
