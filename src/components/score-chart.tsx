
"use client";

import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { BarChart3 } from 'lucide-react';

type UserRank = {
  userId: string;
  username: string;
  score: number;
};

export function ScoreChart() {
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

  const chartData = useMemo(() => {
    if (isLoading || !vectorZenRanks || !algebraRanks || !equationRanks) {
      return [];
    }

    const allScores: { [userId: string]: { username: string; vectorZen?: number; algebra?: number; equation?: number } } = {};

    const processRanks = (ranks: UserRank[], game: 'vectorZen' | 'algebra' | 'equation') => {
      ranks.forEach(rank => {
        if (!allScores[rank.userId]) {
          allScores[rank.userId] = { username: rank.username };
        }
        allScores[rank.userId][game] = rank.score;
      });
    };

    processRanks(vectorZenRanks, 'vectorZen');
    processRanks(algebraRanks, 'algebra');
    processRanks(equationRanks, 'equation');

    return Object.values(allScores).map(data => ({
      username: data.username,
      VectorZen: data.vectorZen || 0,
      "Algebra Arena": data.algebra || 0,
      "Equation Equilibrium": data.equation || 0,
    })).sort((a,b) => a.username.localeCompare(b.username));
  }, [vectorZenRanks, algebraRanks, equationRanks, isLoading]);

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-3xl font-bold">
          <BarChart3 /> Player Score Distribution
        </CardTitle>
        <CardDescription>A look at scores across all games. Drag the slider to see more players.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-[350px] w-full" />}
        {!isLoading && chartData.length > 0 && (
             <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="username" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            cursor={{fill: 'hsl(var(--muted))'}}
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend wrapperStyle={{fontSize: "14px"}} />
                        <Bar dataKey="VectorZen" stackId="a" fill="hsl(var(--chart-1))" />
                        <Bar dataKey="Algebra Arena" stackId="a" fill="hsl(var(--chart-2))" />
                        <Bar dataKey="Equation Equilibrium" stackId="a" fill="hsl(var(--chart-3))" />
                        <Brush dataKey="username" height={30} stroke="hsl(var(--primary))" travellerWidth={20} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        )}
         {!isLoading && chartData.length === 0 && (
            <div className="flex h-[350px] items-center justify-center text-center text-muted-foreground">
                <p>No score data available to display in the chart.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
