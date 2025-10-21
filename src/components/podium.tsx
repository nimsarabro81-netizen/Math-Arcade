
'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';

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

  const getPodiumClass = (index: number) => {
    switch(index) {
        case 0: return "h-40 bg-yellow-400/80 shadow-[0_0_30px_10px_rgba(255,255,255,0.7)]";
        case 1: return "h-32 bg-gray-400/70";
        case 2: return "h-24 bg-yellow-700/60";
        default: return "";
    }
  }

  return (
    <Card className="shadow-lg h-full bg-grid bg-background overflow-hidden">
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl font-bold flex items-center justify-center gap-2">
          <Trophy /> Top Champions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8 px-4">
        {isLoading && (
            <div className="flex justify-around items-end h-40">
                <Skeleton className="w-24 h-32" />
                <Skeleton className="w-24 h-40" />
                <Skeleton className="w-24 h-24" />
            </div>
        )}
        {!isLoading && topPlayers.length > 0 && (
             <div className="flex justify-around items-end h-48">
                {topPlayers[1] && (
                    <div className="flex flex-col items-center text-center w-24">
                        <Avatar className="w-16 h-16 mb-2 border-4 border-gray-300">
                            <AvatarImage src={topPlayers[1].avatar} alt={topPlayers[1].username} />
                            <AvatarFallback>{topPlayers[1].username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={cn("relative w-full rounded-t-lg border-2 border-b-0 border-gray-300/50 backdrop-blur-sm transition-all flex flex-col justify-center items-center p-2", getPodiumClass(1))}>
                            <p className="font-bold text-lg text-white drop-shadow-md z-10">2nd</p>
                            <p className="font-mono text-sm font-semibold text-white/80 truncate">{topPlayers[1].username}</p>
                        </div>
                    </div>
                )}

                {topPlayers[0] && (
                    <div className="flex flex-col items-center text-center order-first sm:order-none -translate-y-4 w-28">
                        <div className="relative">
                            <div className="absolute inset-0 -m-3 rounded-full bg-primary/30 animate-pulse z-0"></div>
                            <Avatar className="w-20 h-20 mb-2 border-4 border-yellow-300 z-10 relative">
                                <AvatarImage src={topPlayers[0].avatar} alt={topPlayers[0].username} />
                                <AvatarFallback>{topPlayers[0].username.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                         <div className={cn("relative w-full rounded-t-lg border-2 border-b-0 border-yellow-300/50 backdrop-blur-sm transition-all flex flex-col justify-center items-center p-2", getPodiumClass(0))}>
                             <p className="font-extrabold text-2xl text-white drop-shadow-lg z-10">1st</p>
                             <p className="font-mono text-sm font-semibold text-white/90 truncate">{topPlayers[0].username}</p>
                        </div>
                    </div>
                )}
                
                {topPlayers[2] && (
                    <div className="flex flex-col items-center text-center w-24">
                         <Avatar className="w-16 h-16 mb-2 border-4 border-yellow-800">
                            <AvatarImage src={topPlayers[2].avatar} alt={topPlayers[2].username} />
                            <AvatarFallback>{topPlayers[2].username.charAt(0)}</AvatarFallback>
                        </Avatar>
                         <div className={cn("relative w-full rounded-t-lg border-2 border-b-0 border-yellow-800/50 backdrop-blur-sm transition-all flex flex-col justify-center items-center p-2", getPodiumClass(2))}>
                             <p className="font-bold text-lg text-white drop-shadow-md z-10">3rd</p>
                             <p className="font-mono text-sm font-semibold text-white/80 truncate">{topPlayers[2].username}</p>
                        </div>
                    </div>
                )}
             </div>
        )}
        {!isLoading && topPlayers.length === 0 && (
            <div className="text-center text-muted-foreground py-10 h-48 flex items-center justify-center">
                No players on the podium yet.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
