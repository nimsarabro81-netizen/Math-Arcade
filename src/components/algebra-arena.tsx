
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
import { CheckCircle2, RotateCw, ArrowRight, ChevronLeft, ChevronRight, Puzzle, Lightbulb } from 'lucide-react';
import { produce } from 'immer';

const ItemTypes = {
  TOKEN: 'token',
  FACTOR_BLOCK: 'factor_block',
};

const levels = [
    "3x+5x-x",
    "2x-3y+5x-2y",
    "7x-y-5x+6y",
    "6x*x-12y",
    "3x*x+18xy-6y",
    "x*x-16",
    "5a*a-45",
    "x*x+5x+6",
    "x*x-9x+20",
    "a*a-2a-35"
];

const factorableSolutions: Record<string, { solutions: string[][], blocks: string[] }> = {
    "6x*x-12y": {
        solutions: [["6", "(x*x-2y)"]],
        blocks: ["6", "x", "y", "2", "(x*x-2y)", "12"]
    },
    "3x*x+18xy-6y": {
        solutions: [["3", "(x*x+6xy-2y)"]],
        blocks: ["3", "x", "y", "(x*x+6xy-2y)", "6", "(xy-y)"]
    },
    "x*x-16": {
        solutions: [["(x-4)", "(x+4)"], ["(x+4)", "(x-4)"]],
        blocks: ["(x-4)", "(x+4)", "(x-2)", "(x+2)", "(x-8)", "(x+8)"]
    },
    "5a*a-45": {
        solutions: [["5", "(a-3)", "(a+3)"], ["5", "(a+3)", "(a-3)"]],
        blocks: ["5", "(a-3)", "(a+3)", "a", "(a-9)", "(a+5)"]
    },
    "x*x+5x+6": {
        solutions: [["(x+2)", "(x+3)"], ["(x+3)", "(x+2)"]],
        blocks: ["(x+2)", "(x+3)", "(x+1)", "(x+6)", "(x-2)", "(x-3)"]
    },
    "x*x-9x+20": {
        solutions: [["(x-4)", "(x-5)"], ["(x-5)", "(x-4)"]],
        blocks: ["(x-4)", "(x-5)", "(x+4)", "(x+5)", "(x-10)", "(x-2)"]
    },
    "a*a-2a-35": {
        solutions: [["(a-7)", "(a+5)"], ["(a+5)", "(a-7)"]],
        blocks: ["(a-7)", "(a+5)", "(a+7)", "(a-5)", "(a-35)", "a"]
    }
};

const isFactorable = (expr: string) => Object.keys(factorableSolutions).includes(expr);

const formatWithSuperscript = (expr: string) => expr.replace(/([a-zA-Z])\*([a-zA-Z])/g, '$1²').replace(/\*/g, '').replace(/([a-zA-Z])\^2/g, '$1²');

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
        .replace(/\*([a-zA-Z])/g, '$1')
        .replace(/([+-])/g, ' $1')
        .trim();
    
    const rawTerms = simplifiedExpr.split(' ').filter(Boolean);

    return rawTerms.map((termStr, index) => {
        const match = termStr.match(/([+-]?)(\d*(?:\.\d+)?)((?:[a-zA-Z]\^?\d*)+|[a-zA-Z]+)?/);
        if (!match) return null;

        let [, signText, coeffText, varText = ''] = match;

        if (!signText && index > 0) {
           signText = '+';
        }

        const sign = signText === '-' ? -1 : 1;
        let coeff;

        if (coeffText === '' && varText !== '') {
            coeff = 1;
        } else if (coeffText !== '') {
            coeff = parseFloat(coeffText);
        } else {
             const numMatch = termStr.match(/[+-]?\d+/);
             if (numMatch) {
                 return { id: `term-${termIdCounter++}`, text: termStr, coefficient: parseFloat(numMatch[0]), variables: 'constant' };
             }
             return null;
        }
        
        const sortedVars = varText.replace(/\^2/g, (c) => c.repeat(2)).split('').sort().join('').replace(/([a-zA-Z])\1/g, '$1^2') || 'constant';
        
        let termWithSign = termStr;
        if (sign > 0 && !termWithSign.startsWith('+') && index > 0) {
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
        !isPlaced ? 'cursor-grab' : 'cursor-default',
        isDragging ? 'opacity-50 scale-110' : 'opacity-100',
        term.coefficient > 0 ? 'border-green-500' : 'border-red-500',
        isSelected && 'ring-2 ring-offset-2 ring-primary',
        isPaired && 'animate-fade-out-zero',
        isNew && 'animate-pop'
      )}
    >
      <span className="font-mono text-lg font-bold">{formatWithSuperscript(term.text)}</span>
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
        <p className="text-sm text-muted-foreground font-bold">{variableType === 'constant' ? 'Constants' : formatWithSuperscript(variableType)}</p>
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

const FactorBlock = ({ text, isPlaced }: { text: string, isPlaced?: boolean }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.FACTOR_BLOCK,
        item: { text },
        canDrag: !isPlaced,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className={cn(
                'p-2 px-4 rounded-lg border bg-card shadow-md cursor-grab transition-all',
                isDragging && 'opacity-50 scale-110',
                isPlaced && 'cursor-default bg-primary/10'
            )}
        >
            <span className="font-mono text-lg font-bold">{formatWithSuperscript(text)}</span>
        </div>
    );
};

const FactorSlot = ({ onDrop, placedBlock, onRemove }: { onDrop: (item: { text: string }) => void, placedBlock: string | null, onRemove: () => void }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.FACTOR_BLOCK,
        drop: onDrop,
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={drop}
            onClick={onRemove}
            className={cn(
                'h-16 rounded-lg border-2 border-dashed flex items-center justify-center transition-all',
                isOver ? 'bg-primary/20 border-primary' : 'bg-muted/50',
                placedBlock ? 'border-solid p-0 w-auto' : 'w-32'
            )}
        >
            {placedBlock ? <FactorBlock text={placedBlock} isPlaced /> : <span className="text-muted-foreground">Drop</span>}
        </div>
    );
};

interface AlgebraArenaProps {
    score: number;
    onScoreChange: (newScore: number) => void;
    onGameComplete: () => void;
}


export function AlgebraArena({ score, onScoreChange, onGameComplete }: AlgebraArenaProps) {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [unplacedTerms, setUnplacedTerms] = useState<Term[]>([]);
  const [zones, setZones] = useState<Record<string, Term[]>>({});
  const [variableTypes, setVariableTypes] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLevelSolved, setIsLevelSolved] = useState(false);
  const [selectedInZoneIds, setSelectedInZoneIds] = useState<string[]>([]);
  
  const [factorBlocks, setFactorBlocks] = useState<string[]>([]);
  const [factorSlots, setFactorSlots] = useState<Array<string | null>>([]);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const DndBackend = isMobile ? TouchBackend : HTML5Backend;

  const currentExpression = levels[currentLevelIndex];
  const isFactoringLevel = isFactorable(currentExpression);

  const setupLevel = useCallback((levelIndex: number) => {
    termIdCounter = 0;
    const expression = levels[levelIndex];
    
    if (isFactorable(expression)) {
        const levelData = factorableSolutions[expression];
        setFactorBlocks(levelData.blocks.sort(() => Math.random() - 0.5));
        setFactorSlots(Array(levelData.solutions[0].length).fill(null));
        setUnplacedTerms([]);
        setZones({});
        setVariableTypes([]);
    } else {
        const parsedTerms = parseExpression(expression);
        setUnplacedTerms(parsedTerms);
        const types = [...new Set(parsedTerms.map(t => t.variables))];
        setVariableTypes(types);
        const newZones: Record<string, Term[]> = {};
        types.forEach(type => { newZones[type] = []; })
        setZones(newZones);
        setFactorBlocks([]);
        setFactorSlots([]);
    }

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
            draft[term.variables].push(term);
        })
    );
  };
  
    useEffect(() => {
        if (selectedInZoneIds.length !== 2) return;

        let zoneKey: string | null = null;
        let selectedTerms: Term[] = [];

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
            setZones(
                produce(draft => {
                    for (const term of selectedTerms) {
                        const termInZone = draft[zoneKey!].find(t => t.id === term.id);
                        if (termInZone) termInZone.isPaired = true;
                    }
                })
            );

            setTimeout(() => {
                const newCoefficient = selectedTerms.reduce((sum, t) => sum + t.coefficient, 0);
                
                setZones(
                    produce(draft => {
                        const currentZone = draft[zoneKey!];
                        draft[zoneKey!] = currentZone.filter(t => !selectedInZoneIds.includes(t.id));

                        if (newCoefficient !== 0) {
                            const variables = selectedTerms[0].variables;
                            const newText = (coeff: number, vars: string) => {
                                let text = '';
                                if (coeff > 0) text += '+';
                                
                                if (vars === 'constant') return `${coeff}`;
                                if (coeff === 1 && vars !== '') return `+${vars}`;
                                if (coeff === -1 && vars !== '') return `-${vars}`;
                                
                                text += `${coeff}`;
                                if (vars !== 'constant') text += vars;
                                return text;
                            }
                            
                             const finalCoefficientText = (coeff: number, vars: string): string => {
                                const sign = coeff > 0 ? '+' : '-';
                                const absCoeff = Math.abs(coeff);
                                
                                if (vars === 'constant') return `${coeff}`;
                                
                                let cText = '';
                                if (absCoeff !== 1) {
                                    cText = String(absCoeff);
                                }
                                
                                return `${sign}${cText}${vars}`;
                            }
                            
                            const newTerm: Term = {
                                id: `term-${termIdCounter++}`,
                                text: finalCoefficientText(newCoefficient, variables),
                                coefficient: newCoefficient,
                                variables: variables,
                                isNew: true,
                            };
                            draft[zoneKey!].push(newTerm);
                        }
                    })
                );
                setSelectedInZoneIds([]);
                setTimeout(() => {
                     setZones(produce(draft => {
                        const zone = draft[zoneKey!];
                        if (zone) zone.forEach(t => { t.isNew = false; });
                    }));
                }, 500);
            }, 500);
        } else {
            setTimeout(() => setSelectedInZoneIds([]), 500);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedInZoneIds]);

    const handleTermClickInZone = (term: Term) => {
        if (isLevelSolved || term.isPaired) return;
        setSelectedInZoneIds(prev => {
            if (prev.includes(term.id)) return prev.filter(id => id !== term.id);
            if(prev.length < 2) {
                const firstSelectedTerm = zones[term.variables]?.find(t => t.id === prev[0]);
                if (prev.length === 0 || firstSelectedTerm) return [...prev, term.id];
            }
            return prev;
        });
    };
    
    const handleDropFactor = (index: number, item: { text: string }) => {
        setFactorSlots(produce(draft => {
            // Prevent dropping if the slot is already filled
            if (draft[index] !== null) return;
            
            // If the item is already in another slot, remove it from there first
            const existingIndex = draft.indexOf(item.text);
            if (existingIndex !== -1) {
                draft[existingIndex] = null;
            }

            draft[index] = item.text;
        }));
        setFactorBlocks(prev => prev.filter(b => b !== item.text));
    };

    const handleRemoveFactor = (index: number) => {
        const removedBlock = factorSlots[index];
        if (removedBlock) {
            setFactorSlots(produce(draft => {
                draft[index] = null;
            }));
            setFactorBlocks(prev => [...prev, removedBlock].sort(() => Math.random() - 0.5));
        }
    };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if(isFactoringLevel) {
        const possibleSolutions = factorableSolutions[currentExpression].solutions;
        const userSolution = factorSlots.filter((s): s is string => s !== null);

        const isCorrect = possibleSolutions.some(sol => 
            JSON.stringify(sol.sort()) === JSON.stringify(userSolution.sort())
        );

        if (isCorrect) {
            toast({ title: 'Correct!', description: 'Expression factored successfully!' });
            onScoreChange(score + 25);
            setIsLevelSolved(true);
            if (currentLevelIndex === levels.length - 1) onGameComplete();
        } else {
            toast({ variant: 'destructive', title: 'Not quite!', description: "That's not the correct factorization. Try again!" });
            onScoreChange(Math.max(0, score - 10));
        }
        return;
    }

    if (unplacedTerms.length > 0) {
        toast({ variant: 'destructive', title: 'Not so fast!', description: 'You must place all the terms first.' });
        return;
    }
    
    const finalSimplifiedExpression = Object.values(zones)
        .flat()
        .sort((a, b) => a.variables.localeCompare(b.variables))
        .map((t, index) => {
            let text = t.text.startsWith('+') ? t.text.substring(1) : t.text;
            if (t.coefficient > 0 && index > 0) {
                text = `+${text}`;
            }
            return text;
        })
        .join('')
        .replace(/^\+/, '');

    const normalize = (str: string) => str.replace(/\s/g, '').replace(/\*g/, '').split(/(?=[+-])/).filter(Boolean).sort().join('');

    if (normalize(userAnswer) === normalize(finalSimplifiedExpression)) {
        toast({ title: 'Correct!', description: 'Expression simplified successfully!' });
        onScoreChange(score + 15);
        setIsLevelSolved(true);
        if (currentLevelIndex === levels.length - 1) onGameComplete();
    } else {
        toast({ variant: 'destructive', title: 'Not quite!', description: "That answer is incorrect. Check your simplifications and try again." });
        onScoreChange(Math.max(0, score - 10));
    }
  };

  const resetLevel = () => {
    setupLevel(currentLevelIndex);
    onScoreChange(Math.max(0, score - 5));
    toast({ variant: 'destructive', title: 'Reset Penalty', description: '-5 points for resetting.' });
  }
  
    const handleHint = () => {
        if (!isFactoringLevel) return;

        const solution = factorableSolutions[currentExpression].solutions[0];
        const placedFactors = factorSlots.filter(s => s !== null);
        const unrevealedFactor = solution.find(f => !placedFactors.includes(f));

        if (unrevealedFactor) {
            toast({
                title: 'Hint Used!',
                description: `One of the factors is: ${formatWithSuperscript(unrevealedFactor)}`,
            });
            onScoreChange(Math.max(0, score - 15));
        } else {
            toast({
                title: 'No more hints!',
                description: "You've already found all the factors!",
            });
        }
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

  const formattedExpression = formatWithSuperscript(currentExpression);

  return (
    <DndProvider backend={DndBackend}>
        <Card className="w-full shadow-xl overflow-hidden border-primary/10 transition-all">
            <CardHeader className="p-4 border-b">
                <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="text-center px-4">
                            <p className="text-sm font-medium text-muted-foreground">
                                Level {currentLevelIndex + 1}: {isFactoringLevel ? 'Factor the Expression' : 'Simplify the Expression'}
                            </p>
                            <p className="font-mono text-xl sm:text-2xl font-bold">{formattedExpression}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isFactoringLevel && (
                            <Button onClick={handleHint} variant="outline" size="icon" aria-label="Get a hint" disabled={isLevelSolved}>
                                <Lightbulb />
                            </Button>
                        )}
                        <Button onClick={resetLevel} variant="ghost" size="icon" aria-label="Reset Level" className="border" disabled={isLevelSolved}>
                            <RotateCw />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                 {isFactoringLevel ? (
                    <div className="min-h-[250px] flex flex-col items-center justify-start space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold font-headline mb-2 text-center">Factor Slots</h2>
                            <p className="text-muted-foreground text-center mb-4">Drag the correct factors from the bank below into these slots.</p>
                            <div className="flex flex-wrap gap-4 items-center justify-center">
                                {factorSlots.map((block, index) => (
                                    <FactorSlot key={index} onDrop={(item) => handleDropFactor(index, item)} placedBlock={block} onRemove={() => handleRemoveFactor(index)} />
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-headline mb-2 text-center">Factor Bank</h3>
                             <div className="min-h-[80px] bg-grid rounded-lg p-4 flex flex-wrap gap-4 items-center justify-center border">
                                {factorBlocks.map(block => <FactorBlock key={block} text={block} />)}
                                {factorBlocks.length === 0 && <p className="text-muted-foreground">All blocks placed!</p>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="min-h-[80px] bg-grid rounded-lg p-4 flex flex-wrap gap-4 items-center justify-center">
                            {unplacedTerms.map(term => <TermToken key={term.id} term={term} />)}
                            {unplacedTerms.length === 0 && <p className="text-muted-foreground">Drop terms into the zones below!</p>}
                        </div>
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
                    </>
                )}

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
                        <h2 className="text-3xl font-bold font-headline">Algebra Master!</h2>
                        <p className="text-muted-foreground">Great job simplifying and factoring!</p>
                    </div>
                )}
            </CardContent>
             <CardFooter className="flex justify-center items-center text-center bg-muted/30 p-4 border-t">
                <form onSubmit={handleSubmit} className="flex w-full max-w-md items-center space-x-2">
                   {isFactoringLevel ? (
                        <Button type="submit" className="h-12 w-full" disabled={isLevelSolved}>
                            <Puzzle className="mr-2" /> Check Factors
                        </Button>
                   ) : (
                    <>
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
                    </>
                   )}
                </form>
            </CardFooter>
        </Card>
    </DndProvider>
  );
}
