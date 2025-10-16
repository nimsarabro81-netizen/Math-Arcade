
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Atom, Divide, Puzzle } from 'lucide-react';

const games = [
  {
    title: 'VectorZen',
    description: 'Master integers with addition, subtraction, and multiplication in a visual, interactive way.',
    link: '/vector-zen',
    icon: <Atom className="w-12 h-12 text-primary" />,
  },
  {
    title: 'Algebra Arena',
    description: 'Simplify and factor expressions by dragging, dropping, and combining algebraic terms.',
    link: '/algebra',
    icon: <Puzzle className="w-12 h-12 text-primary" />,
  },
  {
    title: 'Equation Equilibrium',
    description: 'Solve for variables by balancing equations on a visual scale. A true test of logic!',
    link: '/equation',
    icon: <Divide className="w-12 h-12 text-primary" />,
  },
];

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl mx-auto text-center">
        <header className="mb-12">
          <h1 className="font-headline text-6xl md:text-8xl font-bold text-primary animate-fade-in">
            Math Arcade
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
            A collection of games to sharpen your mathematical mind.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game, index) => (
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
          ))}
        </div>
      </div>
    </main>
  );
}
