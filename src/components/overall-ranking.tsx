
"use client";

import { useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type UserRank = {
  id: string;
  userId: string;
  username: string;
  score: number;
};

export function OverallRanking() {
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

  const overallRankings = useMemo(() => {
    if (isLoading || !vectorZenRanks || !algebraRanks || !equationRanks) {
      return [];
    }

    const allScores: { [userId: string]: { username: string; totalScore: number } } = {};

    const processRanks = (ranks: UserRank[]) => {
      ranks.forEach(rank => {
        if (!allScores[rank.userId]) {
          allScores[rank.userId] = { username: rank.username, totalScore: 0 };
        }
        allScores[rank.userId].totalScore += rank.score;
      });
    };

    processRanks(vectorZenRanks);
    processRanks(algebraRanks);
    processRanks(equationRanks);

    return Object.entries(allScores)
      .map(([userId, data]) => ({
        userId,
        username: data.username,
        score: data.totalScore,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [vectorZenRanks, algebraRanks, equationRanks, isLoading]);

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'text-yellow-500';
      case 1:
        return 'text-gray-400';
      case 2:
        return 'text-yellow-700';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl font-bold flex items-center justify-center gap-2">
          <Trophy /> Overall Top Players
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Total Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {overallRankings.length > 0 ? (
              overallRankings.map((rank, index) => (
                <TableRow key={rank.userId}>
                  <TableCell className="font-bold text-lg">
                    <div className="flex items-center justify-center">
                      {index < 3 ? <Award className={`w-6 h-6 ${getRankColor(index)}`} /> : <span className="text-muted-foreground">{index + 1}</span>}
                    </div>
                  </TableCell>
                  <TableCell>{rank.username}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{rank.score}</TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No combined rankings yet.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
