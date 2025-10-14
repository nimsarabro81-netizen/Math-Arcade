"use client";

import { useMemo } from 'react';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type UserRank = {
  id: string;
  username: string;
  score: number;
};

export function Ranking() {
  const { firestore } = useFirebase();

  const userRanksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'userRanks'), orderBy('score', 'desc'), limit(10));
  }, [firestore]);

  const { data: rankings, isLoading } = useCollection<UserRank>(userRanksQuery);

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
        <CardTitle className="text-center font-headline text-3xl font-bold">
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Score</TableHead>
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
            {rankings && rankings.length > 0 ? (
              rankings.map((rank, index) => (
                <TableRow key={rank.id}>
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
                    No rankings yet. Be the first!
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
