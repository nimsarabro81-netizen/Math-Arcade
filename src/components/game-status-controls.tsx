
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from './ui/skeleton';

type GameSetting = {
  id: string;
  isActive: boolean;
};

const games = [
  { id: 'vector-zen', name: 'VectorZen' },
  { id: 'algebra', name: 'Algebra Arena' },
  { id: 'equation', name: 'Equation Equilibrium' },
];

export function GameStatusControls() {
  const { firestore } = useFirebase();

  const gameSettingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'gameSettings');
  }, [firestore]);

  const { data: gameSettings, isLoading } = useCollection<GameSetting>(gameSettingsQuery);

  // Initialize settings in Firestore if they don't exist
  useEffect(() => {
    if (!firestore || isLoading || gameSettings === null) return;

    games.forEach(game => {
      const settingExists = gameSettings.some(setting => setting.id === game.id);
      if (!settingExists) {
        const gameDocRef = doc(firestore, 'gameSettings', game.id);
        const initialSetting = { id: game.id, isActive: true };
        setDocumentNonBlocking(gameDocRef, initialSetting, { merge: true });
      }
    });
  }, [firestore, gameSettings, isLoading]);
  
  const handleToggle = (gameId: string, isActive: boolean) => {
    if (!firestore) return;
    const gameDocRef = doc(firestore, 'gameSettings', gameId);
    setDocumentNonBlocking(gameDocRef, { isActive }, { merge: true });
  };

  const getGameStatus = (gameId: string) => {
    return gameSettings?.find(setting => setting.id === gameId)?.isActive ?? false;
  };

  return (
    <Card className="shadow-lg mb-8">
      <CardHeader>
        <CardTitle>Game Availability</CardTitle>
        <CardDescription>
          Toggle the switches to activate or deactivate games on the welcome screen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading &&
          games.map(game => (
            <div key={game.id} className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        {!isLoading &&
          games.map(game => (
            <div key={game.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <Label htmlFor={`game-switch-${game.id}`} className="text-lg font-medium">
                {game.name}
              </Label>
              <Switch
                id={`game-switch-${game.id}`}
                checked={getGameStatus(game.id)}
                onCheckedChange={checked => handleToggle(game.id, checked)}
                aria-label={`Activate ${game.name}`}
              />
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
