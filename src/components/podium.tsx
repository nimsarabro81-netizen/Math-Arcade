
'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Atom, Puzzle, Divide } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type UserRank = {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
};

type TopPlayer = {
  userId: string;
  username: string;
  avatar?: string;
  totalScore: number;
  scores: {
    vectorZen: number;
    algebra: number;
    equation: number;
  };
};

export function Podium() {
  const { firestore } = useFirebase();

  const userRanksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'userRanks'), orderBy('score', 'desc'));
  }, [firestore]);

  const algebraRanksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'algebraRanks'), orderBy('score', 'desc'));
  }, [firestore]);

  const equationRanksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'equationRanks'), orderBy('score', 'desc'));
  }, [firestore]);

  const { data: vectorZenRanks, isLoading: loadingVector } = useCollection<UserRank>(userRanksQuery);
  const { data: algebraRanks, isLoading: loadingAlgebra } = useCollection<UserRank>(algebraRanksQuery);
  const { data: equationRanks, isLoading: loadingEquation } = useCollection<UserRank>(equationRanksQuery);

  const isLoading = loadingVector || loadingAlgebra || loadingEquation;

  const topPlayers = useMemo(() => {
    if (isLoading || !vectorZenRanks || !algebraRanks || !equationRanks) {
      return [];
    }

    const allScores: { [userId: string]: { userId: string; username: string; avatar?: string; totalScore: number; scores: { vectorZen: number; algebra: number; equation: number; } } } = {};

    const processRanks = (ranks: UserRank[], game: keyof TopPlayer['scores']) => {
        ranks.forEach(rank => {
            if (!allScores[rank.userId]) {
                allScores[rank.userId] = {
                    userId: rank.userId,
                    username: rank.username,
                    avatar: rank.avatar,
                    totalScore: 0,
                    scores: { vectorZen: 0, algebra: 0, equation: 0 }
                };
            }
             if (rank.score > allScores[rank.userId].scores[game]) {
                allScores[rank.userId].scores[game] = rank.score;
            }
            if (rank.avatar && !allScores[rank.userId].avatar) {
                allScores[rank.userId].avatar = rank.avatar;
            }
        });
    };

    processRanks(vectorZenRanks, 'vectorZen');
    processRanks(algebraRanks, 'algebra');
    processRanks(equationRanks, 'equation');

    Object.values(allScores).forEach(player => {
        player.totalScore = player.scores.vectorZen + player.scores.algebra + player.scores.equation;
    });

    return Object.values(allScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);
  }, [vectorZenRanks, algebraRanks, equationRanks, isLoading]);
  
  const getRankClasses = (index: number) => {
    switch (index) {
        case 0: return { card: 'bg-yellow-400/20 border-yellow-500/50', avatar: 'border-yellow-400' };
        case 1: return { card: 'bg-gray-400/20 border-gray-500/50', avatar: 'border-gray-400' };
        case 2: return { card: 'bg-yellow-700/20 border-yellow-800/50', avatar: 'border-yellow-700' };
        default: return { card: 'bg-card', avatar: 'border-muted' };
    }
  }

  return (
     <Card className="shadow-lg h-full">
        <CardHeader>
            <CardTitle className="text-center font-headline text-3xl font-bold flex items-center justify-center gap-2">
                <Trophy /> Top Champions
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
            {isLoading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            
            {!isLoading && topPlayers.length > 0 && (
                <TooltipProvider>
                    {topPlayers.map((player, index) => (
                        <Tooltip key={player.userId} delayDuration={100}>
                            <TooltipTrigger asChild>
                                <Card className={cn("flex items-center p-4 gap-4 transition-transform hover:scale-105", getRankClasses(index).card)}>
                                    <span className="text-3xl font-bold w-8 text-center">{index + 1}</span>
                                    <Avatar className={cn("w-12 h-12 border-4", getRankClasses(index).avatar)}>
                                        <AvatarImage src={player.avatar} alt={player.username} />
                                        <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="font-bold text-lg truncate">{player.username}</p>
                                        <p className="text-muted-foreground font-mono">Total Score: {player.totalScore}</p>
                                    </div>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="w-64 p-4">
                                <h4 className="font-bold mb-2">Score Breakdown</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-muted-foreground"><Atom className="h-4 w-4"/> VectorZen</span>
                                        <span className="font-mono font-bold">{player.scores.vectorZen}</span>
                                    </li>
                                     <li className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-muted-foreground"><Puzzle className="h-4 w-4"/> Algebra Arena</span>
                                        <span className="font-mono font-bold">{player.scores.algebra}</span>
                                    </li>
                                     <li className="flex items-center justify-between">
                                        <span className="flex items-center gap-2 text-muted-foreground"><Divide className="h-4 w-4"/> Equation</span>
                                        <span className="font-mono font-bold">{player.scores.equation}</span>
                                    </li>
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            )}

            {!isLoading && topPlayers.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    No players on the podium yet.
                </div>
            )}
        </CardContent>
    </Card>
  );
}
