
'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Atom, Puzzle, Divide } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

type UserRank = {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
};

type TopPlayer = {
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

    const allScores: { [userId: string]: { username: string; avatar?: string; totalScore: number; scores: { vectorZen: number; algebra: number; equation: number; } } } = {};

    const processRanks = (ranks: UserRank[], game: keyof TopPlayer['scores']) => {
      ranks.forEach(rank => {
        if (!allScores[rank.userId]) {
          allScores[rank.userId] = {
            username: rank.username,
            avatar: rank.avatar,
            totalScore: 0,
            scores: { vectorZen: 0, algebra: 0, equation: 0 }
          };
        }
        allScores[rank.userId].totalScore += rank.score;
        allScores[rank.userId].scores[game] += rank.score;
        if (rank.avatar && !allScores[rank.userId].avatar) {
          allScores[rank.userId].avatar = rank.avatar;
        }
      });
    };

    processRanks(vectorZenRanks, 'vectorZen');
    processRanks(algebraRanks, 'algebra');
    processRanks(equationRanks, 'equation');

    return Object.values(allScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);
  }, [vectorZenRanks, algebraRanks, equationRanks, isLoading]);

  const getPodiumCardClass = (index: number) => {
    switch (index) {
      case 0: return 'border-yellow-500 bg-yellow-500/10 hover:shadow-[0_0_20px_5px_rgba(234,179,8,0.5)]';
      case 1: return 'border-gray-400 bg-gray-400/10 hover:shadow-[0_0_20px_5px_rgba(156,163,175,0.5)]';
      case 2: return 'border-yellow-700 bg-yellow-700/10 hover:shadow-[0_0_20px_5px_rgba(180,83,9,0.5)]';
      default: return '';
    }
  };

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl font-bold flex items-center justify-center gap-2">
          <Trophy /> Top Champions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8">
        {isLoading && (
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="w-full h-32 max-w-lg" />
                <Skeleton className="w-full h-32 max-w-lg" />
                <Skeleton className="w-full h-32 max-w-lg" />
            </div>
        )}
        {!isLoading && topPlayers.length > 0 && (
             <div className="flex flex-col items-center gap-4">
                {topPlayers.map((player, index) => (
                    <div key={player.username} className={cn("group w-full max-w-lg", index === 0 && 'animate-bounce' )}>
                         <Card className={cn(
                           "p-4 w-full transform transition-all duration-300 overflow-hidden", 
                           getPodiumCardClass(index),
                           'group-hover:pl-8'
                          )}>
                            <div className="flex items-center transition-all duration-500 ease-in-out">
                               <div className="flex-shrink-0 w-0 opacity-0 group-hover:w-1/2 group-hover:opacity-100 transition-all duration-500 ease-in-out space-y-2">
                                  <h4 className="font-bold text-sm mb-2 text-left">Score Card</h4>
                                   <div className='flex items-center justify-between text-xs'>
                                      <Badge variant="outline" className="gap-1.5 font-mono"><Atom className="h-3 w-3 text-primary"/> VectorZen</Badge>
                                      <span className="font-bold">{player.scores.vectorZen}</span>
                                   </div>
                                   <div className='flex items-center justify-between text-xs'>
                                      <Badge variant="outline" className="gap-1.5 font-mono"><Puzzle className="h-3 w-3 text-primary"/> Algebra</Badge>
                                      <span className="font-bold">{player.scores.algebra}</span>
                                   </div>
                                    <div className='flex items-center justify-between text-xs'>
                                      <Badge variant="outline" className="gap-1.5 font-mono"><Divide className="h-3 w-3 text-primary"/> Equation</Badge>
                                      <span className="font-bold">{player.scores.equation}</span>
                                   </div>
                               </div>

                               <div className="w-full group-hover:w-1/2 transition-all duration-500 ease-in-out flex flex-col items-center text-center">
                                    <Avatar className="w-16 h-16 mb-2 border-4 border-background">
                                        <AvatarImage src={player.avatar} alt={player.username} />
                                        <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-bold text-lg truncate">{player.username}</p>
                                    <p className="font-mono text-2xl font-extrabold text-primary">{player.totalScore}</p>
                                    <p className="text-sm font-medium text-muted-foreground">{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} Place</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
             </div>
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
