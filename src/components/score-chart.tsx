
"use client";

import { useMemo } from 'react';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

type UserRank = {
  userId: string;
  username: string;
  score: number;
};

const MIN_WIDTH_PER_PLAYER = 60; // 60px per player

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

  const chartMinWidth = chartData.length * MIN_WIDTH_PER_PLAYER;

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-3xl font-bold">
          <BarChart3 /> Player Score Distribution
        </CardTitle>
        <CardDescription>A look at scores across all games. Use the scrollbar to see all players.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-[350px] w-full" />}
        {!isLoading && chartData.length > 0 && (
             <div className="h-[350px] w-full overflow-x-auto">
                <div style={{ width: Math.max(chartMinWidth, 500), height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 60 }}>
                            <XAxis dataKey="username" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" />
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
                            <Line type="monotone" dataKey="VectorZen" stroke="hsl(var(--chart-1))" dot={false} />
                            <Line type="monotone" dataKey="Algebra Arena" stroke="hsl(var(--chart-2))" dot={false} />
                            <Line type="monotone" dataKey="Equation Equilibrium" stroke="hsl(var(--chart-3))" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
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
