
'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, RotateCw, ArrowRight, ChevronLeft, ChevronRight, Lightbulb, Minus, Plus, X as MultiplyIcon, Divide } from 'lucide-react';
import { produce } from 'immer';

const ItemTypes = {
  OPERATION: 'operation',
};

// Expanded levels
const levels = ["2x-1=3", "3x+2=11", "x/2-3=5", "2x/3=4", "10-x=7", "5-2x=-1"];

// Add a parser for more complex equations
const parseEquation = (expr: string) => {
    const [left, right] = expr.split('=');
    const parseSide = (sideExpr: string) => {
        let xCoeff = 0;
        let constant = 0;

        const terms = sideExpr.match(/[+-]?(\d*x|\d+\/\d*x|\d*x\/\d+|\d+)/g) || [];
        
        terms.forEach(term => {
            if (term.includes('x')) {
                if (term.includes('/')) {
                    const [num, den] = term.replace('x','').split('/');
                    if (den) { // "2x/3"
                       xCoeff += (parseInt(num, 10) || 1) / parseInt(den, 10);
                    } else { // "x/2"
                       xCoeff += 1 / (parseInt(num, 10) || 1);
                    }
                } else {
                    const coeffStr = term.replace('x', '');
                    if (coeffStr === '' || coeffStr === '+') xCoeff += 1;
                    else if (coeffStr === '-') xCoeff -= 1;
                    else xCoeff += parseInt(coeffStr, 10);
                }
            } else {
                constant += parseInt(term, 10);
            }
        });
        return { x: xCoeff, c: constant };
    };

    return {
        left: parseSide(left),
        right: parseSide(right),
    };
};


const TermBlock = ({ value, isX, isPlaceholder, isGhost }: { value: number, isX: boolean, isPlaceholder?: boolean, isGhost?: boolean }) => {
    const absValue = Math.abs(value);
    const isNegative = value < 0;
    
    return (
        <div className={cn("flex flex-wrap items-center justify-center gap-1", isPlaceholder && "opacity-50", isGhost && "opacity-20")}>
            {Array.from({ length: absValue }).map((_, i) => (
                <div key={i} className={cn(
                    "flex items-center justify-center font-bold text-white rounded transition-all",
                    isX ? 'bg-blue-500 w-10 h-10' : 'bg-green-500 w-8 h-8',
                    isNegative && "bg-red-500",
                )}>
                    {isX ? 'x' : '1'}
                </div>
            ))}
        </div>
    );
};


const OperationBlock = ({ op, value }: { op: '+' | '-' | 'x' | '÷', value: number }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.OPERATION,
        item: { op, value },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));
    
    const Icon = {
        '+': Plus,
        '-': Minus,
        'x': MultiplyIcon,
        '÷': Divide,
    }[op];

    return (
        <div ref={drag} className={cn("flex items-center gap-2 p-2 rounded-lg border bg-card shadow-sm cursor-grab", isDragging && "opacity-50")}>
            <Icon className="w-5 h-5" />
            <span className="font-mono font-bold text-lg">{value}</span>
        </div>
    );
};

const ScalePan = ({ onDrop, terms, side, isTargeted }: { onDrop: (op: any) => void, terms: {x: number, c: number}, side: 'left' | 'right', isTargeted: boolean }) => {
     const [{ isOver, canDrop }, drop] = useDrop(() => ({
        accept: ItemTypes.OPERATION,
        drop: onDrop,
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
            canDrop: !!monitor.canDrop(),
        }),
    }));

    return (
        <div ref={drop} className={cn("relative w-full min-h-[150px] p-4 border-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all", 
            isOver && canDrop ? 'border-primary bg-primary/10' : 'border-muted-foreground',
            isTargeted && "border-yellow-500 bg-yellow-500/10"
        )}>
            {terms.x !== 0 && <TermBlock value={terms.x} isX />}
            {terms.c !== 0 && <TermBlock value={terms.c} isX={false} />}
             {(terms.x === 0 && terms.c === 0) && <span className="text-4xl font-bold text-muted-foreground">0</span>}

             <div className="absolute bottom-2 right-2 p-2 bg-background/80 rounded-md font-mono text-lg">
                {terms.x !== 0 ? `${terms.x}x ` : ''}
                {terms.x !== 0 && terms.c !== 0 ? (terms.c > 0 ? '+ ' : '') : ''}
                {terms.c !== 0 ? `${terms.c}` : ''}
                {terms.x === 0 && terms.c === 0 ? '0' : ''}
             </div>
        </div>
    )
};


interface EquationEquilibriumProps {
    score: number;
    onScoreChange: (newScore: number) => void;
    onGameComplete: () => void;
}

export function EquationEquilibrium({ score, onScoreChange, onGameComplete }: EquationEquilibriumProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [levelState, setLevelState] = useState<{left: {x: number, c: number}, right: {x: number, c: number}}>({left: {x:0, c:0}, right: {x:0, c:0}});
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [opApplied, setOpApplied] = useState<{side: 'left' | 'right' | null, op: any}>({side: null, op: null});
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const DndBackend = isMobile ? TouchBackend : HTML5Backend;

  const currentExpression = levels[currentLevelIndex];
  
  const setupLevel = useCallback((levelIndex: number) => {
    const parsedEq = parseEquation(levels[levelIndex]);
    setLevelState(parsedEq);
    setIsLevelSolved(false);
    setUserAnswer('');
    setOpApplied({side: null, op: null});
  }, []);

  useEffect(() => {
    setupLevel(currentLevelIndex);
  }, [currentLevelIndex, setupLevel]);

  const handleOperation = (side: 'left' | 'right', operation: {op: string, value: number}) => {
    
    const applyOp = (terms: {x: number, c: number}) => {
        let newTerms = { ...terms };
        switch (operation.op) {
            case '+': newTerms.c += operation.value; break;
            case '-': newTerms.c -= operation.value; break;
            case 'x': 
                newTerms.c *= operation.value;
                newTerms.x *= operation.value;
                break;
            case '÷': 
                 if (newTerms.c % operation.value !== 0 || newTerms.x % operation.value !== 0) {
                    toast({variant: 'destructive', title: 'Invalid Division', description: "You can only divide if all terms on a side are divisible."});
                    return null;
                }
                newTerms.c /= operation.value;
                newTerms.x /= operation.value;
                break;
        }
        return newTerms;
    };
    
    if (opApplied.side && opApplied.side !== side) { // Second operation
        if (JSON.stringify(opApplied.op) !== JSON.stringify(operation)) {
            toast({variant: 'destructive', title: "Unbalanced!", description: "You must perform the exact same operation on both sides."});
            return;
        }
        
        setLevelState(produce(draft => {
            const firstResult = applyOp(draft[opApplied.side!]);
            if (firstResult) draft[opApplied.side!] = firstResult;
            
            const secondResult = applyOp(draft[side]);
            if (secondResult) draft[side] = secondResult;
        }));

        setOpApplied({side: null, op: null});

    } else { // First operation
        setOpApplied({side, op: operation});
        toast({title: "Balance the scale!", description: `Now perform the same operation on the ${side === 'left' ? 'right' : 'left'} side.`})
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(levelState.left.x === 1 && levelState.left.c === 0) {
        if(levelState.right.x === 0 && levelState.right.c === parseInt(userAnswer, 10)) {
            toast({ title: 'Correct!', description: `x = ${levelState.right.c}` });
            onScoreChange(score + 25);
            setIsLevelSolved(true);
            if (currentLevelIndex === levels.length - 1) onGameComplete();
            return;
        }
    }
     if(levelState.right.x === 1 && levelState.right.c === 0) {
        if(levelState.left.x === 0 && levelState.left.c === parseInt(userAnswer, 10)) {
            toast({ title: 'Correct!', description: `x = ${levelState.left.c}` });
            onScoreChange(score + 25);
            setIsLevelSolved(true);
            if (currentLevelIndex === levels.length - 1) onGameComplete();
            return;
        }
    }
    toast({ variant: 'destructive', title: 'Not quite!', description: "The equation isn't solved yet, or your answer is wrong. Keep balancing!" });
    onScoreChange(Math.max(0, score - 10));
  };

  const resetLevel = () => {
    setupLevel(currentLevelIndex);
    onScoreChange(Math.max(0, score - 5));
    toast({ variant: 'destructive', title: 'Reset Penalty', description: '-5 points for resetting.' });
  }

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
    <DndProvider backend={DndBackend}>
        <Card className="w-full shadow-xl overflow-hidden border-primary/10 transition-all">
            <CardHeader className="p-4 border-b">
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button onClick={goToPrevLevel} variant="outline" size="icon" aria-label="Previous Level" disabled={currentLevelIndex === 0}>
                            <ChevronLeft />
                        </Button>
                        <div className="text-center px-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Level {currentLevelIndex + 1}: Solve for x
                            </p>
                            <p className="font-mono text-xl sm:text-2xl font-bold">{currentExpression}</p>
                        </div>
                        <Button onClick={goToNextLevel} variant="outline" size="icon" aria-label="Next Level" disabled={!isLevelSolved || allLevelsComplete}>
                            <ChevronRight />
                        </Button>
                    </div>
                     <Button onClick={resetLevel} variant="ghost" size="icon" aria-label="Reset Level" className="border" disabled={isLevelSolved}>
                        <RotateCw />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-center gap-4">
                    <Card className="w-1/2">
                        <CardHeader><CardTitle className="text-center">Left Side</CardTitle></CardHeader>
                        <CardContent>
                           <ScalePan terms={levelState.left} side="left" onDrop={(op) => handleOperation('left', op)} isTargeted={opApplied.side === 'right'}/>
                        </CardContent>
                    </Card>
                     <div className="text-5xl font-bold text-muted-foreground">=</div>
                     <Card className="w-1/2">
                        <CardHeader><CardTitle className="text-center">Right Side</CardTitle></CardHeader>
                        <CardContent>
                           <ScalePan terms={levelState.right} side="right" onDrop={(op) => handleOperation('right', op)} isTargeted={opApplied.side === 'left'}/>
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">Operations</CardTitle>
                        <CardDescription className="text-center">Drag an operation to BOTH sides of the scale.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4 items-center justify-center">
                        <OperationBlock op="+" value={1} /><OperationBlock op="-" value={1} />
                        <OperationBlock op="+" value={2} /><OperationBlock op="-" value={2} />
                        <OperationBlock op="+" value={3} /><OperationBlock op="-" value={3} />
                        <OperationBlock op="+" value={5} /><OperationBlock op="-" value={5} />
                        <OperationBlock op="x" value={2} /><OperationBlock op="÷" value={2} />
                        <OperationBlock op="x" value={3} /><OperationBlock op="÷" value={3} />
                    </CardContent>
                </Card>

                 {isLevelSolved && !allLevelsComplete && (
                    <div className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold font-headline">Level Complete!</h2>
                        <Button onClick={goToNextLevel} className="mt-4 animate-pulse">
                            Next Level <ArrowRight className="ml-2" />
                        </Button>
                    </div>
                )}
                 {allLevelsComplete && (
                    <div className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold font-headline">Equation Master!</h2>
                        <p className="text-muted-foreground">Great job balancing the scales!</p>
                    </div>
                )}
            </CardContent>
             <CardFooter className="flex justify-center items-center text-center bg-muted/30 p-4 border-t">
                <form onSubmit={handleSubmit} className="flex w-full max-w-md items-center space-x-2">
                    <p className="font-mono text-xl font-bold">x = </p>
                    <input
                        type="number"
                        placeholder="?"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={isLevelSolved}
                        className="w-24 text-center text-lg h-12 rounded-md border border-input"
                    />
                    <Button type="submit" className="h-12" disabled={isLevelSolved}>
                        Check Final Answer
                    </Button>
                </form>
            </CardFooter>
        </Card>
    </DndProvider>
  );
}
