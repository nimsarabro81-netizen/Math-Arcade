
"use client";

import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type UserProfile = {
  userId: string;
  username: string;
  avatar?: string;
};

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

  const { data: vectorZenRanks, isLoading: loadingVector } = useCollection<UserProfile>(userRanksQuery);
  const { data: algebraRanks, isLoading: loadingAlgebra } = useCollection<UserProfile>(algebraRanksQuery);
  const { data: equationRanks, isLoading: loadingEquation } = useCollection<UserProfile>(equationRanksQuery);

  const isLoading = loadingVector || loadingAlgebra || loadingEquation;

  const allUsers = useMemo(() => {
    if (isLoading || !vectorZenRanks || !algebraRanks || !equationRanks) {
      return [];
    }

    const userMap = new Map<string, UserProfile>();

    const processRanks = (ranks: UserProfile[]) => {
      ranks.forEach(rank => {
        if (!userMap.has(rank.userId)) {
          userMap.set(rank.userId, {
            userId: rank.userId,
            username: rank.username,
            avatar: rank.avatar
          });
        }
      });
    };

    processRanks(vectorZenRanks);
    processRanks(algebraRanks);
    processRanks(equationRanks);

    return Array.from(userMap.values()).sort((a, b) => a.username.localeCompare(b.username));
  }, [vectorZenRanks, algebraRanks, equationRanks, isLoading]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-center font-headline text-3xl font-bold flex items-center justify-center gap-2">
          <Users /> All Players
        </CardTitle>
        <CardDescription className="text-center">A list of all unique players across all games.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">User ID</TableHead>
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
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-32 ml-auto" />
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
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">{user.userId}</TableCell>
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
