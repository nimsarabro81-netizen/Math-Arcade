
'use client';

import { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, RotateCw, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const ItemTypes = {
  TOKEN: 'token',
};

const levels = ["3x+5x-x", "2x-3y+5x+6y", "5a*a-45", "3x*x+18xy-6y"];

interface Term {
  id: string;
  text: string;
  coefficient: number;
  variables: string;
}

const parseExpression = (expr: string): Term[] => {
    let idCounter = 0;
    
    // Handle multiplication of variables first, e.g., a*a -> a^2
    const simplifiedExpr = expr.replace(/([a-zA-Z])\*([a-zA-Z])/g, (_, v1, v2) => {
        if (v1 === v2) return `${v1}^2`;
        return [v1, v2].sort().join('');
    });

    // This regex is more robust and can handle terms with exponents, multiple variables, and constants.
    const terms = simplifiedExpr.replace(/\s/g, '').match(/[+-]?(?:\d*\.\d+|\d+)?(?:[a-zA-Z]+\^?\d*|\*?[a-zA-Z]+)*/g)?.filter(Boolean) || [];

    return terms.map(termStr => {
        const match = termStr.match(/([+-]?)(\d*\.?\d*)((?:[a-zA-Z]+\^?\d*)+|[a-zA-Z]*)/);
        if (!match) {
            return null;
        }

        const sign = match[1] === '-' ? -1 : 1;
        let coeff = parseFloat(match[2]);

        // Handle cases like 'x' or '-x' where coefficient is 1
        if (isNaN(coeff) && match[3]) {
            coeff = 1;
        } else if (isNaN(coeff)) {
            // This case handles standalone numbers that might have been matched
            const numMatch = termStr.match(/[+-]?\d*\.?\d+/);
            if(numMatch) {
                 return { id: `term-${idCounter++}`, text: termStr, coefficient: parseFloat(numMatch[0]), variables: 'constant' };
            }
            return null;
        }
        
        const vars = match[3] || 'constant';
        // Sort variables for consistency e.g. yx -> xy, but keep exponents with their base e.g., x^2y -> x^2y
        const sortedVars = vars.match(/[a-zA-Z]\^?\d*/g)?.sort().join('') || 'constant';
        
        return { id: `term-${idCounter++}`, text: termStr, coefficient: sign * coeff, variables: sortedVars };
    }).filter((t): t is Term => t !== null);
};


const TermToken = ({ term }: { term: Term }) => {  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TOKEN,
    item: term,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={cn(
        'p-2 px-4 rounded-full border-2 bg-background shadow-md cursor-grab transition-all',
        isDragging ? 'opacity-50 scale-110' : 'opacity-100',
        term.coefficient > 0 ? 'border-green-500' : 'border-red-500'
      )}
    >
      <span className="font-mono text-lg font-bold">{term.text}</span>
    </div>
  );
};

interface CombiningZoneProps {
  variableType: string;
  onDrop: (term: Term) => void;
  terms: Term[];
}

const CombiningZone = ({ variableType, onDrop, terms }: CombiningZoneProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.TOKEN,
    drop: (item: Term) => onDrop(item),
    canDrop: (item: Term) => item.variables === variableType,
    collect: (monitor) => ({
      isOver: !!monitor.isOver() && monitor.canDrop(),
    }),
  }));

  const total = terms.reduce((acc, t) => acc + t.coefficient, 0);

  const formatTerm = (coeff: number, vars: string) => {
    if (vars === 'constant') return coeff.toString();
    if (coeff === 0) return '';
    if (coeff === 1 && vars) return vars;
    if (coeff === -1 && vars) return `-${vars}`;
    return `${coeff}${vars}`;
  }

  const displayText = formatTerm(total, variableType);

  return (
    <div ref={drop} className={cn('p-4 rounded-lg border-2 border-dashed transition-all min-h-[100px] flex flex-col items-center justify-center', isOver ? 'bg-primary/20 border-primary' : 'bg-muted/50')}>
        <p className="text-sm text-muted-foreground font-bold">{variableType === 'constant' ? 'Constants' : variableType}</p>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {terms.map(t => <TermToken key={t.id} term={t} />)}
        </div>
        {terms.length > 0 && (
            <p className="font-mono text-2xl font-bold mt-4 pt-2 border-t-2 w-full text-center">{displayText}</p>
        )}
    </div>
  );
};


export function AlgebraArena() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [unplacedTerms, setUnplacedTerms] = useState<Term[]>([]);
  const [zones, setZones] = useState<Record<string, Term[]>>({});
  const [variableTypes, setVariableTypes] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const DndBackend = isMobile ? TouchBackend : HTML5Backend;

  const setupLevel = useCallback((levelIndex: number) => {
    const expression = levels[levelIndex];
    const parsedTerms = parseExpression(expression);
    setUnplacedTerms(parsedTerms);

    const types = [...new Set(parsedTerms.map(t => t.variables))];
    setVariableTypes(types);
    
    const newZones: Record<string, Term[]> = {};
    types.forEach(type => {
        newZones[type] = [];
    })
    setZones(newZones);

    setUserAnswer('');
    setIsLevelSolved(false);
  }, []);

  useEffect(() => {
    setupLevel(currentLevelIndex);
  }, [currentLevelIndex, setupLevel]);

  const handleDropTerm = (term: Term) => {
    setUnplacedTerms(prev => prev.filter(t => t.id !== term.id));
    setZones(prev => ({
        ...prev,
        [term.variables]: [...prev[term.variables], term],
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unplacedTerms.length > 0) {
        toast({ variant: 'destructive', title: 'Not so fast!', description: 'You must place all the terms first.' });
        return;
    }

    const simplified = Object.entries(zones).map(([vars, terms]) => {
        const total = terms.reduce((acc, t) => acc + t.coefficient, 0);
        if (total === 0) return '';
        if (vars === 'constant') return total.toString();
        if (total === 1 && vars !== 'constant') return vars;
        if (total === -1 && vars !== 'constant') return `-${vars}`;
        return `${total}${vars}`;
    }).filter(Boolean).join('+').replace(/\+-/g, '-');
    
    // A simple normalization for comparison
    const normalize = (str: string) => str.replace(/\s/g, '').split('+').sort().join('+');

    if (normalize(userAnswer) === normalize(simplified)) {
        toast({ title: 'Correct!', description: 'Expression simplified successfully!' });
        setIsLevelSolved(true);
    } else {
        toast({ variant: 'destructive', title: 'Not quite!', description: `The correct answer is ${simplified}. Try again!` });
    }
  };

  const resetLevel = () => {
    setupLevel(currentLevelIndex);
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
                            <p className="text-sm font-medium text-muted-foreground">Level {currentLevelIndex + 1}</p>
                            <p className="font-mono text-xl sm:text-2xl font-bold">{levels[currentLevelIndex]}</p>
                        </div>
                        <Button onClick={goToNextLevel} variant="outline" size="icon" aria-label="Next Level" disabled={!isLevelSolved || allLevelsComplete}>
                            <ChevronRight />
                        </Button>
                    </div>
                    <Button onClick={resetLevel} variant="ghost" size="icon" aria-label="Reset Level" className="border">
                        <RotateCw />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                {/* Unplaced Terms Area */}
                <div className="min-h-[80px] bg-grid rounded-lg p-4 flex flex-wrap gap-4 items-center justify-center">
                    {unplacedTerms.map(term => <TermToken key={term.id} term={term} />)}
                    {unplacedTerms.length === 0 && <p className="text-muted-foreground">Drop terms into the zones below!</p>}
                </div>
                
                {/* Combining Zones */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variableTypes.map(type => (
                        <CombiningZone 
                            key={type}
                            variableType={type}
                            onDrop={handleDropTerm}
                            terms={zones[type] || []}
                        />
                    ))}
                </div>
                 {isLevelSolved && !allLevelsComplete && (
                    <div className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold font-headline">Level Complete!</h2>
                        <Button onClick={goToNextLevel} className="mt-4 animate-pulse">
                            Next Level <ArrowRight className="ml-2" />
                        </Button>
                    </div>
                )}
            </CardContent>
             <CardFooter className="flex justify-center items-center text-center bg-muted/30 p-4 border-t">
                <form onSubmit={handleSubmit} className="flex w-full max-w-md items-center space-x-2">
                    <Input
                        type="text"
                        placeholder="Final Simplified Expression"
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
    </DndProvider>
  );
}

    