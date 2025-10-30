
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

const levels = [
    { equation: "2x-1=3", optimalSteps: 2 },
    { equation: "3x+2=8", optimalSteps: 2 },
    { equation: "x/2-3=5", optimalSteps: 2 },
    { equation: "x/3+2=3", optimalSteps: 2 },
    { equation: "2x/3=4", optimalSteps: 2 },
    { equation: "2y/3-1=5", optimalSteps: 3 },
    { equation: "5-3a/5=-7", optimalSteps: 3 },
    { equation: "2(3x-5)=8", optimalSteps: 3 },
    { equation: "5(3x-1)-2=23", optimalSteps: 4 },
    { equation: "2{5(2a+1)-3}=24", optimalSteps: 5 },
];


const getVariableFromExpression = (expr: string): string => {
    const match = expr.match(/[a-zA-Z]/);
    return match ? match[0] : 'x';
};

const parseEquation = (expr: string): { equation: Equation, variable: string } => {
    const variable = getVariableFromExpression(expr);

    // Handle complex nested structures like 2{5(2a+1)-3}=24
    expr = expr.replace(/\{/g, '(').replace(/\}/g, ')');

    const expandParentheses = (e: string): string => {
        let current = e;
        while (/\d\(/.test(current) || /\)\d/.test(current) || /\)\(/.test(current)) {
            current = current.replace(/(\d)\(/g, '$1*('); // 5(x) -> 5*(x)
            current = current.replace(/\)(\d)/g, ')*$1'); // (x)5 -> (x)*5
            current = current.replace(/\)\(/g, ')*(');   // (x)(y) -> (x)*(y)
        }
        
        // A simple expander for expressions like a(b+c) = ab+ac
        const regex = /(-?\d*(?:\.\d+)?)\s*\*\s*\(([^()]+)\)/;
        let match;
        while ((match = current.match(regex)) !== null) {
            const factor = match[1] === '-' ? -1 : parseFloat(match[1] || '1');
            const terms = match[2].split(/(?=[+-])/).map(t => t.trim());
            const expanded = terms.map(term => {
                const termMatch = term.match(/(-?\d*(?:\.\d+)?)([a-zA-Z]*)/);
                if (!termMatch) return '';
                
                const coeffStr = termMatch[1];
                const termVariable = termMatch[2];

                let coeff = 1;
                if (coeffStr === '-') coeff = -1;
                else if (coeffStr !== '' && coeffStr !== '+') coeff = parseFloat(coeffStr);

                const newCoeff = factor * coeff;
                const newCoeffStr = newCoeff === 1 && termVariable ? '' : newCoeff === -1 && termVariable ? '-' : newCoeff.toString();
                
                return `${newCoeff > 0 ? '+' : ''}${newCoeffStr}${termVariable}`;
            }).join('');

            current = current.replace(match[0], `(${expanded})`);
        }
        return current.replace(/[()]/g, '');
    };

    const [leftStr, rightStr] = expr.split('=').map(expandParentheses);

  const parseSide = (sideExpr: string): Term => {
    let x = 0;
    let c = 0;
    const terms = sideExpr.replace(/ /g, '').replace(/(?=[+-])/g, ' ').split(' ').filter(Boolean);
    
    terms.forEach(termStr => {
      let t = termStr.trim();
      if (t.includes(variable)) {
        if (t.includes('/')) {
            const parts = t.split(variable);
            const fractionPart = parts[0] ? parts[0] + parts[1] : '1' + parts[1];
            const [numeratorStr, denominatorStr] = fractionPart.split('/');
            
            let numerator = 1;
            if (numeratorStr && numeratorStr !== '+') {
                 if(numeratorStr === '-') numerator = -1;
                 else numerator = parseFloat(numeratorStr);
            }
            const denominator = parseFloat(denominatorStr);
            x += numerator / denominator;
        } else {
            t = t.replace(variable, '');
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
    equation: {
        left: parseSide(leftStr),
        right: parseSide(rightStr),
    },
    variable
  };
};


function toFraction(num: number, tolerance = 1.0E-6): string {
    if (Math.abs(num - Math.round(num)) < tolerance) {
        return Math.round(num).toString();
    }
    
    let h1=1; let h2=0;
    let k1=0; let k2=1;
    let b = num;
    do {
        let a = Math.floor(b);
        let aux = h1; h1 = a*h1+h2; h2 = aux;
        aux = k1; k1 = a*k1+k2; k2 = aux;
        b = 1/(b-a);
    } while (Math.abs(num-h1/k1) > num*tolerance);

    // If denominator is 1, it's a whole number
    if (k1 === 1) return String(h1);
    
    return `${h1}/${k1}`;
}

const formatNumber = (num: number) => {
    const rounded = parseFloat(num.toPrecision(10));
    return toFraction(rounded);
}

const formatTerm = (term: Term, variable: string) => {
    let parts: string[] = [];
    if (term.x !== 0) {
        const roundedX = parseFloat(term.x.toPrecision(10));
        const absX = Math.abs(roundedX);
        const sign = roundedX < 0 ? '-' : '';

        if (absX === 1) {
            parts.push(`${sign}${variable}`);
        } else {
            const fraction = toFraction(absX);
            if (fraction.includes('/')) {
                const [n, d] = fraction.split('/');
                parts.push(`${sign}${n}${variable}/${d}`);
            } else {
                parts.push(`${sign}${fraction}${variable}`);
            }
        }
    }
    if (term.c !== 0) {
        const cValue = formatNumber(term.c);
        if (parts.length > 0 && term.c > 0) {
            parts.push(`+ ${cValue}`);
        } else {
            parts.push(cValue.toString());
        }
    }
    if (parts.length === 0) return '0';
    return parts.join(' ').replace(/^ /, '').replace(/\s\+\s/,' + ').replace(/\s\-\s/,' - ').trim();
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

const TermBlock = ({ value, variable }: { value: number; variable: string | null }) => {
    const items = [];
    const absValue = Math.abs(value);
    const isNegative = value < 0;
    
    // Check if it's close enough to a whole number
    const isWholeNumber = Math.abs(absValue - Math.round(absValue)) < 0.001;

    if (isWholeNumber) {
        const roundedValue = Math.round(absValue);
        for (let i = 0; i < roundedValue; i++) {
            items.push(
                <div key={`full-${i}`} className={cn(
                    "flex items-center justify-center font-bold text-white rounded-lg shadow-md transition-all text-2xl border-b-4",
                    variable ? 'bg-blue-500 w-12 h-12 border-blue-700' : 'bg-green-500 w-10 h-10 border-green-700',
                    isNegative && "bg-red-500 border-red-700",
                )}>
                    {variable || '1'}
                </div>
            );
        }
    } else { // It's a fraction
        const fullUnits = Math.floor(absValue);
        const fractionalPart = absValue - fullUnits;

        for (let i = 0; i < fullUnits; i++) {
             items.push(
                <div key={`full-frac-${i}`} className={cn(
                    "flex items-center justify-center font-bold text-white rounded-lg shadow-md transition-all text-2xl border-b-4",
                    variable ? 'bg-blue-500 w-12 h-12 border-blue-700' : 'bg-green-500 w-10 h-10 border-green-700',
                    isNegative && "bg-red-500 border-red-700",
                )}>
                    {variable || '1'}
                </div>
            );
        }
        
        if (fractionalPart > 0.001) {
            const baseHeight = variable ? 48 : 40; // h-12 or h-10 in px
            const height = baseHeight * fractionalPart;

            items.push(
                 <div key="fraction" className={cn(
                    "relative flex items-center justify-center font-bold text-white rounded-t-lg shadow-md transition-all text-2xl border-b-4 overflow-hidden",
                     variable ? 'bg-blue-500 w-12 border-blue-700' : 'bg-green-500 w-10 border-green-700',
                     isNegative && "bg-red-500 border-red-700",
                )} style={{ height: `${height}px` }}>
                    <span className={cn('absolute -bottom-1/2 translate-y-[-50%]')}>{variable || '1'}</span>
                </div>
            )
        }
    }

    return <div className="flex flex-wrap items-end justify-center gap-2 p-1">{items}</div>;
};

const EquationSide = ({ term, variable }: { term: Term, variable: string }) => {
  return (
    <Card className="w-full min-h-[120px] p-2 flex flex-col justify-center items-center bg-muted/50">
      <CardContent className="p-2 w-full flex-grow flex items-center justify-center">
         <div className="flex flex-col items-center gap-2">
            {term.x !== 0 && <TermBlock value={term.x} variable={variable} />}
            {term.c !== 0 && <TermBlock value={term.c} variable={null} />}
            {(term.x === 0 && term.c === 0) && <span className="text-4xl font-bold text-muted-foreground">0</span>}
        </div>
      </CardContent>
       <CardFooter className="p-2 mt-auto w-full">
         <p className="font-mono text-xl font-bold text-center w-full bg-background/50 rounded p-1">
             {formatTerm(term, variable)}
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
  const [variable, setVariable] = useState('x');
  const [operationCount, setOperationCount] = useState(0);
  
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [operationValue, setOperationValue] = useState('');
  const [isHintUsed, setIsHintUsed] = useState(false);
  const [levelStartTime, setLevelStartTime] = useState<number | null>(null);
  
  const { toast } = useToast();
  
  useEffect(() => {
    const { equation: newInitialState, variable: newVariable } = parseEquation(levels[currentLevelIndex].equation);
    setInitialState(newInitialState);
    setVariable(newVariable);
    dispatch({ type: 'RESET', payload: newInitialState });
    setIsLevelSolved(false);
    setUserAnswer('');
    setOperationValue('');
    setOperationCount(0);
    setIsHintUsed(false);
    setLevelStartTime(Date.now());
  }, [currentLevelIndex]);
  
  const handleOperation = (op: Operation['op']) => {
    if (isLevelSolved) return;
    const value = parseFloat(operationValue);
    if (isNaN(value) || value === 0) {
      toast({ variant: 'destructive', title: 'Invalid Value', description: 'Please enter a non-zero number to perform the operation.' });
      return;
    }

    dispatch({ type: 'APPLY_OPERATION', payload: { op, value } });
    setOperationCount(prev => prev + 1);
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

    const tolerance = 0.001;
    let isCorrect = false;

    // Check for x = value
    if (Math.abs(equationState.left.x - 1) < tolerance && Math.abs(equationState.left.c) < tolerance && Math.abs(equationState.right.x) < tolerance && Math.abs(equationState.right.c - finalAnswer) < tolerance) {
        isCorrect = true;
    }
    // Check for value = x
    if (Math.abs(equationState.right.x - 1) < tolerance && Math.abs(equationState.right.c) < tolerance && Math.abs(equationState.left.x) < tolerance && Math.abs(equationState.left.c - finalAnswer) < tolerance) {
        isCorrect = true;
    }

    if (isCorrect) {
      let finalScore = score + 25;
      toast({ title: 'Correct!', description: `${variable} = ${finalAnswer}` });
      
      const levelEndTime = Date.now();
      if(levelStartTime && (levelEndTime - levelStartTime) / 1000 <= 30) {
          finalScore += 10;
          toast({ title: 'Time Bonus!', description: 'Solved within 30 seconds! +10 points.'});
      }

      if (operationCount <= levels[currentLevelIndex].optimalSteps) {
          finalScore += 15;
          toast({ title: 'Efficiency Bonus!', description: `Solved in ${operationCount} steps! +15 points.` });
      }

      onScoreChange(finalScore);
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
    setOperationCount(0);
    setIsHintUsed(false);
    setLevelStartTime(Date.now());
    onScoreChange(Math.max(0, score - 5));
    toast({ variant: 'destructive', title: 'Reset Penalty', description: '-5 points for resetting.' });
  };
  
  const handleHint = () => {
      if (isHintUsed) {
          toast({ title: 'Hint Already Used', description: 'You can only use one hint per level.' });
          return;
      }

      let hintText = '';
      const {left, right} = equationState;
      
      if(left.c !== 0 && right.x === 0) {
          hintText = `Try to get rid of the '${left.c}' on the left side.`;
      } 
      else if (left.x !== 0 && right.x !== 0) {
          hintText = `Try to move the '${variable}' terms to one side.`;
      }
      else if ((left.x !== 1 && left.x !== 0 && left.c === 0) || (right.x !== 1 && right.x !== 0 && right.c === 0)) {
           const xTerm = left.x !== 0 ? left.x : right.x;
           hintText = `How can you turn '${formatTerm({x: xTerm, c: 0}, variable)}' into just '${variable}'?`;
      }
      else {
          hintText = `Keep simplifying until you have ${variable} on one side and a number on the other!`;
      }

      toast({ title: 'Hint Used!', description: hintText });
      onScoreChange(Math.max(0, score - 15));
      setIsHintUsed(true);
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
  const currentExpression = levels[currentLevelIndex].equation;

  return (
    <Card className="w-full shadow-xl overflow-hidden border-primary/10 transition-all">
      <CardHeader className="p-4 border-b">
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
                <Button onClick={goToPrevLevel} variant="outline" size="icon" aria-label="Previous Level" disabled={currentLevelIndex === 0}>
                    <ChevronLeft />
                </Button>
                <div className="text-center px-4">
                    <p className="text-sm font-medium text-muted-foreground">Level {currentLevelIndex + 1}: Solve for {variable}</p>
                    <p className="font-mono text-xl sm:text-2xl font-bold">{currentExpression}</p>
                </div>
                <Button onClick={goToNextLevel} variant="outline" size="icon" aria-label="Next Level" disabled={!isLevelSolved || allLevelsComplete}>
                    <ChevronRight />
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={handleHint} variant="outline" size="icon" aria-label="Get a Hint" disabled={isLevelSolved || isHintUsed}>
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
          <EquationSide term={equationState.left} variable={variable} />
          <div className="text-5xl font-bold text-muted-foreground">=</div>
          <EquationSide term={equationState.right} variable={variable} />
        </div>
        
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-center">Apply Operation to Both Sides</CardTitle>
                 <CardDescription className="text-center">Steps taken: {operationCount}</CardDescription>
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
                <p className="font-mono text-xl font-bold">{variable} = </p>
                <Input
                    type="number"
                    step="any"
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

    