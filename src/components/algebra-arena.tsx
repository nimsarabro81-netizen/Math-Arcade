
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
import { produce } from 'immer';

const ItemTypes = {
  TOKEN: 'token',
};

const levels = ["3x+5x-x", "2x-3y+5x+6y", "5a*a-45", "3x*x+18xy-6y"];

interface Term {
  id: string;
  text: string;
  coefficient: number;
  variables: string;
  isPaired?: boolean;
  isNew?: boolean;
}

let termIdCounter = 0;

const parseExpression = (expr: string): Term[] => {
    let idCounter = 0;

    const simplifiedExpr = expr
        .replace(/\s/g, '')
        .replace(/([a-zA-Z])\*([a-zA-Z])/g, (_, v1, v2) => {
            if (v1 === v2) return `${v1}^2`;
            return [v1, v2].sort().join('');
        })
        .replace(/([+-])/g, ' $1') // Add space before operators to split correctly
        .trim();
    
    const rawTerms = simplifiedExpr.split(' ');

    return rawTerms.map(termStr => {
        if (!termStr) return null;
        
        const match = termStr.match(/([+-]?)(\d*(?:\.\d+)?)((?:[a-zA-Z]+\^?\d*)+|[a-zA-Z]*)/);
        if (!match) {
            const numMatch = termStr.match(/[+-]?\d*\.?\d+/);
            if(numMatch) {
                 return { id: `term-${termIdCounter++}`, text: termStr, coefficient: parseFloat(numMatch[0]), variables: 'constant' };
            }
            return null;
        }

        let signText = match[1];
        let coeffText = match[2];
        let varText = match[3];

        if (termStr.startsWith('+') || termStr.startsWith('-')) {
             // It's an operator, sign is already correct
        } else if (rawTerms.indexOf(termStr) > 0) {
             // It's not the first term and doesn't have an explicit sign, so it's positive.
             signText = '+';
        }

        const sign = signText === '-' ? -1 : 1;
        let coeff;

        if (coeffText === '' && varText !== '') {
            coeff = 1;
        } else if (coeffText !== '') {
            coeff = parseFloat(coeffText);
        } else {
            const numMatch = termStr.match(/[+-]?\d*\.?\d+/);
            if(numMatch) {
                 return { id: `term-${termIdCounter++}`, text: termStr, coefficient: parseFloat(numMatch[0]), variables: 'constant' };
            }
            return null;
        }
        
        const vars = varText || 'constant';
        const sortedVars = vars.match(/[a-zA-Z]\^?\d*/g)?.sort().join('') || 'constant';
        
        let termWithSign = termStr;
        if (sign > 0 && !termWithSign.startsWith('+') && rawTerms.indexOf(termStr) > 0) {
            termWithSign = `+${termWithSign}`;
        }
        
        return { id: `term-${termIdCounter++}`, text: termWithSign, coefficient: sign * coeff, variables: sortedVars };
    }).filter((t): t is Term => t !== null && t.coefficient !== 0);
};


const TermToken = ({ term, onClick, isSelected, isPlaced, isNew, isPaired }: { term: Term; onClick?: () => void; isSelected?: boolean; isPlaced?: boolean; isNew?: boolean, isPaired?: boolean }) => {  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.TOKEN,
    item: term,
    canDrag: !isPlaced,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const ref = isPlaced ? null : drag;

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'p-2 px-4 rounded-full border-2 bg-background shadow-md transition-all',
        isPlaced ? 'cursor-pointer' : 'cursor-grab',
        isDragging ? 'opacity-50 scale-110' : 'opacity-100',
        term.coefficient > 0 ? 'border-green-500' : 'border-red-500',
        isSelected && 'ring-2 ring-offset-2 ring-primary',
        isPaired && 'animate-fade-out-zero',
        isNew && 'animate-pop'
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
  onTermClick: (term: Term) => void;
  selectedIds: string[];
}

const CombiningZone = ({ variableType, onDrop, terms, onTermClick, selectedIds }: CombiningZoneProps) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.TOKEN,
    drop: (item: Term) => onDrop(item),
    canDrop: (item: Term) => item.variables === variableType,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  return (
    <div ref={drop} className={cn('p-4 rounded-lg border-2 border-dashed transition-all min-h-[100px] flex flex-col items-center justify-center', isOver && canDrop ? 'bg-primary/20 border-primary' : 'bg-muted/50')}>
        <p className="text-sm text-muted-foreground font-bold">{variableType === 'constant' ? 'Constants' : variableType}</p>
        <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {terms.map(t => (
                <TermToken 
                    key={t.id} 
                    term={t} 
                    isPlaced 
                    onClick={() => onTermClick(t)} 
                    isSelected={selectedIds.includes(t.id)}
                    isNew={t.isNew}
                    isPaired={t.isPaired}
                />
            ))}
        </div>
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
  const [selectedInZoneIds, setSelectedInZoneIds] = useState<string[]>([]);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const DndBackend = isMobile ? TouchBackend : HTML5Backend;

  const setupLevel = useCallback((levelIndex: number) => {
    termIdCounter = 0;
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
    setSelectedInZoneIds([]);
  }, []);

  useEffect(() => {
    setupLevel(currentLevelIndex);
  }, [currentLevelIndex, setupLevel]);

  const handleDropTerm = (term: Term) => {
    setUnplacedTerms(prev => prev.filter(t => t.id !== term.id));
    setZones(
        produce(draft => {
            if(!draft[term.variables]) draft[term.variables] = [];
            // When dropping, we want to show the sign if it's not the first term in the zone
            if (draft[term.variables].length > 0 && term.coefficient > 0 && !term.text.startsWith('+')) {
                term.text = `+${term.text}`;
            }
            draft[term.variables].push(term);
        })
    );
  };
  
    useEffect(() => {
        if (selectedInZoneIds.length !== 2) return;

        let zoneKey: string | null = null;
        let selectedTerms: Term[] = [];

        // Find which zone the selected terms are in
        for (const key in zones) {
            const termsInZone = zones[key];
            const foundTerms = termsInZone.filter(t => selectedInZoneIds.includes(t.id));
            if (foundTerms.length === 2) {
                zoneKey = key;
                selectedTerms = foundTerms;
                break;
            }
        }
        
        if (zoneKey && selectedTerms.length === 2) {
            // Set 'isPaired' for animation
            setZones(
                produce(draft => {
                    for (const term of selectedTerms) {
                        const termInZone = draft[zoneKey!].find(t => t.id === term.id);
                        if (termInZone) {
                            termInZone.isPaired = true;
                        }
                    }
                })
            );

            // After animation, update the state
            setTimeout(() => {
                const newCoefficient = selectedTerms.reduce((sum, t) => sum + t.coefficient, 0);
                
                setZones(
                    produce(draft => {
                        const currentZone = draft[zoneKey!];
                        // Remove the two old terms
                        draft[zoneKey!] = currentZone.filter(t => !selectedInZoneIds.includes(t.id));

                        if (newCoefficient !== 0) {
                            const variables = selectedTerms[0].variables;
                            let newText: string;

                            if (variables === 'constant') {
                                newText = `${newCoefficient}`;
                            } else {
                                if (newCoefficient === 1) newText = variables;
                                else if (newCoefficient === -1) newText = `-${variables}`;
                                else newText = `${newCoefficient}${variables}`;
                            }
                            
                            // Decide if a '+' sign is needed
                            const isFirstTerm = draft[zoneKey!].length === 0 && Object.values(draft).flat().length === 0;
                            if (newCoefficient > 0 && !isFirstTerm) {
                                newText = `+${newText}`;
                            }

                            const newTerm: Term = {
                                id: `term-${termIdCounter++}`,
                                text: newText,
                                coefficient: newCoefficient,
                                variables: variables,
                                isNew: true,
                            };
                            draft[zoneKey!].push(newTerm);
                        }
                    })
                );

                setSelectedInZoneIds([]);

                // Reset the 'isNew' flag after the pop animation
                setTimeout(() => {
                     setZones(produce(draft => {
                        const zone = draft[zoneKey!];
                        if (zone) {
                            zone.forEach(t => { t.isNew = false; });
                        }
                    }));
                }, 500);

            }, 500);
        } else {
            // Deselect if not a valid pair (e.g. from different zones)
            setTimeout(() => setSelectedInZoneIds([]), 500);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedInZoneIds]);

    const handleTermClickInZone = (term: Term) => {
        if (isLevelSolved || term.isPaired) return;
        
        setSelectedInZoneIds(prev => {
            // Deselect if clicked again
            if (prev.includes(term.id)) {
                return prev.filter(id => id !== term.id);
            }
            // Add to selection if less than 2 are selected
            if(prev.length < 2) {
                // Ensure the new selection is from the same zone as the first
                const firstSelectedTerm = zones[term.variables]?.find(t => t.id === prev[0]);
                if (prev.length === 0 || firstSelectedTerm) {
                    return [...prev, term.id];
                }
            }
            // If 2 are already selected, or it's from a different zone, do nothing
            return prev;
        });
    };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unplacedTerms.length > 0) {
        toast({ variant: 'destructive', title: 'Not so fast!', description: 'You must place all the terms first.' });
        return;
    }

    const simplified = Object.values(zones).flat().map(term => term.text).join('').replace(/^\+/, '');
    const normalize = (str: string) => str.replace(/\s/g, '').split(/(?=[+-])/).filter(Boolean).sort().join('');

    if (normalize(userAnswer) === normalize(simplified)) {
        toast({ title: 'Correct!', description: 'Expression simplified successfully!' });
        setIsLevelSolved(true);
    } else {
        toast({ variant: 'destructive', title: 'Not quite!', description: "That answer is incorrect. Try again!" });
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
                            onTermClick={handleTermClickInZone}
                            selectedIds={selectedInZoneIds}
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
                 {allLevelsComplete && (
                    <div className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold font-headline">All Levels Complete!</h2>
                        <p className="text-muted-foreground">Great job simplifying expressions!</p>
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
