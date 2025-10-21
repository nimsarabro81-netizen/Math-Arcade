
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Atom, Divide, Puzzle, LogOut } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { ProfileCreator } from '@/components/profile-creator';
import { usePlayerIdentity } from '@/hooks/use-player-identity';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type GameSetting = {
  id: string;
  isActive: boolean;
};

const gameDetails = {
  'vector-zen': {
    title: 'VectorZen',
    description: 'Master integers with addition, subtraction, and multiplication in a visual, interactive way.',
    link: '/vector-zen',
    icon: <Atom className="w-12 h-12 text-primary" />,
  },
  'algebra': {
    title: 'Algebra Arena',
    description: 'Simplify and factor expressions by dragging, dropping, and combining algebraic terms.',
    link: '/algebra',
    icon: <Puzzle className="w-12 h-12 text-primary" />,
  },
  'equation': {
    title: 'Equation Equilibrium',
    description: 'Solve for variables by balancing equations on a visual scale. A true test of logic!',
    link: '/equation',
    icon: <Divide className="w-12 h-12 text-primary" />,
  },
};

export default function WelcomePage() {
  const { firestore } = useFirebase();
  const { identity, isIdentityLoaded, setIdentity } = usePlayerIdentity();

  const gameSettingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'gameSettings'));
  }, [firestore]);

  const { data: gameSettings, isLoading } = useCollection<GameSetting>(gameSettingsQuery);

  const activeGames = gameSettings
    ?.filter(game => game.isActive)
    .map(game => ({ ...game, ...gameDetails[game.id as keyof typeof gameDetails] }))
    .filter(game => game.title); 

  const handleProfileCreated = (username: string, avatar: string) => {
    setIdentity({ username, avatar });
  };
  
  const handleLogout = () => {
    setIdentity(null);
  };
  
  if (!isIdentityLoaded) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
            <Skeleton className="h-96 w-full max-w-4xl" />
        </main>
    )
  }

  const titleText = "Math Arcade";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto text-center">
        <header className="mb-12">
          <h1 className="font-headline text-6xl md:text-8xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
            {titleText.split("").map((char, index) => (
              <span
                key={index}
                className="inline-block animate-float"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </h1>
           {identity ? (
             <div className="flex flex-col items-center gap-4 mt-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20 shadow-lg">
                    <AvatarImage src={identity.avatar} alt={identity.username} />
                    <AvatarFallback>{identity.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-lg md:text-xl text-muted-foreground">
                    Welcome, {identity.username}! Choose a game to play.
                </p>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Change Profile
                </Button>
             </div>
           ) : (
             <p className="mt-4 text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                A collection of games to sharpen your mathematical mind.
             </p>
           )}
        </header>

        {!identity ? (
            <ProfileCreator onProfileCreated={handleProfileCreated} />
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {isLoading && (
                <>
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                </>
            )}
            {!isLoading && activeGames && activeGames.length > 0 ? (
                activeGames.map((game, index) => (
                <Card 
                    key={game.title} 
                    className="group flex flex-col transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:border-primary/50 animate-fade-in"
                    style={{ animationDelay: `${(index + 1) * 0.2}s` }}
                >
                    <CardHeader className="items-center">
                    <div className="p-4 bg-primary/10 rounded-full transition-transform duration-300 group-hover:rotate-12">
                        {game.icon}
                    </div>
                    <CardTitle className="mt-4 font-headline text-3xl">{game.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    <CardDescription className="h-16">{game.description}</CardDescription>
                    </CardContent>
                    <CardFooter>
                    <Link href={game.link} passHref className="w-full">
                        <Button className="w-full">Play Now</Button>
                    </Link>
                    </CardFooter>
                </Card>
                ))
            ) : (
                !isLoading && (
                <div className="md:col-span-3 text-center text-muted-foreground py-10">
                    <p>No active games available right now. Please check back later!</p>
                </div>
                )
            )}
            </div>
        )}
      </div>
    </main>
  );
}
