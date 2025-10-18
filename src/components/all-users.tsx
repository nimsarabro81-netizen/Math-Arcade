
'use client';

import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Atom, Puzzle, Divide } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

type UserRank = {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
};

type UserWithGames = {
    userId: string;
    username: string;
    avatar?: string;
    gamesPlayed: {
        vectorZen: number;
        algebra: number;
        equation: number;
    }
}

export function AllUsers() {
  const { firestore } = useFirebase();

  const userRanksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'userRanks'));
  }, [firestore]);

  const algebraRanksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'algebraRanks'));
  }, [firestore]);

  const equationRanksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'equationRanks'));
  }, [firestore]);

  const { data: vectorZenRanks, isLoading: loadingVector } = useCollection<UserRank>(userRanksQuery);
  const { data: algebraRanks, isLoading: loadingAlgebra } = useCollection<UserRank>(algebraRanksQuery);
  const { data: equationRanks, isLoading: loadingEquation } = useCollection<UserRank>(equationRanksQuery);

  const isLoading = loadingVector || loadingAlgebra || loadingEquation;

  const allUsers = useMemo(() => {
    if (isLoading || !vectorZenRanks || !algebraRanks || !equationRanks) {
      return [];
    }

    const userMap = new Map<string, UserWithGames>();

    const processRanks = (ranks: UserRank[], game: keyof UserWithGames['gamesPlayed']) => {
      ranks.forEach(rank => {
        if (!userMap.has(rank.userId)) {
          userMap.set(rank.userId, {
            userId: rank.userId,
            username: rank.username,
            avatar: rank.avatar,
            gamesPlayed: { vectorZen: 0, algebra: 0, equation: 0 }
          });
        }
        const user = userMap.get(rank.userId)!;
        user.gamesPlayed[game]++;
        if (rank.avatar && !user.avatar) {
            user.avatar = rank.avatar;
        }
      });
    };

    processRanks(vectorZenRanks, 'vectorZen');
    processRanks(algebraRanks, 'algebra');
    processRanks(equationRanks, 'equation');

    return Array.from(userMap.values()).sort((a, b) => a.username.localeCompare(b.username));
  }, [vectorZenRanks, algebraRanks, equationRanks, isLoading]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl font-bold flex items-center justify-center gap-2">
          <Users /> All Players
        </CardTitle>
        <CardDescription className="text-center">A list of all unique players and the games they've played.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-center">Games Played</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            {allUsers.length > 0 ? (
              allUsers.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3 font-medium">
                      <Avatar className="w-9 h-9 border-2 border-background">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center items-center gap-2 flex-wrap">
                        {user.gamesPlayed.vectorZen > 0 && 
                            <Badge variant="outline" className="gap-1.5 font-mono">
                                <Atom className="h-3 w-3 text-primary"/>
                                VectorZen: {user.gamesPlayed.vectorZen}
                            </Badge>
                        }
                        {user.gamesPlayed.algebra > 0 && 
                            <Badge variant="outline" className="gap-1.5 font-mono">
                                <Puzzle className="h-3 w-3 text-primary"/>
                                Algebra Arena: {user.gamesPlayed.algebra}
                            </Badge>
                        }
                        {user.gamesPlayed.equation > 0 && 
                            <Badge variant="outline" className="gap-1.5 font-mono">
                                <Divide className="h-3 w-3 text-primary"/>
                                Equation: {user.gamesPlayed.equation}
                            </Badge>
                        }
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center h-24">
                    No users found.
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
