
"use client";

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';

type UserRank = {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
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

  const topThree = useMemo(() => {
    if (isLoading || !vectorZenRanks || !algebraRanks || !equationRanks) {
      return [];
    }

    const allScores: { [userId: string]: { username: string; avatar?: string; totalScore: number } } = {};

    const processRanks = (ranks: UserRank[]) => {
      ranks.forEach(rank => {
        if (!allScores[rank.userId]) {
          allScores[rank.userId] = { username: rank.username, avatar: rank.avatar, totalScore: 0 };
        }
        allScores[rank.userId].totalScore += rank.score;
        if(rank.avatar) allScores[rank.userId].avatar = rank.avatar;
      });
    };

    processRanks(vectorZenRanks);
    processRanks(algebraRanks);
    processRanks(equationRanks);

    return Object.values(allScores)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 3);
  }, [vectorZenRanks, algebraRanks, equationRanks, isLoading]);

  const getPodiumCardClass = (index: number) => {
    switch (index) {
      case 0: return 'border-yellow-500 bg-yellow-500/10 order-1 lg:order-2 -translate-y-6';
      case 1: return 'border-gray-400 bg-gray-400/10 order-2 lg:order-1';
      case 2: return 'border-yellow-700 bg-yellow-700/10 order-3 lg:order-3';
      default: return '';
    }
  };

  const getTrophyColor = (index: number) => {
    switch (index) {
        case 0: return 'text-yellow-500';
        case 1: return 'text-gray-400';
        case 2: return 'text-yellow-700';
        default: return '';
    }
  }

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl font-bold flex items-center justify-center gap-2">
          <Trophy /> Top Champions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8">
        {isLoading && (
            <div className="flex justify-around items-end h-64">
                <Skeleton className="w-32 h-48" />
                <Skeleton className="w-32 h-56" />
                <Skeleton className="w-32 h-40" />
            </div>
        )}
        {!isLoading && topThree.length > 0 && (
             <div className="grid grid-cols-1 lg:grid-cols-3 items-end gap-4 text-center">
                {topThree.map((player, index) => (
                    <div key={player.username} className={cn("flex flex-col items-center", index === 0 ? 'order-1 lg:order-2 animate-bounce' : (index === 1 ? 'order-2 lg:order-1' : 'order-3'))}>
                         <Card className={cn("p-4 w-full transform transition-transform hover:scale-105", getPodiumCardClass(index))}>
                            <Award className={cn("w-10 h-10 mx-auto mb-2", getTrophyColor(index))} />
                            <Avatar className="w-20 h-20 mx-auto mb-2 border-4 border-background">
                                <AvatarImage src={player.avatar} alt={player.username} />
                                <AvatarFallback>{player.username.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <p className="font-bold text-lg truncate">{player.username}</p>
                            <p className="font-mono text-2xl font-extrabold text-primary">{player.totalScore}</p>
                            <p className="text-sm font-medium text-muted-foreground">{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} Place</p>
                        </Card>
                    </div>
                ))}
             </div>
        )}
        {!isLoading && topThree.length === 0 && (
            <div className="text-center text-muted-foreground py-10">
                No players on the podium yet.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
